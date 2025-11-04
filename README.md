# LegalEase AI - Professional Legal Document Translator

Convert legal documents to plain English and vice versa using AI. Built with Next.js 14, OpenAI GPT-4, Stripe, and Supabase.

## Features

✅ **Bidirectional Conversion** - Legal ↔ Plain English
✅ **Multiple File Formats** - PDF, DOCX, DOC, TXT
✅ **15+ Professional Templates** - Contracts, agreements, leases
✅ **AI-Powered Analysis** - Key terms, critical points, verification
✅ **Custom Branding** - Logo upload and template customization
✅ **Credit System** - Flexible pricing with subscriptions
✅ **Stripe Integration** - Secure payments and subscriptions
✅ **Enterprise Security** - Row-level security, encrypted data
✅ **Admin Dashboard** - Analytics and monitoring
✅ **Health Monitoring** - System status checks

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/CR-AudioViz-AI/crav-legalease.git
cd crav-legalease
npm install
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run `database-schema.sql` in Supabase SQL Editor

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Deployment

### Deploy to Vercel

```bash
vercel --prod
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables

### Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
4. Copy webhook secret to Vercel env vars
5. Redeploy

## API Endpoints

- `POST /api/convert` - Convert documents
- `POST /api/upload` - Upload files
- `GET/DELETE /api/documents` - Document management
- `GET/POST/PUT/DELETE /api/templates` - Template CRUD
- `POST/GET/DELETE /api/branding/logo` - Logo management
- `POST /api/webhooks/stripe` - Payment webhooks
- `GET /api/health` - System health check

## Project Structure

```
legalease-ai/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin panel
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── lib/
│   ├── supabase.ts       # Database client
│   ├── openai.ts         # AI functions
│   ├── stripe.ts         # Payment functions
│   ├── pdf-parser.ts     # PDF processing
│   └── utils.ts          # Helper functions
├── database-schema.sql   # Database schema
└── package.json          # Dependencies
```

## License

Built by CR AudioViz AI - Part of the creative ecosystem

## Support

Email: info@craudiovizai.com
Website: https://craudiovizai.com
