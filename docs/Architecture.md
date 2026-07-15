# System Architecture

## Frontend

- Next.js
- React
- Tailwind CSS
- shadcn/ui

Responsibilities

- Dashboard
- Authentication
- Search
- Reports
- Settings
- Billing

---

## Backend

Node.js + Express

Responsibilities

- Authentication
- Carrier Search
- FMCSA Integration
- Risk Engine
- AI Summary
- PDF Generation
- Notifications

---

## Database

Supabase PostgreSQL

Stores

- Users
- Organizations
- CarrierChecks
- Reports
- AuditLogs
- Alerts
- Subscriptions

---

## External Services

- FMCSA
- Claude API
- Stripe
- Resend
- Twilio

---

## Request Flow

User

↓

Frontend

↓

Backend

↓

FMCSA

↓

Risk Engine

↓

Claude

↓

Database

↓

Frontend

---

## Deployment

Frontend → Vercel

Backend → Railway

Database → Supabase