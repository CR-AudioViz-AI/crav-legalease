import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeFilename } from '@/lib/utils';

const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('logo') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing logo or userId' }, { status: 400 });
    }

    if (file.size > MAX_LOGO_SIZE) {
      return NextResponse.json({ error: 'Logo too large (max 5MB)' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `logos/${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('branding')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('branding')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      fileName,
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from('branding')
      .list(`logos/${userId}`);

    if (error) throw error;

    const logos = files.map(file => {
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('branding')
        .getPublicUrl(`logos/${userId}/${file.name}`);

      return {
        name: file.name,
        url: publicUrl,
        createdAt: file.created_at,
      };
    });

    return NextResponse.json({ logos });
  } catch (error) {
    console.error('Get logos error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch logos' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { fileName, userId } = await req.json();

    if (!fileName || !userId) {
      return NextResponse.json({ error: 'Missing fileName or userId' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from('branding')
      .remove([`logos/${userId}/${fileName}`]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete logo error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    );
  }
}
