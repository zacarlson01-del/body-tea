# Security Remediation PR Checklist
Date: April 7, 2026
Project: body-tea / ISEA

## PR-1 (Critical): Abuse Protection on Auth + Support Endpoints

### 1. Add shared rate-limit utility
- File: `netlify/functions/rate-limit.js` (new)
- Add a reusable Blob-backed limiter (`namespace`, `key`, `limit`, `windowSec`).

### 2. Enforce limits in high-risk endpoints
- Files:
  - `netlify/functions/auth-signin.js`
  - `netlify/functions/auth-signup.js`
  - `netlify/functions/auth-forgot-password.js`
  - `netlify/functions/support-create.js`
- Add per-IP checks before business logic and return `429` on excess traffic.

---

## PR-2 (Critical): Require Auth for Support Submission

### 1. Verify bearer token in support endpoint
- Files:
  - `netlify/functions/support-create.js`
  - `netlify/functions/auth-utils.js`
- Parse `Authorization: Bearer ...`, verify token, and reject unauthenticated requests.
- Persist `userId` in support ticket payload.

---

## PR-3 (High): Remove Reset Token Preview Leakage

### 1. Stop returning token/link preview from API
- File: `netlify/functions/auth-forgot-password.js`
- Remove `reset_token_preview` and `reset_link_preview` from response.

### 2. Remove preview-link rendering in frontend
- File: `frontend/src/components/SigninForm.tsx`
- Remove preview state and “Open reset link (preview)” anchor.

---

## PR-4 (High): Strict CORS Policy

### 1. Replace wildcard fallback origins
- Files:
  - `netlify/functions/auth-utils.js`
  - `netlify/functions/profile-picture.js`
  - `netlify/functions/support-create.js`
- Enforce exact `FRONTEND_URL` allowlist only.
- Add `Vary: Origin`.
- Do not allow `*` with credentials.

---

## PR-5 (High): Add Security Headers in Netlify

### 1. Add global headers block
- File: `netlify.toml`
- Add:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Frame-Options` or `frame-ancestors`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`

---

## PR-6 (Critical Trust): Remove/Label Simulated Financial Claims

### 1. Replace misleading escrow/custody language
- Files:
  - `frontend/src/pages/DashboardPage.tsx`
  - `frontend/public/index.html`
- Label as demo/sandbox until real custody rails exist.
- Remove/rename “Download Statement” and other real-finance cues if not implemented.

---

## PR-7 (Medium): Legal Route Integrity

### 1. Add real legal pages and routes
- Files:
  - `frontend/src/pages/TermsPage.tsx` (new)
  - `frontend/src/pages/PrivacyPage.tsx` (new)
  - `frontend/src/App.tsx`
  - `frontend/src/components/SignupForm.tsx`
- Ensure `/terms` and `/privacy` resolve and include legal entity/contact details.

---

## PR-8 (High Privacy): Protect Profile Picture Access

### 1. Remove public key-based media access
- Files:
  - `netlify/functions/profile-picture.js`
  - `netlify/functions/auth-signup.js`
- Serve media through authenticated owner route or signed short-lived URLs.

---

## PR-9 (Medium): Dependency Governance + CI Security Gates

### 1. Add CI audit workflow
- File: `.github/workflows/security.yml` (new)
- Run production audits for root/backend/frontend and fail on high/critical.

### 2. Add dependency update automation
- Add Dependabot/Renovate config to keep dependencies current.

---

## PR-10 (Low): Remove Architecture Drift

### 1. Decommission unused scaffold
- Files:
  - `db/schema.ts`
  - `db/index.ts`
  - `drizzle.config.ts`
- Remove or clearly mark as non-production sample.

### 2. Align docs with one production architecture
- Files: `README.md`, `PROJECT_DOCUMENTATION.md`, `DOCUMENTATION.md`
- Keep one canonical runtime/deploy path.

---

## Recommended Implementation Order
1. PR-1
2. PR-2
3. PR-3
4. PR-4
5. PR-5
6. PR-8
7. PR-6
8. PR-7
9. PR-9
10. PR-10
