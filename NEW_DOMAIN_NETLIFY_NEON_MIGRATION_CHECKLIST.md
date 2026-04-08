# New Domain + New Netlify Account + New Neon Account Migration Checklist

This checklist helps you migrate this project safely to:
- a new paid domain
- a new Netlify account/team
- a new Neon account/database

Use this in order. Do not skip secret rotation.

---

## 1) Pre-Migration Prep

- Confirm current production URL and project ID (for rollback reference).
- Freeze non-critical code changes during migration window.
- Ensure local repo is clean and pushed to GitHub.
- Keep old Netlify/Neon accounts active until final cutover is verified.

### Record current values (for rollback only)
- Current Netlify site ID
- Current production URL
- Current DNS provider and records
- Current Neon project/branch/database names

---

## 2) Create New Netlify Project (New Account)

1. Log into the new Netlify account.
2. Connect the same GitHub repository.
3. Create a new site (do not reuse old site).
4. Set build settings:
   - Build command: `npm --prefix frontend ci && npm --prefix frontend run build`
   - Publish directory: `frontend/build`
   - Functions directory: `netlify/functions`

### CLI link to new site locally
```bash
npx netlify-cli logout
npx netlify-cli login
npx netlify-cli link --id <NEW_NETLIFY_SITE_ID>
npx netlify-cli status
```

---

## 3) Create New Neon Project + Database

1. In the new Neon account, create a new project.
2. Create a production branch and database.
3. Copy both connection strings:
   - pooled URL
   - unpooled URL

### Set DB env vars on new Netlify site
```bash
npx netlify-cli env:set DATABASE_URL "<NEW_POOLED_DATABASE_URL>"
npx netlify-cli env:set NETLIFY_DATABASE_URL "<NEW_POOLED_DATABASE_URL>"
npx netlify-cli env:set NETLIFY_DATABASE_URL_UNPOOLED "<NEW_UNPOOLED_DATABASE_URL>"
```

### Initialize schema on new DB
```bash
psql "<NEW_UNPOOLED_DATABASE_URL>" -f backend/src/db/schema.sql
```

---

## 4) Set Security-Critical Environment Variables (New Site)

Set these in new Netlify site environment variables (never reuse old secrets):

```bash
npx netlify-cli env:set JWT_SECRET "<new-strong-random-secret>"
npx netlify-cli env:set JWT_REFRESH_SECRET "<new-strong-random-secret>"
npx netlify-cli env:set PROFILE_PICTURE_SIGNING_SECRET "<new-strong-random-secret>"
npx netlify-cli env:set FRONTEND_URL "https://<your-new-domain>"
```

Generate strong secrets locally:
```bash
openssl rand -base64 48
```

Notes:
- Use different values for each secret.
- Minimum recommended entropy: 32+ bytes random.

---

## 5) Netlify Blobs + Function Prereqs

This app uses Netlify Blobs in functions (rate limits, support messages, password resets, profile images).

Verify on new site:
- Functions are enabled.
- Blob-backed flows can read/write successfully.
- No permission errors in function logs after test requests.

---

## 6) Configure Paid Domain on New Netlify Site

1. Add custom domain in new site: `Site configuration -> Domain management`.
2. Update DNS at registrar:
   - apex/root: ALIAS/ANAME/A as instructed by Netlify
   - `www`: CNAME to Netlify target
3. Enable/verify HTTPS certificate issuance.
4. Set primary domain and enforce HTTPS redirect.

Wait for DNS propagation before final cutover validation.

---

## 7) Deploy to New Site

```bash
npx netlify-cli deploy --prod
```

Confirm deploy output shows the new site URLs.

---

## 8) Post-Deploy Validation (Must Pass)

### Auth/session
- Sign up works
- Sign in works
- Refresh token flow works
- Logout clears refresh cookie
- Forgot password flow works end-to-end

### Data
- New user appears in new Neon DB
- `escrow_accounts` row created
- `transactions` row created
- `audit_logs` written

### Blobs
- Profile picture upload + retrieval works
- Support form writes ticket
- Rate limiting responds correctly (429 when exceeded)

### Routing/UI
- `/` landing page loads
- `Join ISEA Today` -> `/signup`
- `Sign In to Your Account` -> `/signin`
- Dashboard loads after sign in

### Security headers
Check response headers exist on new domain:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

---

## 9) Cutover + Rollback Plan

### Cutover
- Switch primary traffic to new paid domain/new Netlify site.
- Monitor deploy logs + function logs + Neon metrics for at least 24h.

### Rollback
If critical failures occur:
- Repoint DNS back to old Netlify site.
- Re-enable old production environment.
- Keep old DB untouched until issue is resolved.

---

## 10) Decommission Old Accounts (After Stability Window)

After 3-7 days of stable traffic:
- Revoke old Netlify deploy tokens and API keys.
- Rotate any shared credentials that existed before migration.
- Disable/delete old Neon project only after final backup.
- Remove old site env vars/secrets.

---

## 11) Recommended Hardening During Migration

- Enforce team 2FA on new Netlify account.
- Restrict who can trigger production deploys.
- Keep CI security audit checks enabled.
- Update frontend dependency stack away from `react-scripts` when possible.
- Keep rate limiting strict (prefer fail-closed for auth-critical endpoints).

---

## Quick Command Reference

```bash
# Link this repo to new Netlify site
npx netlify-cli link --id <NEW_NETLIFY_SITE_ID>

# Set core env vars
npx netlify-cli env:set DATABASE_URL "<NEW_POOLED_DATABASE_URL>"
npx netlify-cli env:set NETLIFY_DATABASE_URL "<NEW_POOLED_DATABASE_URL>"
npx netlify-cli env:set NETLIFY_DATABASE_URL_UNPOOLED "<NEW_UNPOOLED_DATABASE_URL>"
npx netlify-cli env:set JWT_SECRET "<secret>"
npx netlify-cli env:set JWT_REFRESH_SECRET "<secret>"
npx netlify-cli env:set PROFILE_PICTURE_SIGNING_SECRET "<secret>"
npx netlify-cli env:set FRONTEND_URL "https://<your-new-domain>"

# Run schema
psql "<NEW_UNPOOLED_DATABASE_URL>" -f backend/src/db/schema.sql

# Deploy
npx netlify-cli deploy --prod
```

