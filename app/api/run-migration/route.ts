import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Security: Simple token check
    const { token } = await request.json()
    if (token !== 'migrate-legalease-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role to execute SQL
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

    // Execute migration SQL via raw query
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create legalease_documents table
        CREATE TABLE IF NOT EXISTS public.legalease_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          original_content TEXT NOT NULL,
          converted_content TEXT,
          document_type TEXT DEFAULT 'other' CHECK (document_type IN ('contract', 'agreement', 'terms', 'policy', 'other')),
          status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.legalease_documents ENABLE ROW LEVEL SECURITY;

        -- Create policies
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'legalease_documents' AND policyname = 'Users can view own legalease documents'
          ) THEN
            CREATE POLICY "Users can view own legalease documents" ON public.legalease_documents
              FOR SELECT USING (auth.uid() = user_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'legalease_documents' AND policyname = 'Users can create own legalease documents'
          ) THEN
            CREATE POLICY "Users can create own legalease documents" ON public.legalease_documents
              FOR INSERT WITH CHECK (auth.uid() = user_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'legalease_documents' AND policyname = 'Users can update own legalease documents'
          ) THEN
            CREATE POLICY "Users can update own legalease documents" ON public.legalease_documents
              FOR UPDATE USING (auth.uid() = user_id);
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'legalease_documents' AND policyname = 'Users can delete own legalease documents'
          ) THEN
            CREATE POLICY "Users can delete own legalease documents" ON public.legalease_documents
              FOR DELETE USING (auth.uid() = user_id);
          END IF;
        END $$;

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_legalease_documents_user_id ON public.legalease_documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_legalease_documents_created_at ON public.legalease_documents(created_at DESC);
      `
    })

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.error('RPC error:', error)
      return NextResponse.json({ 
        error: 'Migration failed - RPC not available',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully',
      data 
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with token to run migration' })
}
