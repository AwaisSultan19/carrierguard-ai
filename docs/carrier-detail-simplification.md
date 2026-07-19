# Carrier Detail Page — MVP Simplification

**Goal:** A freight broker can decide whether to work with a carrier in under 30 seconds.

## Kept Sections

### 1. Carrier Information
- Carrier Name
- Status (Active/Inactive badge)
- MC Number
- DOT Number
- Location (City, State)

### 2. Risk Assessment
- Risk Score (circular gauge with animated stroke)
- Risk Level (Low / Moderate / High — color-coded)
- AI Compliance Insight (plain English summary)

### 3. Compliance Metrics (3-card row)
- Safety Rating (Satisfactory/Conditional/Unsatisfactory + check icon)
- Inspection Count + Violations + Clean Rate %
- Crash History (total + fatal/injury/tow breakdown)

### 4. Insurance Status
- Simple "Insurance Valid" badge

### 5. Actions
- Export PDF (direct download link)

## Removed

| Feature | Reason |
|---------|--------|
| Watchlist button | No backend, not MVP |
| Verified by Safety & Risk Teams | Decorative, no value |
| Last Audited date | Not needed for quick assessment |
| Clean Inspection card | Duplicate — covered by Inspections card |
| Insurance Coverage Details table | Too detailed for 30s scan |
| View COI button | Not MVP |
| Compliance History timeline | BOC-3, MCS-150, Registration — too detailed |
| View Full History Log | Not MVP |
| Operational Overview | Fleet size, drivers, cargo — not decision-critical |
| Risk Alert card | Duplicate — risk score + AI summary already cover it |
| Operation type badge | Not needed |

## Result

- **Before:** 405 lines, 10+ sections, sidebar layout
- **After:** 228 lines, 5 focused sections, single-column layout
- **Decision time:** Reduced to under 30 seconds
