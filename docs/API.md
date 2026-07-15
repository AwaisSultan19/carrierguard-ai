# API Specification

## Authentication

POST /auth/login

POST /auth/logout

GET /auth/me

---

## Carrier

POST /carrier/search

GET /carrier/:id

GET /carrier/history

---

## Reports

POST /reports

GET /reports/:id

DELETE /reports/:id

---

## Alerts

GET /alerts

PATCH /alerts/:id

---

## Billing

POST /billing/create-checkout

GET /billing/subscription

POST /billing/webhook

---

## Settings

GET /settings

PATCH /settings