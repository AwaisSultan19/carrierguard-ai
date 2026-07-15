# Product Requirements Document (PRD)

# CarrierGuard AI

Version: 1.0
Status: MVP
Author: Awais Sultan

---

# 1. Product Overview

CarrierGuard AI helps freight brokers verify carriers before assigning loads.

Instead of manually checking multiple websites, brokers enter an MC or DOT number and receive:

- Risk Score
- AI Summary
- Insurance Status
- Operating Authority
- Safety Information
- Compliance Report
- Audit Trail

---

# 2. Problem

Small freight brokerages manually verify carriers.

Current workflow:

• Open FMCSA
• Check authority
• Check insurance
• Review safety
• Take notes
• Save screenshots

Problems:

- Time consuming
- Human mistakes
- No documentation
- Legal risk
- Different process for every employee

---

# 3. Vision

Become the easiest carrier vetting platform for small freight brokerages.

A broker should be able to verify any carrier in under 30 seconds.

---

# 4. Target Users

Primary

Small Freight Broker

Company Size

1–20 employees

Roles

- Owner
- Dispatcher
- Operations Manager
- Carrier Sales

---

# 5. Goals

Business Goals

- First 10 customers
- $2k MRR
- Less than 30-second verification
- Reduce manual work

User Goals

- Verify carriers quickly
- Reduce legal risk
- Save every report
- Get alerts automatically

---

# 6. User Stories

As a broker

I want to search a carrier

So I can know whether they are safe.

---

As an owner

I want every check recorded

So I have proof if legal issues occur.

---

As an operations manager

I want automatic alerts

So I know if insurance expires.

---

# 7. MVP Features

## Authentication

- Sign Up
- Login
- Logout

---

## Dashboard

- Recent searches
- Total reports
- Alerts
- Saved carriers

---

## Carrier Search

Input

MC Number

or

DOT Number

Output

- Company Name
- DOT
- MC
- Authority
- Insurance
- Safety Rating
- Inspection Count
- Crash History

---

## Risk Engine

Calculates

- Overall Score

Example

87 / 100

Status

🟢 Safe

🟡 Review

🔴 High Risk

---

## AI Summary

Generate

- Simple explanation
- Risks
- Recommendation

Example

Insurance is active.

Authority is valid.

No major violations found.

Recommended.

---

## Compliance Report

Generate PDF

Contains

- Carrier Information
- Risk Score
- AI Summary
- Date
- User
- Approval Status

---

## Audit History

Store every search

Allow

- Search
- Filter
- Export

---

## Notifications

Email

SMS

Notify when

- Insurance expires
- Authority revoked
- Safety changes

---

# 8. Future Features

- Team Accounts
- Role Permissions
- Carrier Watchlists
- Fraud Detection
- Double Broker Detection
- API Access
- TMS Integration
- Browser Extension
- Mobile App

---

# 9. Out of Scope

- Dispatch Software
- Load Board
- CRM
- Accounting
- Invoice Management

---

# 10. Functional Requirements

System must

- Search by MC
- Search by DOT
- Fetch FMCSA data
- Calculate Risk Score
- Generate AI Summary
- Save Report
- Generate PDF
- Notify Users

---

# 11. Non-Functional Requirements

Search

<5 seconds

Availability

99.9%

Responsive

Desktop
Tablet
Mobile

Security

Encrypted

Authentication

JWT

---

# 12. Tech Stack

Frontend

Next.js

Backend

Node.js
Express

Database

Supabase PostgreSQL

AI

Claude API

Authentication

Clerk

Storage

Supabase

Email

Resend

SMS

Twilio

Payments

Stripe

Deployment

Vercel
Railway

---

# 13. Success Metrics

Average Search Time

<30 seconds

Reports Generated

1000+

Customer Retention

80%

MRR

$2,000+

---

# 14. Risks

FMCSA API changes

Insurance API costs

Incorrect AI explanations

Legal compliance

Low adoption

---

# 15. Roadmap

Phase 1

Authentication

Phase 2

Carrier Search

Phase 3

FMCSA Integration

Phase 4

Risk Engine

Phase 5

AI Summary

Phase 6

PDF Reports

Phase 7

History

Phase 8

Alerts

Phase 9

Stripe

Phase 10

Launch

---

# 16. Definition of Done

A feature is complete when

✅ Backend works

✅ Frontend works

✅ Database updated

✅ API documented

✅ Error handling added

✅ Mobile responsive

✅ Tested

✅ Deployed

---

# 17. North Star Metric

Time required to safely approve a carrier.

Target

Less than 30 seconds.

---

# 18. MVP Launch Checklist

- User Authentication
- Dashboard
- Carrier Search
- FMCSA Integration
- Insurance Check
- Risk Engine
- AI Summary
- PDF Report
- Audit History
- Email Alerts
- Stripe Billing
- Landing Page
- Analytics
- Error Monitoring