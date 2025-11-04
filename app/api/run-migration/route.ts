import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()
    if (token !== 'migrate-legalease-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to Supabase PostgreSQL using JWT token authentication
    // Format: postgresql://postgres.[PROJECT_REF]:[JWT_TOKEN]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
    const client = new Client({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      database: 'postgres',
      user: 'postgres.kteobfyferrukqeolofj',
      password: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      ssl: { rejectUnauthorized: false }
    })

    await client.connect()

    // Execute migration SQL
    const migrationSQL = `
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
    `

    await client.query(migrationSQL)

    // Create policies one by one
    const policies = [
      {
        name: 'Users can view own legalease documents',
        sql: 'CREATE POLICY IF NOT EXISTS "Users can view own legalease documents" ON public.legalease_documents FOR SELECT USING (auth.uid() = user_id);'
      },
      {
        name: 'Users can create own legalease documents',
        sql: 'CREATE POLICY IF NOT EXISTS "Users can create own legalease documents" ON public.legalease_documents FOR INSERT WITH CHECK (auth.uid() = user_id);'
      },
      {
        name: 'Users can update own legalease documents',
        sql: 'CREATE POLICY IF NOT EXISTS "Users can update own legalease documents" ON public.legalease_documents FOR UPDATE USING (auth.uid() = user_id);'
      },
      {
        name: 'Users can delete own legalease documents',
        sql: 'CREATE POLICY IF NOT EXISTS "Users can delete own legalease documents" ON public.legalease_documents FOR DELETE USING (auth.uid() = user_id);'
      }
    ]

    for (const policy of policies) {
      try {
        await client.query(policy.sql)
      } catch (err: any) {
        // Policy might already exist
        if (!err.message.includes('already exists')) {
          console.error(`Error creating policy ${policy.name}:`, err)
        }
      }
    }

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_legalease_documents_user_id ON public.legalease_documents(user_id);')
    await client.query('CREATE INDEX IF NOT EXISTS idx_legalease_documents_created_at ON public.legalease_documents(created_at DESC);')

    await client.end()

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed successfully'
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with token to run migration' })
}
