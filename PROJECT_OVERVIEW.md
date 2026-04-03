# ISEA Authentication System - Project Overview

## 📦 Complete Project Delivery

```
isea-entry/
│
├── 📁 backend/                           (Node.js/Express API)
│   ├── src/
│   │   ├── 📁 db/
│   │   │   ├── db.ts                    (Database connection pool)
│   │   │   └── schema.sql               (PostgreSQL schema with 5 tables)
│   │   │
│   │   ├── 📁 controllers/
│   │   │   └── authController.ts        (signup, signin, refresh, profile CRUD)
│   │   │
│   │   ├── 📁 routes/
│   │   │   └── authRoutes.ts            (5 API endpoints with validation)
│   │   │
│   │   ├── 📁 middleware/
│   │   │   └── auth.ts                  (JWT protection + error handling)
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── auth.ts                  (bcryptjs, JWT, token utils)
│   │   │   └── fileUpload.ts            (S3 + Sharp image optimization)
│   │   │
│   │   └── server.ts                    (Express app entry point)
│   │
│   ├── package.json                     (Dependencies: Express, bcryptjs, JWT, etc.)
│   ├── tsconfig.json                    (TypeScript configuration)
│   ├── .env.example                     (Environment template)
│   └── README (in root)
│
├── 📁 frontend/                          (React SPA with TypeScript)
│   ├── src/
│   │   ├── 📁 components/
│   │   │   ├── SignupForm.tsx           (10+ form fields, validation)
│   │   │   └── SigninForm.tsx           (Email/username login)
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── AuthPage.tsx             (Tab-based UI, form routing)
│   │   │   └── DashboardPage.tsx        (User profile, account info display)
│   │   │
│   │   ├── 📁 stores/
│   │   │   └── authStore.ts             (Zustand: signup, signin, logout, state)
│   │   │
│   │   ├── 📁 services/
│   │   │   └── apiClient.ts             (Axios: token refresh, interceptors)
│   │   │
│   │   ├── App.tsx                      (Routes, ProtectedRoute wrapper)
│   │   ├── index.tsx                    (React entry point)
│   │   └── index.css                    (Tailwind + custom styles)
│   │
│   ├── public/
│   │   └── index.html                   (HTML template)
│   │
│   ├── package.json                     (Dependencies: React, Zustand, etc.)
│   ├── tsconfig.json                    (TypeScript configuration)
│   └── tailwind.config.ts               (Dark theme with purple accent)
│
├── 📄 DOCUMENTATION.md                   (Complete API reference + setup)
├── 📄 DEPLOYMENT.md                      (Production deployment guide)
├── 📄 DASHBOARD_INTEGRATION.md          (Dashboard dev integration guide)
├── 📄 IMPLEMENTATION_CHECKLIST.md       (Deliverables checklist)
├── 📄 README.md                          (Project overview)
│
├── 🐳 docker-compose.yml                 (Dev environment: PostgreSQL)
├── 📜 setup.sh                           (Automated setup script)
└── 📄 .gitignore                         (Git exclusions)
```

---

## 🌐 API Architecture

```
CLIENT (React)                    BACKEND (Node.js)              DATABASE (PostgreSQL)
┌──────────────┐                ┌────────────────┐              ┌──────────────┐
│ SignupForm   │                │ POST /signup   │              │ users        │
│              ├───FormData────>│                │             │ table        │
│ + Picture    │   + validation │ Verify Email   │─────INSERT──>│              │
└──────────────┘                │ Hash Password  │              │ escrow_      │
       │                        │ Upload Picture │              │ accounts     │
       │                        │ Generate JWT   │              │              │
       │                        │ Create Account │              └──────────────┘
       │                        └────────────────┘
       │
       │ accessToken + refreshToken
       v
┌──────────────┐                ┌────────────────┐
│ Dashboard    │                │ GET /auth/me   │
│              ├─Bearer Token──>│                │────SELECT──>│
│ Display Data │   (Protected)  │ Return User +  │              │ Fetch user
│ + Picture    │                │ Escrow Account │<─────────────│
└──────────────┘                └────────────────┘
```

---

## 🔐 Authentication Flow

```
┌─ SIGNUP FLOW ─────────────────────────────┐
│                                            │
│  1. User fills form + uploads picture     │
│  2. POST /auth/signup (FormData)          │
│  3. Validate email, password strength     │
│  4. Upload picture to S3 (optimized)      │
│  5. Hash password (bcryptjs, 12 rounds)   │
│  6. Create user in database               │
│  7. Create escrow account                 │
│  8. Generate JWT tokens                   │
│  9. Store refresh token hash              │
│  10. Return user + tokens + accountId     │
│  11. Redirect to dashboard                │
│                                            │
└────────────────────────────────────────────┘

┌─ SIGNIN FLOW ──────────────────────────────┐
│                                            │
│  1. User enters email + password           │
│  2. POST /auth/signin (JSON)               │
│  3. Find user by email/username            │
│  4. Compare password with hash             │
│  5. Generate new JWT tokens               │
│  6. Store refresh token hash              │
│  7. Log signin event (audit)              │
│  8. Return tokens + user data             │
│  9. Redirect to dashboard                 │
│                                            │
└────────────────────────────────────────────┘

┌─ TOKEN REFRESH FLOW ───────────────────────┐
│                                            │
│  1. Access token expires (1h)             │
│  2. API returns 401 (unauthorized)        │
│  3. Interceptor extracts refresh token    │
│  4. POST /auth/refresh-token              │
│  5. Validate refresh token                │
│  6. Generate new access token             │
│  7. Automatic retry original request      │
│  8. User never sees the refresh           │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🗄️ Database Design

### Users Table (Core Account)
```javascript
{
  id: UUID (primary key),
  email: VARCHAR UNIQUE,           // john@example.com
  first_name: VARCHAR,             // John
  last_name: VARCHAR,              // Doe
  phone: VARCHAR,                  // +1 (555) 000-0000
  gender: VARCHAR,                 // male/female/other
  date_of_birth: DATE,             // 1990-01-15
  profile_picture_url: VARCHAR,    // https://s3.amazonaws.com/...
  affiliated_authorities: VARCHAR, // Government Agency
  postal_code: VARCHAR,            // 12345
  password_hash: VARCHAR,          // bcrypt hash
  account_type: VARCHAR,           // 'individual' | 'business'
  currency: VARCHAR,               // USD
  region: VARCHAR,                 // International
  email_verified: BOOLEAN,         // for future use
  two_factor_enabled: BOOLEAN,     // for future use
  created_at: TIMESTAMP,           // 2024-01-15 10:00:00
  updated_at: TIMESTAMP
}
```

### Escrow Accounts Table (Linked)
```javascript
{
  id: UUID (primary key),
  user_id: UUID (FOREIGN KEY),     // links to users.id
  account_id: VARCHAR UNIQUE,      // ISEA-A1B2-C3D4
  escrow_deposit_amount: DECIMAL,  // 10000.00
  duration_days: INT,              // 30
  personal_item: VARCHAR,          // Description of item
  account_status: VARCHAR,         // pending/activated/completed
  status: VARCHAR,                 // redundant but kept for compatibility
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Audit Logs Table (Security)
```javascript
{
  id: UUID (primary key),
  user_id: UUID (FOREIGN KEY, nullable),
  action: VARCHAR,                 // 'signup', 'signin', 'signin_failed'
  ip_address: VARCHAR,             // 192.168.1.1
  user_agent: TEXT,                // Browser info
  status: VARCHAR,                 // 'success' | 'failed'
  details: JSONB,                  // Additional info
  created_at: TIMESTAMP
}
```

---

## 📊 File Upload & Processing

```
USER UPLOADS IMAGE
│
├─ Validate file type (JPEG, PNG, WebP)
├─ Validate file size (max 5MB)
│
├─ Optimize with Sharp:
│  ├─ Resize to 300x300 (center-crop)
│  ├─ Convert to WebP format
│  └─ Compress quality to 80%
│
├─ Upload to AWS S3:
│  ├─ Bucket: isea-profiles
│  ├─ Key: {userId}/{timestamp}.webp
│  ├─ ACL: public-read
│  └─ Cache: 1 day
│
├─ Get CDN URL:
│  └─ https://isea-profiles.s3.amazonaws.com/...
│
└─ Store URL in database
   └─ users.profile_picture_url
```

---

## 🎨 Frontend UI Layout

### Sign In / Sign Up Page (Responsive)
```
┌───────────────────────────────────────┐
│          ISEA Authentication          │
│                                       │
│    ┌─ Sign In ─ Sign Up (Tabs) ─┐   │
│    │                            │   │
│    │  │ Sign In  │ Sign Up │    │   │
│    │  ├─────────────────────┤   │   │
│    │  │                     │   │   │
│    │  │  Email/Username     │   │   │
│    │  │  [         ]        │   │   │
│    │  │                     │   │   │
│    │  │  Password           │   │   │
│    │  │  [         ]        │   │   │
│    │  │  [x] Remember Me    │   │   │
│    │  │  -> Forgot Password?│   │   │
│    │  │                     │   │   │
│    │  │  [ Sign In ]        │   │   │
│    │  │                     │   │   │
│    │  │  Terms... Privacy   │   │   │
│    │                            │   │
│    └────────────────────────────┘   │
│                                       │
│     © 2024 ISEA. All rights reserved  │
└───────────────────────────────────────┘

Mobile: Single column, full viewport width
Desktop: 400px max width, centered
```

### Dashboard Page (Sample)
```
┌──────────────────────────────────────────┐
│ Welcome, John!                           │
│ Your ISEA Account Dashboard              │
├──────────────────────────────────────────┤
│                                          │
│  ┌─ Profile    ┐  ┌─ Account Status  ┐ │
│  │             │  │                  │ │
│  │ [Picture]   │  │ Account: ISEA... │ │
│  │ John Doe    │  │ Status: Pending  │ │
│  │ john@ex.com │  │ Deposit: $1000   │ │
│  │             │  │                  │ │
│  └─────────────┘  └──────────────────┘ │
│                                          │
│  ┌──────────── Additional Info ────────┐ │
│  │ Gender: Male  | DOB: 1990-01-15    │ │
│  │ Postal: 12345 | Phone: +1(555)0000 │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [ Update Profile ]  [ Sign Out ]       │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🔧 Technology Stack Summary

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password**: Hashing bcryptjs (12 rounds)
- **Image Processing**: Sharp
- **Cloud Storage**: AWS S3
- **Validation**: express-validator
- **File Upload**: multer
- **Security**: Helmet, CORS
- **Pool Management**: pg (native PostgreSQL driver)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **State**: Zustand
- **UI Framework**: Tailwind CSS
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Routing**: React Router DOM
- **Utils**: clsx

### Database & Infrastructure
- **Database**: PostgreSQL 12+
- **Schema**: 5 tables with relationships
- **Indexes**: 8 indexes for performance
- **Storage**: AWS S3 (or local fallback)
- **Environment**: Docker Compose available

---

## 📈 Key Metrics

| Metric | Value |
|--------|-------|
| Backend API Endpoints | 5 |
| Database Tables | 5 |
| Frontend Pages | 3 |
| Frontend Components | 5+ |
| Form Fields (Sign-up) | 12 |
| Type Safety | Full TypeScript |
| Password Hash Rounds | 12 |
| JWT Access Token TTL | 1 hour |
| Refresh Token TTL | 7 days |
| Image Compression | WebP 80% quality |
| Max File Upload | 5 MB |

---

## ✅ What's Ready for Dashboard Developers

1. **Complete User Data Model**
   - All profile fields available
   - Profile picture URL (CDN)
   - Linked escrow account info

2. **Secure Data Access**
   - `/api/auth/me` endpoint (protected)
   - Zustand store integration
   - Automatic token refresh

3. **Database Schema**
   - Users table with all fields
   - Escrow accounts table (linked)
   - Audit logs for compliance

4. **Example Components**
   - SignupForm for reference
   - Dashboard template
   - Protected route wrapper

5. **Documentation**
   - Complete API reference
   - Integration examples
   - TypeScript types

6. **Security**
   - Password hashing
   - JWT authentication
   - CORS protection
   - Audit logging

---

## 🚀 Next Steps

1. **Verify Environment**
   ```bash
   npm install (backend & frontend)
   createdb isea_db
   psql -d isea_db -f backend/src/db/schema.sql
   npm run dev (backend)
   npm start (frontend)
   ```

2. **Test Authentication**
   - Sign up with profile picture
   - Verify picture uploads to S3
   - Test sign-in flow
   - Check dashboard displays data

3. **Build Dashboard**
   - Use `/api/auth/me` for user data
   - Display profile picture from CDN URL
   - Show escrow account details
   - Build dashboard features

4. **Production**
   - Follow DEPLOYMENT.md
   - Configure AWS S3
   - Setup PostgreSQL RDS
   - Deploy backend & frontend

---

## 📞 Questions?

- **API Details**: See DOCUMENTATION.md
- **Integration**: See DASHBOARD_INTEGRATION.md
- **Deployment**: See DEPLOYMENT.md
- **Checklist**: See IMPLEMENTATION_CHECKLIST.md
