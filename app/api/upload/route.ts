import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parsePDF, validatePDF, cleanPDFText } from '@/lib/pdf-parser';
import mammoth from 'mammoth';
import { countWords, countCharacters, sanitizeFilename, getFileExtension } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['pdf', 'docx', 'doc', 'txt'];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const title = formData.get('title') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const fileExt = getFileExtension(file.name);
    if (!ALLOWED_TYPES.includes(fileExt)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    // Extract text based on file type
    if (fileExt === 'pdf') {
      if (!validatePDF(buffer)) {
        return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
      }
      const pdfResult = await parsePDF(buffer);
      extractedText = cleanPDFText(pdfResult.text);
    } else if (fileExt === 'docx' || fileExt === 'doc') {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileExt === 'txt') {
      extractedText = buffer.toString('utf-8');
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('legal_documents')
      .insert({
        user_id: userId,
        title: title || file.name,
        original_file: fileName,
        original_text: extractedText,
        file_type: fileExt,
        type: 'legal_to_plain',
        status: 'processing',
        word_count: countWords(extractedText),
        character_count: countCharacters(extractedText),
        metadata: { originalFileName: file.name, fileSize: file.size },
      })
      .select()
      .single();

    if (docError) {
      throw docError;
    }

    return NextResponse.json({
      success: true,
      document,
      extractedText,
      wordCount: countWords(extractedText),
      characterCount: countCharacters(extractedText),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
