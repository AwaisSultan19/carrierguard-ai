# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack Overview

- **Frontend**: Next.js (React framework)
- **Backend**: Node.js with Express
- **Database**: Supabase PostgreSQL
- **Authentication**: Clerk
- **AI**: Claude API
- **Storage**: Supabase
- **Email**: Resend
- **SMS**: Twilio
- **Payments**: Stripe
- **Deployment**: Vercel, Railway

## Core Features (MVP)

1. Authentication system with Clerk
2. Carrier search functionality
3. FMCSA API integration
4. Risk score calculation
5. AI-powered summaries using Claude API
6. PDF report generation
7. Audit history and search
8. Email and SMS notifications
9. Stripe billing integration

## Development Environment Setup

- Create `.env` file from `.env.example`
- Install dependencies via `npm install`
- Database setup with Supabase
- Configure clerk environment variables
- Set up FMCSA API integration
- Configure cloud services (Vercel/Railway)

## Common Development Tasks

- Run frontend: `npm run dev` (Next.js)
- Run backend: `node server.js` (Express)
- Run database migrations: `supabase db push`
- Test authentication flow
- Test carrier search endpoint
- Validate PDF report generation
- Check notification delivery channels

## Project Structure

- `frontend/` - Next.js application
- `backend/` - Express API server
- `database/` - Supabase database files
- `scripts/` - Utility scripts
- `docs/` - Documentation files

Important: All API endpoints require JWT authentication from Clerk unless explicitly configured otherwise.