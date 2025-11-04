import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')
    const is_active = searchParams.get('is_active')

    let query = supabase
      .from('approval_workflows')
      .select(`
        *,
        workflow_steps(*)
      `)
      .order('created_at', { ascending: false })

    if (organization_id) {
      query = query.eq('organization_id', organization_id)
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ workflows: data })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch workflows', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, name, description, trigger_conditions, steps, created_by } = body

    if (!organization_id || !name) {
      return NextResponse.json(
        { error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

    // Create workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('approval_workflows')
      .insert([{
        organization_id,
        name,
        description,
        trigger_conditions,
        created_by
      }])
      .select()
      .single()

    if (workflowError) throw workflowError

    // Create workflow steps if provided
    if (steps && steps.length > 0) {
      const stepsToInsert = steps.map((step: any, index: number) => ({
        workflow_id: workflow.id,
        step_order: index + 1,
        ...step
      }))

      const { error: stepsError } = await supabase
        .from('workflow_steps')
        .insert(stepsToInsert)

      if (stepsError) throw stepsError
    }

    return NextResponse.json({
      success: true,
      workflow
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error.message },
      { status: 500 }
    )
  }
}
