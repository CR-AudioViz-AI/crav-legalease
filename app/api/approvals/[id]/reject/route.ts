import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/approvals/[id]/reject - Reject a document
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { comments, rejection_reason } = body

    if (!rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Update approval status
    const { data: approval, error: approvalError } = await supabase
      .from('document_approvals')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (approvalError) throw approvalError

    // Create signoff record
    const { data: signoff, error: signoffError } = await supabase
      .from('approval_signoffs')
      .insert([{
        approval_id: params.id,
        signer_id: approval.approver_id,
        comments: `${rejection_reason}${comments ? '\n\n' + comments : ''}`,
        decision: 'rejected'
      }])
      .select()
      .single()

    if (signoffError) throw signoffError

    // TODO: Notify document owner of rejection

    return NextResponse.json({
      success: true,
      approval,
      signoff,
      message: 'Document rejected'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to reject document', details: error.message },
      { status: 500 }
    )
  }
}
