import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/archive/[id]/recall - Recall (unarchive) a document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { recalled_by, recall_reason } = body

    const { data, error } = await supabase
      .from('legalease_documents')
      .update({
        is_archived: false,
        archived_at: null,
        archived_by: null,
        archive_reason: null,
        recalled_at: new Date().toISOString(),
        recalled_by,
        recall_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('is_archived', true) // Only recall if actually archived
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Document not found or not archived' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: data,
      message: 'Document successfully recalled from archive'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to recall document', details: error.message },
      { status: 500 }
    )
  }
}
