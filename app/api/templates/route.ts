import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const includePublic = searchParams.get('includePublic') === 'true';

  try {
    let query = supabaseAdmin.from('document_templates').select('*');

    if (includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('is_public', true);
    }

    const { data: templates, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, name, category, description, content, brandingConfig, legalClauses } = await req.json();

    if (!userId || !name || !category || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: template, error } = await supabaseAdmin
      .from('document_templates')
      .insert({
        user_id: userId,
        name,
        category,
        description,
        content,
        branding_config: brandingConfig || { primaryColor: '#1e40af', secondaryColor: '#3b82f6' },
        legal_clauses: legalClauses || [],
        is_public: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create template' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { templateId, userId, ...updates } = await req.json();

    if (!templateId || !userId) {
      return NextResponse.json({ error: 'Missing templateId or userId' }, { status: 400 });
    }

    // Verify ownership
    const { data: template, error: fetchError } = await supabaseAdmin
      .from('document_templates')
      .select('user_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: updatedTemplate, error } = await supabaseAdmin
      .from('document_templates')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ template: updatedTemplate });
  } catch (error) {
    console.error('Update template error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { templateId, userId } = await req.json();

    if (!templateId || !userId) {
      return NextResponse.json({ error: 'Missing templateId or userId' }, { status: 400 });
    }

    // Verify ownership
    const { data: template, error: fetchError } = await supabaseAdmin
      .from('document_templates')
      .select('user_id')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('document_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
