import { NextRequest, NextResponse } from 'next/server';
import { convertLegalToPlain, convertPlainToLegal } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateCost, estimateTokens } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { documentId, text, type, userId } = await req.json();

    if (!documentId || !text || !type || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user credits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const estimatedTokens = estimateTokens(text);
    const creditsNeeded = Math.ceil(estimatedTokens / 1000);

    if (profile.credits < creditsNeeded) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Perform conversion
    let result;
    if (type === 'legal_to_plain') {
      result = await convertLegalToPlain(text);
    } else {
      result = await convertPlainToLegal(text);
    }

    // Update document
    const { error: updateError } = await supabaseAdmin
      .from('legal_documents')
      .update({
        converted_text: result.convertedText,
        status: 'completed',
        credits_used: creditsNeeded,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }

    // Create conversion session
    const { error: sessionError } = await supabaseAdmin
      .from('conversion_sessions')
      .insert({
        document_id: documentId,
        messages: [
          { role: 'user', content: text },
          { role: 'assistant', content: result.convertedText }
        ],
        questions_asked: result.questions,
        key_terms: result.keyTerms,
        critical_points: result.criticalPoints,
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
    }

    // Deduct credits
    const { error: creditError } = await supabaseAdmin
      .from('user_profiles')
      .update({ credits: profile.credits - creditsNeeded })
      .eq('user_id', userId);

    if (creditError) {
      console.error('Failed to deduct credits:', creditError);
    }

    // Log usage
    await supabaseAdmin.from('usage_logs').insert({
      user_id: userId,
      document_id: documentId,
      action: 'conversion',
      conversion_type: type,
      tokens_used: result.tokensUsed,
      cost: calculateCost(result.tokensUsed),
      success: true,
    });

    return NextResponse.json({
      success: true,
      convertedText: result.convertedText,
      keyTerms: result.keyTerms,
      criticalPoints: result.criticalPoints,
      questions: result.questions,
      creditsUsed: creditsNeeded,
      remainingCredits: profile.credits - creditsNeeded,
    });
  } catch (error) {
    console.error('Conversion error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Conversion failed' },
      { status: 500 }
    );
  }
}
