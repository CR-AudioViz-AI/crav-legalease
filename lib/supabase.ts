import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Database types matching crav-website shared schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          credits_balance: number
          total_credits_purchased: number
          subscription_tier: string | null
          subscription_status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          paypal_customer_id: string | null
          paypal_subscription_id: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          company: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          credits_balance?: number
          total_credits_purchased?: number
          subscription_tier?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          paypal_customer_id?: string | null
          paypal_subscription_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          company?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          credits_balance?: number
          total_credits_purchased?: number
          subscription_tier?: string | null
          subscription_status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          paypal_customer_id?: string | null
          paypal_subscription_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          company?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'credit' | 'debit'
          description: string
          reference_id: string | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'credit' | 'debit'
          description: string
          reference_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'credit' | 'debit'
          description?: string
          reference_id?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      legalease_documents: {
        Row: {
          id: string
          user_id: string
          title: string
          original_content: string
          converted_content: string | null
          conversion_type: 'legal-to-plain' | 'plain-to-legal'
          key_terms: Record<string, any> | null
          summary: string | null
          credits_used: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          original_content: string
          converted_content?: string | null
          conversion_type: 'legal-to-plain' | 'plain-to-legal'
          key_terms?: Record<string, any> | null
          summary?: string | null
          credits_used: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          original_content?: string
          converted_content?: string | null
          conversion_type?: 'legal-to-plain' | 'plain-to-legal'
          key_terms?: Record<string, any> | null
          summary?: string | null
          credits_used?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          content: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          content: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          content?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
