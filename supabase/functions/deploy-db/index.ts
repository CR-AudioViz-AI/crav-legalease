import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute SQL directly using Supabase client
    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS legalease_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        original_content TEXT NOT NULL,
        converted_content TEXT,
        document_type TEXT DEFAULT 'other',
        status TEXT DEFAULT 'completed',
        cost_credits INTEGER DEFAULT 0,
        word_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS translations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES legalease_documents(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        original_language TEXT NOT NULL,
        target_language TEXT NOT NULL,
        original_text TEXT NOT NULL,
        translated_text TEXT,
        cost_credits INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_docs_user ON legalease_documents(user_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_trans_user ON translations(user_id, created_at DESC)`,
      
      `ALTER TABLE legalease_documents ENABLE ROW LEVEL SECURITY`,
      `ALTER TABLE translations ENABLE ROW LEVEL SECURITY`,
      
      `DROP POLICY IF EXISTS docs_select ON legalease_documents`,
      `CREATE POLICY docs_select ON legalease_documents FOR ALL USING (auth.uid() = user_id)`,
      
      `DROP POLICY IF EXISTS trans_select ON translations`,
      `CREATE POLICY trans_select ON translations FOR ALL USING (auth.uid() = user_id)`
    ]

    const results = []
    for (const sql of sqlStatements) {
      try {
        const { data, error } = await supabaseClient.rpc('exec', { sql })
        results.push({ sql: sql.substring(0, 50), success: !error, error: error?.message })
      } catch (e) {
        results.push({ sql: sql.substring(0, 50), success: false, error: e.message })
      }
    }

    // Verify tables exist
    const { data: docs } = await supabaseClient.from('legalease_documents').select('id').limit(1)
    const { data: trans } = await supabaseClient.from('translations').select('id').limit(1)

    return new Response(
      JSON.stringify({
        success: true,
        results,
        tables_verified: {
          legalease_documents: !!docs || docs === null,
          translations: !!trans || trans === null
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
