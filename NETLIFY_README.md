# Netlify Deployment Guide

## Environment Variables (Netlify Dashboard)

Set these in your Netlify site settings → Build & deploy → Environment variables:

```bash
# Database (external PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/database

# JWT Secrets (generate secure random strings)
JWT_SECRET=your-32-plus-character-secret-here
JWT_REFRESH_SECRET=your-32-plus-character-refresh-secret-here

# Frontend URL
FRONTEND_URL=https://your-site-name.netlify.app

# Optional: AWS S3 for file uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

## Local Development

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Set environment variables in `.env`:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   ```

3. Start development server:
   ```bash
   netlify dev
   ```

4. Test functions:
   ```bash
   node test-functions.js
   ```

## Database Setup

Run the schema in your PostgreSQL database:
```bash
psql $DATABASE_URL -f backend/src/db/schema.sql
```

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Clear session

## Security Features

- HTTP-only cookies for refresh tokens
- JWT access tokens with short expiry
- Token rotation on refresh
- CORS protection
- Password hashing with bcrypt
- Audit logging

## Deployment

1. Push to GitHub
2. Connect Netlify to your repo
3. Set build command: `npm run build`
4. Set publish directory: `frontend/build`
5. Set environment variables in Netlify dashboard
6. Deploy!

## Testing

Run the test script:
```bash
node test-functions.js
```

Or test manually:
```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/auth-signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","first_name":"Test","last_name":"User","password":"TestPass123!"}'
```