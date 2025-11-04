-- LegalEase AI - Complete Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'enterprise')),
  credits INTEGER DEFAULT 50,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Legal Documents Table
CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  original_file TEXT,
  original_text TEXT,
  converted_file TEXT,
  converted_text TEXT,
  type TEXT NOT NULL CHECK (type IN ('legal_to_plain', 'plain_to_legal')),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  file_type TEXT CHECK (file_type IN ('pdf', 'docx', 'doc', 'txt')),
  metadata JSONB DEFAULT '{}',
  word_count INTEGER,
  character_count INTEGER,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Conversion Sessions Table
CREATE TABLE IF NOT EXISTS conversion_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES legal_documents(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]',
  questions_asked JSONB DEFAULT '[]',
  verification_score INTEGER CHECK (verification_score >= 0 AND verification_score <= 100),
  key_terms JSONB DEFAULT '[]',
  critical_points JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Document Templates Table
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  logo_url TEXT,
  branding_config JSONB DEFAULT '{"primaryColor": "#1e40af", "secondaryColor": "#3b82f6"}',
  legal_clauses JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Usage Logs Table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES legal_documents(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  conversion_type TEXT CHECK (conversion_type IN ('legal_to_plain', 'plain_to_legal', 'verification')),
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10, 4) DEFAULT 0.0000,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_created_at ON legal_documents(created_at DESC);
CREATE INDEX idx_conversion_sessions_document_id ON conversion_sessions(document_id);
CREATE INDEX idx_templates_user_id ON document_templates(user_id);
CREATE INDEX idx_templates_public ON document_templates(is_public);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Legal Documents Policies
CREATE POLICY "Users can view own documents" ON legal_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON legal_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON legal_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON legal_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Conversion Sessions Policies
CREATE POLICY "Users can view own conversion sessions" ON conversion_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM legal_documents 
      WHERE legal_documents.id = conversion_sessions.document_id 
      AND legal_documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversion sessions" ON conversion_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM legal_documents 
      WHERE legal_documents.id = conversion_sessions.document_id 
      AND legal_documents.user_id = auth.uid()
    )
  );

-- Document Templates Policies
CREATE POLICY "Users can view public templates" ON document_templates
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create own templates" ON document_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON document_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON document_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Logs Policies
CREATE POLICY "Users can view own usage logs" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage logs" ON usage_logs
  FOR INSERT WITH CHECK (true);

-- Insert 2 default public templates
INSERT INTO document_templates (name, category, description, content, is_public, legal_clauses) VALUES
('Non-Disclosure Agreement', 'Contracts', 'Standard mutual NDA template', 
'NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into as of [DATE] by and between [PARTY A] and [PARTY B] (collectively, the "Parties").

1. CONFIDENTIAL INFORMATION
The Parties agree that Confidential Information shall include all information disclosed by either Party...', 
true,
'[{"title": "Definition of Confidential Information", "content": "Any information marked confidential"}, {"title": "Obligations", "content": "Parties must maintain confidentiality"}]'::jsonb),

('Service Agreement', 'Contracts', 'Professional services agreement template',
'SERVICE AGREEMENT

This Service Agreement (the "Agreement") is entered into as of [DATE] between [SERVICE PROVIDER] and [CLIENT].

1. SERVICES
The Service Provider agrees to provide the following services...',
true,
'[{"title": "Scope of Services", "content": "Detailed description of services"}, {"title": "Payment Terms", "content": "Payment schedule and amounts"}]'::jsonb);

-- Success message
SELECT 'Database schema created successfully! All tables, indexes, and RLS policies are in place.' AS status;
