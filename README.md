# CarrierGuard AI

AI-powered carrier compliance vetting and risk analysis platform for logistics and freight operations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | Supabase PostgreSQL |
| Auth | Clerk |
| AI | Google Gemini (`gemini-2.0-flash`) |
| FMCSA Data | DotLookup API |
| PDF | PDFKit |
| Email | Resend |
| Payments | Stripe (schema + UI ready) |

## Architecture

```
carrierguard-ai/
├── frontend/          # Next.js application
│   ├── app/           # Pages & layouts
│   │   ├── (dashboard)/  # Authenticated routes
│   │   ├── sign-in/      # Clerk sign-in
│   │   └── sign-up/      # Clerk sign-up
│   ├── components/    # Shared UI (Sidebar, TopNav)
│   └── lib/           # API client, types
├── backend/           # Express API server
│   ├── controllers/   # Route handlers
│   ├── routes/        # Route definitions
│   ├── services/      # Business logic & integrations
│   └── middleware/    # Auth, error handling
└── database/          # SQL migrations
    └── migrations/
```

## Features

### Authentication & User Management
- Clerk-powered sign-in/sign-up with custom UI
- JWT bearer token auth on all API routes
- Route protection via Clerk middleware
- User profile CRUD (name, email, preferences, language, timezone, theme)
- Multi-tenant organizations with team management & role-based access

### Carrier Search & Vetting
- Search carriers by MC or DOT number
- Real-time FMCSA data via DotLookup API (carrier profile, safety data, insurance)
- Graceful fallback to deterministic mock data when API is unavailable
- Quick filters: active authority, safety rating, hazmat certification
- Search history with pagination

### Risk Analysis Engine
Proprietary risk score (0–99) calculated from:
- FMCSA safety rating (+15 Satisfactory, -15 Conditional, -35 Unsatisfactory)
- Crash history (-4 per crash, max -20)
- Violation count (-2 per violation, max -15)
- Out-of-service rates vs national averages (-5 each for driver/vehicle)
- Authority status (-30 if non-active)
- Fleet size bonus (+5 for >20 units)

Results color-coded: **Low Risk** (70–99), **Moderate** (40–69), **High Risk** (0–39).

### AI-Powered Summaries
- Google Gemini generates 2–3 sentence compliance summaries
- Rule-based fallback when Gemini is unavailable
- Tiered by risk score: low / moderate / high

### PDF Report Generation
- On-demand A4 PDF with branded header
- Full compliance data: safety rating, crash history, inspections, insurance
- Color-coded risk score display
- AI compliance summary section
- Download and email delivery

### Dashboard & Analytics
- KPI cards: total carriers vetted, high-risk alerts, compliance rate, pending audits
- Risk distribution donut chart
- Recent carrier checks table
- Critical compliance alerts with action buttons
- System management quick links

### Notifications & Alerts
- Alert feed grouped by time (Today / Yesterday / Earlier)
- Alert types: authority revoked, insurance expiring, safety rating changes
- Dismiss and mark-all-as-read functionality
- Alert statistics dashboard

### Billing & Subscription
- Subscription plan display with usage tracking
- Interactive 3D credit card UI
- Invoice history
- PCI-DSS Level 1 secure billing

### Security & Administration
- Two-factor authentication toggle
- SSO configuration
- Session timeout settings
- API key management (production/staging)
- Active sessions monitoring
- Account deactivation / org deletion

### Audit Trail
- Complete search history with date/time, carrier, risk result
- Export to PDF and CSV
- Configurable pagination (rows per page)
- Audit statistics (total audits, rejection rate, manual interventions)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/carrier/search` | Search carriers |
| `GET` | `/api/carrier/:id` | Get carrier by DOT/MC |
| `GET` | `/api/carrier/history` | Search history |
| `GET` | `/api/dashboard/stats` | Dashboard KPIs |
| `GET` | `/api/users/me` | Get profile |
| `PATCH` | `/api/users/me` | Update profile |
| `GET` | `/api/alerts` | Get alerts |
| `PATCH` | `/api/alerts/:id/dismiss` | Dismiss alert |
| `GET` | `/api/reports/generate` | Generate report data |
| `GET` | `/api/reports/pdf` | Download PDF |
| `POST` | `/api/reports/email` | Email report |
| `GET` | `/api/organization` | Org details |
| `GET` | `/api/organization/members` | Org members |
| `GET` | `/api/billing/subscription` | Subscription info |

## External Integrations

| Integration | Service | Purpose |
|-------------|---------|---------|
| Clerk | Authentication | Sign-in, JWT, sessions |
| Supabase | Database | PostgreSQL, RLS |
| Google Gemini | AI | Compliance summaries |
| DotLookup | FMCSA Data | Carrier & safety data |
| Resend | Email | PDF delivery |
| Stripe | Billing | Subscriptions |
| PDFKit | PDF | Report generation |

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase project
- Clerk application
- API keys for FMCSA/Gemini/Resend (optional — services degrade gracefully)

### Installation

```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys
```

### Run

```bash
# Backend (Express)
cd backend && npm run dev

# Frontend (Next.js)
cd frontend && npm run dev
```

### Database

Run `database/migrations/001_initial_schema.sql` in your Supabase SQL editor to create all tables, indexes, and RLS policies.
