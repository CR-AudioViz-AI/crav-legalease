import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { 
      userId, 
      title, 
      originalContent, 
      convertedContent,
      documentType = 'other'
    } = await request.json()

    if (!userId || !title || !originalContent) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Try to save to database
    const { data, error } = await supabase
      .from('legalease_documents')
      .insert({
        user_id: userId,
        title,
        original_content: originalContent,
        converted_content: convertedContent,
        document_type: documentType,
        status: 'completed'
      })
      .select()
      .single()

    if (error) {
      // Table doesn't exist yet - that's OK, return success anyway
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('legalease_documents table not yet created - conversion successful but not saved')
        return NextResponse.json({
          success: true,
          saved: false,
          message: 'Document converted successfully. History feature will be available after database setup.',
          data: {
            id: `temp-${Date.now()}`,
            title,
            documentType,
            createdAt: new Date().toISOString()
          }
        })
      }
      
      // Other errors
      throw error
    }

    return NextResponse.json({
      success: true,
      saved: true,
      message: 'Document converted and saved successfully',
      data
    })

  } catch (error: any) {
    console.error('Save document error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save document',
        details: error.message,
        success: false,
        saved: false
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabase
      .from('legalease_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      // Table doesn't exist yet
      if (error.code === '42P01' || error.message.includes('relation')) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'History feature not yet available'
        })
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error.message }, 
      { status: 500 }
    )
  }
}
