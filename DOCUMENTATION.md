# ISEA Authentication System - Complete Documentation

## Overview

This is a full-stack authentication system for the ISEA (International Secure Escrow Account) platform. It includes:

- **Sign-up/Registration**: Create new user accounts with comprehensive profile information and profile picture upload
- **Sign-in**: Secure login with JWT-based authentication
- **Profile Management**: Update user profile information
- **Session Management**: Secure token refresh mechanism
- **Profile Picture Handling**: Image upload, optimization, and cloud storage integration

---

## Architecture Overview

```
┌─────────────────────────────┐
│     Frontend (React)        │
│  - SignupForm               │
│  - SigninForm               │
│  - DashboardPage            │
│  - Auth Store (Zustand)     │
└──────────────┬──────────────┘
               │ HTTPS/JSON
┌──────────────▼──────────────┐
│   Backend (Node/Express)    │
│  - Auth Routes              │
│  - Auth Controller          │
│  - JWT Middleware           │
│  - File Upload Handler      │
└──────────────┬──────────────┘
               │ SQL
┌──────────────▼──────────────┐
│   PostgreSQL Database       │
│  - Users Table              │
│  - Escrow Accounts Table    │
│  - Refresh Tokens Table     │
│  - Audit Logs               │
└─────────────────────────────┘
               │
┌──────────────▼──────────────┐
│  AWS S3 / Cloud Storage     │
│  - Profile Pictures         │
└─────────────────────────────┘
```

---

## Backend Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 12+
- AWS S3 account (or local file storage fallback)

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create database**
   ```bash
   createdb isea_db
   psql -U isea_user -d isea_db -f src/db/schema.sql
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The backend will run on `http://localhost:5000`

---

## Frontend Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- React 18+

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000`

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### 1. Sign Up
**POST** `/auth/signup`

**Request**
```json
Content-Type: multipart/form-data

{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123!",
  "phone": "+1 (555) 000-0000",
  "gender": "male",
  "date_of_birth": "1990-01-15",
  "affiliated_authorities": "Government Agency",
  "postal_code": "12345",
  "profile_picture": <binary file>
}
```

**Response** (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://bucket.s3.amazonaws.com/..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accountId": "ISEA-A1B2-C3D4"
}
```

**Error Response** (400/500)
```json
{
  "error": "Email already registered"
}
```

---

#### 2. Sign In
**POST** `/auth/signin`

**Request**
```json
{
  "username_or_email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK)
```json
{
  "message": "Signed in successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "profile_picture_url": "https://bucket.s3.amazonaws.com/..."
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accountId": "ISEA-A1B2-C3D4"
}
```

---

#### 3. Refresh Token
**POST** `/auth/refresh-token`

**Request**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### 4. Get Current User
**GET** `/auth/me`

**Headers**
```
Authorization: Bearer <accessToken>
```

**Response** (200 OK)
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1 (555) 000-0000",
    "gender": "male",
    "date_of_birth": "1990-01-15",
    "profile_picture_url": "https://bucket.s3.amazonaws.com/...",
    "affiliated_authorities": "Government Agency",
    "postal_code": "12345"
  },
  "escrowAccount": {
    "account_id": "ISEA-A1B2-C3D4",
    "account_status": "pending",
    "escrow_deposit_amount": null,
    "duration_days": null
  }
}
```

---

#### 5. Update Profile
**PUT** `/auth/profile`

**Headers**
```
Authorization: Bearer <accessToken>
```

**Request**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1 (555) 111-1111",
  "gender": "female",
  "postal_code": "54321"
}
```

**Response** (200 OK)
```json
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

---

## Database Schema

### Users Table (`users`)
```sql
- id: UUID (PRIMARY KEY)
- email: VARCHAR(255) UNIQUE NOT NULL
- username: VARCHAR(100)
- password_hash: VARCHAR(255) NOT NULL
- first_name: VARCHAR(100) NOT NULL
- last_name: VARCHAR(100) NOT NULL
- phone: VARCHAR(20)
- gender: VARCHAR(50)
- date_of_birth: DATE
- profile_picture_url: VARCHAR(500)
- affiliated_authorities: VARCHAR(255)
- postal_code: VARCHAR(20)
- account_type: VARCHAR(50) DEFAULT 'individual'
- currency: VARCHAR(10) DEFAULT 'USD'
- region: VARCHAR(100) DEFAULT 'International'
- email_verified: BOOLEAN DEFAULT FALSE
- two_factor_enabled: BOOLEAN DEFAULT FALSE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Escrow Accounts Table (`escrow_accounts`)
```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY -> users.id)
- account_id: VARCHAR(100) UNIQUE NOT NULL
- escrow_deposit_amount: DECIMAL(15,2)
- duration_days: INT
- personal_item: VARCHAR(500)
- status: VARCHAR(50) DEFAULT 'pending'
- account_status: VARCHAR(50) DEFAULT 'pending'
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Refresh Tokens Table (`refresh_tokens`)
```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY -> users.id)
- token_hash: VARCHAR(255) UNIQUE NOT NULL
- expires_at: TIMESTAMP NOT NULL
- created_at: TIMESTAMP
```

### Audit Logs Table (`audit_logs`)
```sql
- id: UUID (PRIMARY KEY)
- user_id: UUID (FOREIGN KEY -> users.id, nullable)
- action: VARCHAR(100) NOT NULL
- ip_address: VARCHAR(45)
- user_agent: TEXT
- status: VARCHAR(50)
- details: JSONB
- created_at: TIMESTAMP
```

---

## Security Features

### 1. Password Security
- **Hashing**: bcryptjs with salt rounds = 12
- **Requirements**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one number
  - At least one special character

### 2. JWT Token Management
- **Access Token**: 1 hour expiration
- **Refresh Token**: 7 days expiration
- **Token Refresh**: Automatic token refresh on expiration
- **Token Blacklisting**: Refresh tokens stored with hash for validation

### 3. File Upload Security
- **File Type Validation**: Only JPEG, PNG, WebP allowed
- **File Size Limit**: 5MB maximum
- **Image Optimization**: Sharp library for image compression and resizing
- **Cloud Storage**: AWS S3 with public-read ACL

### 4. Database Security
- **Prepared Statements**: Parameterized queries to prevent SQL injection
- **CORS**: Restricted to frontend domain only
- **Helmet**: Security headers for HTTP responses

### 5. Audit Logging
- All authentication actions logged with:
  - User ID
  - Action type (signup, signin, etc.)
  - Status (success/failed)
  - IP address
  - Timestamp

---

## Data Handoff for Dashboard

### For Dashboard Development

The dashboard can retrieve all user data and profile picture using the existing `/auth/me` endpoint:

```typescript
// In dashboard component
const { user, escrowAccount } = await authService.getCurrentUser();

// Access profile picture
const profilePictureUrl = user.profile_picture_url;

// Display user information
console.log(user.first_name, user.last_name);
console.log(user.email);
console.log(user.phone);
console.log(escrowAccount.account_id);
```

### Available Data
All user data is available on the authenticated user context:
- Profile information (name, email, phone, date of birth, etc.)
- Profile picture URL (CDN link for direct display)
- Escrow account ID and status
- Gender, postal code, and affiliated authorities

### Image Display
Profile pictures are stored as WebP on AWS S3 CDN. Display directly:
```jsx
<img 
  src={user.profile_picture_url} 
  alt="Profile"
  className="w-20 h-20 rounded-full"
/>
```

---

## Environment Variables Reference

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=isea_db
DB_USER=isea_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_min_32_chars_long
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Server
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=isea-profiles
AWS_S3_URL=https://your-bucket.s3.amazonaws.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Deployment Checklist

### Frontend Deployment (Vercel/Netlify)
- [ ] Build: `npm run build`
- [ ] Set `REACT_APP_API_URL` to production API URL
- [ ] Deploy `build/` directory
- [ ] Configure CORS on backend for production domain

### Backend Deployment (Heroku/AWS/DigitalOcean)
- [ ] Build: `npm run build`
- [ ] Set all environment variables
- [ ] Run database migrations in production: `npm run migrate`
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/HTTPS
- [ ] Set `FRONTEND_URL` to production frontend domain

---

## Testing Credentials

For testing, use these credentials:

**Test Account:**
- Email: `test@example.com`
- Password: `TestPassword123!`

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` matches your frontend domain in backend `.env`
- Check CORS headers in response

### Database Connection Failed
- Verify PostgreSQL is running
- Check DB credentials in `.env`
- Ensure database exists: `psql -l`

### File Upload Fails
- Check file size (max 5MB)
- Verify file type (JPEG, PNG, WebP only)
- For S3: Verify AWS credentials and bucket permissions

### JWT Token Invalid
- Check token expiration
- Verify `JWT_SECRET` hasn't changed
- Clear localStorage and re-login

---

## Next Steps

1. **Dashboard Development**: Use `/auth/me` endpoint to fetch user data
2. **Email Verification**: Add email verification flow (optional)
3. **Password Reset**: Implement forgot password functionality
4. **Two-Factor Auth**: Enable optional 2FA via `two_factor_enabled` field
5. **Social Login**: Add OAuth providers (Google, GitHub)
6. **Profile Picture Updates**: Allow users to update profile picture

---

## Support

For issues or questions, check the backend logs:
```bash
# Backend
npm run dev

# View logs for errors
tail -f backend.log
```
