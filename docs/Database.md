# Database Design

## Users

- id
- clerk_id
- name
- email
- organization_id
- created_at

---

## Organizations

- id
- name
- subscription_plan
- created_at

---

## CarrierChecks

- id
- user_id
- mc_number
- dot_number
- carrier_name
- risk_score
- status
- created_at

---

## Reports

- id
- carrier_check_id
- ai_summary
- pdf_url
- created_at

---

## AuditLogs

- id
- user_id
- action
- created_at

---

## Alerts

- id
- carrier_check_id
- type
- status
- created_at

---

## Subscriptions

- id
- organization_id
- stripe_customer_id
- plan
- status