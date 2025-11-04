import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { convertLegalToPlain, convertPlainToLegal, extractKeyTerms, generateSummary } from '@/lib/openai'
import { calculateCreditsUsed } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { text, conversionType, userId } = await request.json()

    if (!text || !conversionType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check user's available credits from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate credits needed
    const creditsNeeded = calculateCreditsUsed(text.length, conversionType)

    if (profile.credits_balance < creditsNeeded) {
      return NextResponse.json(
        { error: 'Insufficient credits', creditsNeeded, available: profile.credits_balance },
        { status: 402 }
      )
    }

    // Perform conversion
    let convertedText: string
    if (conversionType === 'legal-to-plain') {
      convertedText = await convertLegalToPlain(text)
    } else if (conversionType === 'plain-to-legal') {
      convertedText = await convertPlainToLegal(text)
    } else {
      return NextResponse.json(
        { error: 'Invalid conversion type' },
        { status: 400 }
      )
    }

    // Extract key terms and generate summary (only for legal-to-plain)
    let keyTerms = null
    let summary = null
    if (conversionType === 'legal-to-plain') {
      [keyTerms, summary] = await Promise.all([
        extractKeyTerms(text),
        generateSummary(text),
      ])
    }

    // Deduct credits from profiles table
    const newBalance = profile.credits_balance - creditsNeeded
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating credits:', updateError)
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }

    // Log transaction in credit_transactions table
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: -creditsNeeded,
      type: 'usage',
      description: `LegalEase: ${conversionType} conversion`,
      app_name: 'legalease',
      metadata: {
        text_length: text.length,
        conversion_type: conversionType,
      },
    })

    // Save document to legalease_documents table
    const { data: document, error: docError } = await supabaseAdmin
      .from('legalease_documents')
      .insert({
        user_id: userId,
        title: `${conversionType === 'legal-to-plain' ? 'Legal to Plain' : 'Plain to Legal'} Conversion`,
        original_content: text,
        converted_content: convertedText,
        conversion_type: conversionType,
        document_type: 'other',
        status: 'completed',
        credits_used: creditsNeeded,
        key_terms: keyTerms,
        summary: summary,
      })
      .select()
      .single()

    if (docError) {
      console.error('Error saving document:', docError)
    }

    return NextResponse.json({
      success: true,
      convertedText,
      keyTerms,
      summary,
      creditsUsed: creditsNeeded,
      remainingCredits: newBalance,
      documentId: document?.id,
    })
  } catch (error: any) {
    console.error('Conversion error:', error)
    return NextResponse.json(
      { error: error.message || 'Conversion failed' },
      { status: 500 }
    )
  }
}
