import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/teams/[id]/members - List team members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', params.id)
      .order('added_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ members: data })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/teams/[id]/members - Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { user_id, role, added_by } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', params.id)
      .eq('user_id', user_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        team_id: params.id,
        user_id,
        role: role || 'member',
        added_by
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      member: data
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to add member', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', params.id)
      .eq('user_id', user_id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Member removed from team'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to remove member', details: error.message },
      { status: 500 }
    )
  }
}
