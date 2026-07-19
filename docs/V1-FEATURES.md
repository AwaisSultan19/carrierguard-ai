# CarrierGuard AI — V1 Feature Specification

## ✅ Included in V1

### 1. Authentication
- Sign Up (Clerk)
- Sign In (Clerk)
- Logout
- Protected Dashboard (middleware)
- User Profile (basic name + email)

### 2. Dashboard (Simple)
- KPI cards: Total Carriers Vetted, High Risk Alerts, Compliance Rate, Pending Audits
- Recent Carrier Checks table
- Critical Compliance Alerts
- System Management quick links
- Export Audit button
- New Search button

### 3. Carrier Search
- MC Number input + DOT Number input
- Search button
- Loading state (skeleton)
- Error state + toast notifications
- No results / empty state
- Recent Searches display
- Quick Filters (Active Authority, Safety Rating, Hazmat)

### 4. FMCSA Data Integration
- Carrier Name
- MC Number
- DOT Number
- Operating Authority
- Company Address
- Authority Status (Active/Revoked/Out of Service)
- Inspection Count
- Crash Count
- Safety Rating

### 5. Risk Engine
- Risk Score (0–100)
- Risk Level: Low (70+), Moderate (40–69), High (<40)
- Score breakdown: Safety Performance, Insurance Coverage, Operating Authority
- Color-coded results
- Recommendation / Final Verdict

### 6. AI Summary
- Plain English compliance explanation
- Strengths (Green Flags)
- Risks (Minor Considerations)
- Final recommendation

### 7. Carrier Details Page
- Company information header
- Authority status badge
- Aggregate Risk Score (circular gauge)
- AI Compliance Insight
- Safety Rating, Inspections, Crash History
- Insurance Coverage table
- Compliance History timeline
- Operational Overview
- Risk Alert banner (when score < 50)
- Export PDF button

### 8. PDF Report
- CarrierGuard AI branding
- Company details (name, DOT, MC, address)
- FMCSA data (safety rating, authority status, OOS rates)
- Crash & inspection history
- Insurance table
- Risk Score (color-coded)
- AI Compliance Summary
- Date generated
- Disclaimer footer

### 9. Search History
- History data table (Date/Time, Carrier Name, MC/DOT#, Vetting Result, Actions)
- Search by carrier name or MC#
- Filter by date range
- Filter by status
- Open previous report link
- Export PDF
- Result count display

### 10. Error Handling
- Invalid MC/DOT number input validation
- Carrier not found state
- API failure fallback (all services degrade gracefully)
- Network error handling
- Loading skeletons on all pages

### 11. Responsive Design
- Desktop (full layout)
- Tablet (md: breakpoints)
- Mobile (single column, responsive classes)

---

## ❌ Removed / Deferred from V1

| Feature | Reason |
|---------|--------|
| Billing & Subscriptions | Not needed for MVP testing |
| Multi-tenant Organizations | Deferred — single org mode for V1 |
| Team Members & Roles | Deferred — single user focus |
| API Key Management | Deferred — not needed for V1 testing |
| Two-Factor Auth (2FA) | Deferred — Clerk handles this |
| Single Sign-On (SSO) | Enterprise feature, deferred |
| Session Timeout Settings | Deferred |
| Email Report Delivery | Deferred — PDF download is sufficient |
| CSV Export | Deferred — PDF export covers needs |
| AI Confidence Score | Deferred — risk score is the primary metric |
| Risk Distribution Donut Chart | Keep dashboard simple |
| Platform Statistics | Deferred marketing content |
| Profile Preferences (theme/lang/timezone) | Deferred — use system defaults |
| Live Support FAB | Deferred |
| Complex Pagination | Simplified to result count only |
| Average Risk Score KPI | Deferred — revisit with more data |
| Organization settings tabs | Simplified to basic name only |

---

## Extra Features Kept in V1 (beyond core MVP)

- Notifications / Alert Feed (system alerts for authority changes, insurance expiry)
- Quick Filters on search page
- Recent Searches on search page
- Risk Score animated progress bars on risk report
- Green Flags / Minor Considerations analysis on risk report
- Toast error notifications
- Export Audit button on dashboard
- Watchlist button on carrier detail (UI only)
