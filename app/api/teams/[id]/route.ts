import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/teams/[id] - Get single team with members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        organization:organizations(id, name, slug),
        team_members(
          id,
          user_id,
          role,
          added_at
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ team: data })

  } catch (error: any) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/[id] - Update team
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const allowedFields = ['name', 'description', 'specialty', 'color', 'settings']

    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      team: data
    })

  } catch (error: any) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team', details: error.message },
      { status: 500 }
    )
  }
}
