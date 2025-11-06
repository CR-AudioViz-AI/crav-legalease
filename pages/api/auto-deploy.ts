import { NextApiRequest, NextApiResponse } from 'next'
import { Client } from 'pg'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { secret } = req.body
  if (secret !== process.env.DEPLOY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  let client: Client | null = null

  try {
    console.log('Starting database deployment...')
    
    // Connect to PostgreSQL
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://postgres:${process.env.DB_PASSWORD}@db.kteobfyferrukqeolofj.supabase.co:5432/postgres`
    
    client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })
    await client.connect()
    console.log('Connected to database')

    // Download schema
    const schemaResponse = await fetch(
      'https://raw.githubusercontent.com/CR-AudioViz-AI/crav-legalease/main/database/enterprise-schema.sql'
    )
    const schema = await schemaResponse.text()
    console.log(`Downloaded schema: ${schema.length} bytes`)

    // Execute schema
    await client.query(schema)
    console.log('Schema executed successfully')

    // Verify tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const tables = result.rows.map(r => r.table_name)
    console.log(`Deployed ${tables.length} tables:`, tables)

    return res.status(200).json({
      success: true,
      message: 'Database deployed successfully',
      tables: tables.length,
      tableNames: tables,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Deployment error:', error)
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  } finally {
    if (client) await client.end()
  }
}

export const config = {
  maxDuration: 300
}
