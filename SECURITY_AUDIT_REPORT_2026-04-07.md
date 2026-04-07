# Security, Trust, and Compliance Audit Report
Date: April 7, 2026
Project: body-tea / ISEA
Auditor mode: static code + configuration + content review

## Scope Reviewed
- Frontend code (`frontend/src`, `frontend/public`)
- Netlify serverless backend (`netlify/functions`)
- Legacy backend path (`backend/src`)
- Deployment config (`netlify.toml`, package manifests)
- Policy and trust copy in UI/docs

## Findings

### [Critical] Misleading escrow/balance language without verifiable transactional implementation
**Where found**
- `frontend/src/pages/DashboardPage.tsx` lines 355-365, 388-395, 501-536, 591-594

**Why this is risky**
The UI states fund custody and release behavior as if actual escrow operations are live. Without verifiable payment custody rails, this can be interpreted as deceptive financial representation.

**Real-world consequence**
- Browser/user scam reports
- Payment processor rejection
- Legal/regulatory exposure for misleading financial claims

**How to fix it**
1. Replace operational escrow language with demo/sandbox wording unless custody is truly implemented.
2. Remove statement/transaction cues unless real ledger-backed data exists.
3. Publish legal entity and regulatory scope before making custody claims.

**Safe rewrite**
"Demo Balance (No live funds): This environment displays sample account values for testing only."

---

### [Critical] Static compliance/security/activation claims presented as factual controls
**Where found**
- `frontend/src/pages/DashboardPage.tsx` lines 33-37, 81-85, 96-108, 545-570

**Why this is risky**
Claims like "Compliance Review", "Two-Factor Auth Enabled", "Encryption Active" appear authoritative even when not linked to verifiable control state.

**Real-world consequence**
- Trust and compliance complaints
- Misrepresentation risk during due diligence

**How to fix it**
1. Drive all status badges from backend truth only.
2. Replace unverifiable claims with "Not configured".
3. Add status provenance and timestamps.

**Safe rewrite**
"Security controls shown here reflect your current account configuration."

---

### [Critical] No anti-automation/rate limits on auth-sensitive endpoints
**Where found**
- `netlify/functions/auth-signin.js`
- `netlify/functions/auth-signup.js`
- `netlify/functions/auth-forgot-password.js`
- `netlify/functions/support-create.js`

**Why this is risky**
No rate limiting/CAPTCHA/account lockout enables brute force, signup abuse, and reset flooding.

**Real-world consequence**
- Credential stuffing attempts
- Abuse reports and provider actions
- Elevated fraud and operational load

**How to fix it**
1. Add per-IP and per-account throttling.
2. Add bot challenge (Turnstile/reCAPTCHA).
3. Add lockouts and anomaly alerts.

**Safe rewrite**
N/A

---

### [High] Support endpoint lacks server-side authentication enforcement
**Where found**
- `frontend/src/services/apiClient.ts` lines 209-210
- `netlify/functions/support-create.js` lines 21-77

**Why this is risky**
Frontend sends auth header, but backend does not verify token, allowing anonymous spam ingestion.

**Real-world consequence**
- Spam/phishing submissions
- Data quality degradation
- Abuse classification risk

**How to fix it**
1. Verify bearer token server-side for authenticated support route.
2. Separate anonymous flow with stricter CAPTCHA + rate limits.

**Safe rewrite**
N/A

---

### [High] CORS fallback uses `*` with credentials
**Where found**
- `netlify/functions/auth-utils.js` lines 24-28
- `netlify/functions/profile-picture.js` lines 7-11
- `netlify/functions/support-create.js` lines 8-12

**Why this is risky**
`Access-Control-Allow-Origin: *` + credentials is insecure/invalid behavior and may create inconsistent browser handling.

**Real-world consequence**
- Security scanner findings
- Broken auth behavior in some clients

**How to fix it**
1. Require explicit `FRONTEND_URL`.
2. Reflect only strict allowlisted origin.
3. Add `Vary: Origin`.

**Safe rewrite**
N/A

---

### [High] Password reset preview token/link leakage path
**Where found**
- `netlify/functions/auth-forgot-password.js` lines 62-71
- `frontend/src/components/SigninForm.tsx` lines 280-287

**Why this is risky**
Reset link previews are returned by API in non-production mode; misconfigured environments could leak reset tokens.

**Real-world consequence**
- Account takeover via token exposure

**How to fix it**
1. Never return reset tokens in API responses.
2. Deliver reset links only through email provider.

**Safe rewrite**
"If this email is registered, reset instructions have been sent."

---

### [High] Public key-based profile picture endpoint lacks access control
**Where found**
- `netlify/functions/profile-picture.js` lines 31-71
- `netlify/functions/auth-signup.js` lines 114-118

**Why this is risky**
Any holder of blob key can fetch profile media; no ownership check.

**Real-world consequence**
- Privacy violations and data access complaints

**How to fix it**
1. Use signed short-lived URLs or authenticated owner checks.
2. Avoid exposing stable storage keys in user profile URLs.

**Safe rewrite**
N/A

---

### [High] Missing strict security response headers (CSP/HSTS/frame policy)
**Where found**
- `netlify.toml` (no headers block)
- function response helpers (`auth-utils.js`) basic headers only

**Why this is risky**
Weak browser-side defense posture; poor scanner score.

**Real-world consequence**
- Lower trust grade and elevated exploitability window

**How to fix it**
Add global headers in `netlify.toml`:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options` / `frame-ancestors`
- `Referrer-Policy`
- `X-Content-Type-Options`

**Safe rewrite**
N/A

---

### [Medium] Signup legal links lead to missing routes
**Where found**
- `frontend/src/components/SignupForm.tsx` lines 205-210
- `frontend/src/App.tsx` routes do not include `/terms` or `/privacy`

**Why this is risky**
Dead legal links on onboarding can appear deceptive/non-compliant.

**Real-world consequence**
- User distrust and compliance complaints

**How to fix it**
1. Add real `/terms` and `/privacy` pages.
2. Keep legal links stable and indexable.

**Safe rewrite**
"By creating an account, you agree to our Terms of Service and Privacy Policy."

---

### [Medium] Identity/regulatory transparency insufficient for escrow-style claims
**Where found**
- `frontend/public/index.html` description
- `frontend/src/pages/AuthPage.tsx` and `DashboardPage.tsx` branding/claims

**Why this is risky**
Financial-style positioning without legal entity, license status, or jurisdiction disclosure can be interpreted as unverified or deceptive.

**Real-world consequence**
- Payment/compliance due-diligence rejection
- Abuse reports and user abandonment

**How to fix it**
1. Publish legal company details and jurisdiction.
2. State licensing/regulatory scope clearly.
3. Add explicit "not a bank" language if applicable.

**Safe rewrite**
"Operated by [Legal Company Name], registered in [Jurisdiction]. [License status statement]."

---

### [Medium] Broad sensitive data intake with weak consent granularity
**Where found**
- `frontend/src/components/SignupForm.tsx`
- `backend/src/db/schema.sql`

**Why this is risky**
Collects DOB, gender, phone, profile photo, and authority affiliation with minimal inline consent and purpose disclosure.

**Real-world consequence**
- Privacy/compliance complaints
- Increased legal review burden

**How to fix it**
1. Mark optional vs required fields clearly.
2. Add field-level purpose and retention note.
3. Add explicit consent mechanism for sensitive processing.

**Safe rewrite**
"We collect only the data needed to create and secure your account. Optional fields are clearly marked."

---

### [Medium] Frontend dependency risk visibility incomplete
**Where found**
- `frontend/package.json` (legacy CRA stack)
- `npm --prefix frontend audit --omit=dev --json` failed during this run

**Why this is risky**
Lack of reliable frontend audit output leaves vulnerability blind spots.

**Real-world consequence**
- Untracked known CVEs
- Security review friction

**How to fix it**
1. Add CI SCA with dependable npm advisory access.
2. Plan migration away from legacy CRA/react-scripts.

**Safe rewrite**
N/A

---

### [Low] Architecture drift and unused scaffolding increase operational risk
**Where found**
- `db/schema.ts`, `db/index.ts`, `drizzle.config.ts`
- legacy express backend still present under `backend/src`

**Why this is risky**
Multiple partially active paths cause security ownership confusion and deployment mistakes.

**Real-world consequence**
- Misconfigurations and stale controls

**How to fix it**
1. Consolidate to one production path.
2. Remove/deprecate unused scaffolding.

**Safe rewrite**
N/A

---

## Executive Summary
Top risks are misleading financial/compliance presentation, weak anti-abuse controls, support endpoint auth gap, CORS misconfiguration potential, and reset-token preview leakage path.

## Dangerous Site Risk Score
Score: **78 / 100** (high likelihood of trust/security flagging under abuse, policy, or due-diligence review).

## Legal / Trust / Compliance Concerns
- Weak legal identity transparency for financial-style claims
- Dead legal links on signup
- Limited consent granularity for sensitive fields
- Support/legal contact verification uncertainty

## Security Review
- Missing rate limits, CAPTCHA, and lockout controls
- Missing strict global security headers
- Incomplete frontend SCA signal in this run
- Profile image retrieval and support submit controls need hardening

## Content and Trust Review
Language strongly resembles production escrow operations and compliance assurances. Without verifiable backing, this can be interpreted as deceptive or fraudulent-adjacent by users and platforms.

## Safer Replacement Plan (Prioritized)
1. Add anti-abuse controls (rate limit + CAPTCHA + lockout)
2. Remove/label simulated financial/compliance claims
3. Enforce strict CORS origin allowlist
4. Require server-side auth for support route
5. Remove reset token previews from API responses
6. Add access controls/signed URLs for profile media
7. Add CSP/HSTS/frame/referrer headers
8. Fix legal route availability (`/terms`, `/privacy`)
9. Publish legal entity and regulatory scope
10. Clean architecture drift and harden dependency governance
