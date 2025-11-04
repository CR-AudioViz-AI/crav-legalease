import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export type UserProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: 'user' | 'admin' | 'enterprise';
  credits: number;
  subscription_tier: 'free' | 'professional' | 'enterprise';
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  last_login: string;
};

export type LegalDocument = {
  id: string;
  user_id: string;
  title: string;
  original_file: string | null;
  original_text: string | null;
  converted_file: string | null;
  converted_text: string | null;
  type: 'legal_to_plain' | 'plain_to_legal';
  status: 'processing' | 'completed' | 'failed';
  file_type: 'pdf' | 'docx' | 'doc' | 'txt' | null;
  metadata: Record<string, any>;
  word_count: number | null;
  character_count: number | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
};

export type ConversionSession = {
  id: string;
  document_id: string;
  messages: any[];
  questions_asked: any[];
  verification_score: number | null;
  key_terms: any[];
  critical_points: any[];
  created_at: string;
  updated_at: string;
};

export type DocumentTemplate = {
  id: string;
  user_id: string | null;
  name: string;
  category: string;
  description: string | null;
  content: string;
  logo_url: string | null;
  branding_config: Record<string, any>;
  legal_clauses: any[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type UsageLog = {
  id: string;
  user_id: string;
  document_id: string | null;
  action: string;
  conversion_type: 'legal_to_plain' | 'plain_to_legal' | 'verification' | null;
  tokens_used: number;
  cost: number;
  success: boolean;
  error_message: string | null;
  metadata: Record<string, any>;
  created_at: string;
};
