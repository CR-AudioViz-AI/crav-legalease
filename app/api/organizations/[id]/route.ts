import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/organizations/[id] - Get single organization
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        organization_members (
          id,
          user_id,
          role,
          department,
          joined_at
        ),
        teams (
          id,
          name,
          specialty
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization: data })

  } catch (error: any) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const allowedFields = [
      'name',
      'plan',
      'max_users',
      'max_documents',
      'max_storage_gb',
      'features',
      'settings',
      'billing_email',
      'subscription_status'
    ]

    // Filter to only allowed fields
    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data
    })

  } catch (error: any) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Failed to update organization', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Note: This will cascade delete members, teams, and documents due to ON DELETE CASCADE
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting organization:', error)
    return NextResponse.json(
      { error: 'Failed to delete organization', details: error.message },
      { status: 500 }
    )
  }
}
