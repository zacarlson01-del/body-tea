# ISEA (International Secure Escrow Account) - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Authentication System](#authentication-system)
6. [Key Features](#key-features)
7. [File Descriptions](#file-descriptions)
8. [Setup & Installation](#setup--installation)
9. [Development](#development)
10. [Deployment](#deployment)
11. [Important Design Decisions](#important-design-decisions)

---

## Project Overview

**ISEA** is a secure escrow account management platform designed to handle international transactions with compliance and security at its core. 

### Purpose
- Allow users to create secure escrow accounts with deposit management
- Track account status through verification stages (Identity Submitted → Compliance Review → Activation)
- Store user data with full compliance requirements
- Provide a clean, professional interface for account management

### Key User Flows
1. **Signup**: User creates account with personal info, deposit amount, and duration
2. **Email Confirmation**: User verifies email address via Netlify Identity
3. **Dashboard Access**: Authenticated user views account overview, balance, and verification status
4. **Account Management**: View account details, transaction history, security settings

---

## Architecture

### High-Level Overview
```
┌─────────────────────────────────────────────────────────┐
│  React Frontend (Deployed on Netlify)                  │
│  ├─ Authentication (Netlify Identity / GoTrue)         │
│  ├─ Pages (Auth, Dashboard)                            │
│  ├─ Components (Forms, UI elements)                    │
│  └─ State Management (Zustand)                         │
└─────────────────────────────────────────────────────────┘
           │
           │ (API calls via GoTrue SDK)
           │
┌─────────────────────────────────────────────────────────┐
│  Netlify Identity (Backend-as-a-Service)               │
│  ├─ User authentication (JWT tokens)                   │
│  ├─ Email confirmation                                 │
│  ├─ Password recovery                                  │
│  └─ User metadata storage (custom fields)              │
└─────────────────────────────────────────────────────────┘
           │
           │ (Admin panel)
           │
┌─────────────────────────────────────────────────────────┐
│  Netlify Dashboard                                      │
│  └─ Admin manages users, views data, edits records     │
└─────────────────────────────────────────────────────────┘
```

### Key Design Principle
**No backend server required.** All authentication and user data management is handled by Netlify Identity (GoTrue). The admin can manage users directly via Netlify's dashboard without writing code.

---

## Technology Stack

### Frontend
- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **React Router v6** - Client-side routing
- **Zustand** - Lightweight state management (auth store)
- **React Hook Form** - Form state and validation
- **Tailwind CSS** - Utility-first CSS framework
- **gotrue-js** - Netlify Identity JavaScript SDK

### Styling
- **Tailwind CSS** - Primary styling
- **PostCSS** - CSS processing
- **Autoprefixer** - Browser compatibility

### Build & Deployment
- **Create React App** - React build tooling
- **Netlify** - Hosting and authentication backend
- **Netlify Functions** - Serverless functions (prepared for future use)

### Development
- **Node.js / npm** - Package management
- **git** - Version control

---

## Directory Structure

```
isea-entry/
├── frontend/                          # React app (deployed to Netlify)
│   ├── public/
│   │   ├── index.html
│   │   ├── logo.png                   # ISEA logo (must be placed here)
│   │   └── manifest.json
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx           # Sign In / Sign Up page
│   │   │   └── DashboardPage.tsx      # User dashboard (after login)
│   │   ├── components/
│   │   │   ├── SigninForm.tsx         # Sign in form component
│   │   │   └── SignupForm.tsx         # Sign up form component
│   │   ├── stores/
│   │   │   └── authStore.ts           # Zustand auth state management
│   │   ├── services/
│   │   │   └── apiClient.ts           # GoTrue SDK initialization & helper functions
│   │   ├── App.tsx                    # Main app component (routing)
│   │   ├── index.css                  # Global styles (Tailwind)
│   │   └── index.tsx                  # React entry point
│   ├── package.json                   # Dependencies
│   ├── postcss.config.js              # PostCSS config (Tailwind)
│   ├── tailwind.config.js             # Tailwind CSS config
│   └── tsconfig.json                  # TypeScript config
├── netlify.toml                       # Netlify deployment config
├── docker-compose.yml                 # Docker setup (legacy, not used)
└── README.md                          # Project readme

```

---

## Authentication System

### How Netlify Identity Works

1. **Signup Flow**
   - User submits form with email, password, and custom metadata
   - `authService.signup()` calls `auth.signup(email, password, metadata)`
   - GoTrue stores user in Netlify database
   - Metadata (name, phone, escrow details) stored in `user_metadata` JSON field
   - Netlify sends confirmation email to user

2. **Email Confirmation**
   - User clicks confirmation link in email
   - Link contains `#confirmation_token=<token>`
   - App detects token and calls `authService.confirm(token)`
   - Email becomes verified, user can now login

3. **Signin Flow**
   - User submits email + password
   - `authService.signin()` calls `auth.login(email, password, true)`
   - GoTrue returns JWT access token
   - SDK stores token automatically (browser storage)
   - User state is restored from GoTrace cache

4. **Session Management**
   - GoTrue maintains session automatically
   - `authService.getCurrentUser()` returns cached user object
   - Logout calls `user.logout()` which clears session
   - Page refresh restores session from GoTrue cache

### Key Functions in apiClient.ts

```typescript
// Signup with custom metadata
authService.signup(payload: SignupPayload)
  → auth.signup(email, password, { ...metadata })

// Login
authService.signin(payload: SigninPayload)
  → auth.login(email, password, true)

// Get current user (no API call, cached locally)
authService.getCurrentUser()
  → auth.currentUser()

// Logout
authService.logout()
  → auth.currentUser().logout()

// Confirm email after signup
authService.confirm(token: string)
  → auth.confirm(token, true)

// Password recovery
authService.requestPasswordRecovery(email: string)
  → auth.requestPasswordRecovery(email)
```

### User Data Structure

User metadata stored in Netlify:
```typescript
{
  full_name: "John Doe",
  first_name: "John",
  last_name: "Doe",
  phone: "555-1234",
  gender: "male",
  date_of_birth: "1990-01-15",
  affiliated_authorities: "...",
  postal_code: "12345",
  escrow_account: {
    account_id: "ISEA-ABCD-1234",      // Auto-generated unique ID
    account_status: "pending",          // pending, active, completed, etc.
    escrow_deposit_amount: 5000,
    duration_days: 30,
    personal_item: "Yes"
  }
}
```

---

## Key Features

### 1. User Authentication
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Email confirmation workflow
- ✅ Automatic session restoration
- ✅ Logout
- ✅ Password recovery (Netlify built-in)

### 2. User Profile
- ✅ Personal information (name, phone, gender, DOB)
- ✅ Compliance information (affiliated authorities)
- ✅ Profile picture upload
- ✅ Custom account ID generation

### 3. Escrow Account Management
- ✅ Create account with deposit amount
- ✅ Set account duration (days)
- ✅ Track account status (pending → active → completed)
- ✅ Personal item designation
- ✅ Display available balance

### 4. Dashboard
- ✅ Account overview (ID, type, currency, region)
- ✅ Available balance display
- ✅ Verification progress tracking (3-stage pipeline)
- ✅ Security & compliance status
- ✅ Transaction history (placeholder for future implementation)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Sidebar navigation (hidden on mobile)

### 5. UI/UX
- ✅ Light grey sign-in page with white card
- ✅ Light grey sign-up page with white card
- ✅ Dark gradient dashboard with sidebar
- ✅ Professional spacing and typography
- ✅ Color-coded status badges
- ✅ Icon-based form inputs
- ✅ Form validation with error messages
- ✅ Loading states
- ✅ Fully responsive layout

---

## File Descriptions

### Pages

#### `frontend/src/pages/AuthPage.tsx`
- **Purpose**: Handles both sign-in and sign-up UI
- **Layout**: 
  - Light grey background (bg-gray-100)
  - Logo with fallback brand display
  - Tagline: "Swift and secure transaction with ease"
  - White rounded card containing form
  - Language selector button
- **Features**:
  - Toggle between signin/signup modes
  - Auto-redirect to dashboard if already authenticated
  - Responsive typography (text-xl → sm:text-2xl → md:text-3xl)
- **Responsive**: Yes (mobile-first)

#### `frontend/src/pages/DashboardPage.tsx`
- **Purpose**: Main authenticated user dashboard
- **Layout**:
  - Dark gradient background (blue/teal theme)
  - Left sidebar (hidden on mobile) with logo and navigation
  - Main content area with responsive padding
  - Card-based layout for information display
- **Features**:
  - Welcome message with user's first name
  - Account overview card (account ID, type, currency, region, balance)
  - Verification progress (3-stage: Identity → Compliance → Activation)
  - Security & compliance status
  - Transaction history placeholder
  - Responsive grid (1 col mobile → 2 col tablet → 3 col desktop)
  - Logout button
- **Responsive**: Yes (sidebar hidden on mobile, grid adjusts)

### Components

#### `frontend/src/components/SigninForm.tsx`
- **Purpose**: Email + password signin form
- **Fields**:
  - Email (with person icon)
  - Password (with lock icon, show/hide toggle)
  - Forgot password link
- **Features**:
  - Form validation (required fields)
  - Show/hide password toggle with eye icon
  - Loading state (button disabled during signin)
  - Error message display
  - Terms and privacy links
  - "Sign up" link to switch mode
- **Styling**: Tailwind with custom icon SVGs

#### `frontend/src/components/SignupForm.tsx`
- **Purpose**: Comprehensive signup form with escrow account creation
- **Fields**:
  - Email (required, pattern validation)
  - First Name (required)
  - Last Name (required)
  - Phone (optional)
  - Gender (select, optional)
  - Affiliated Authorities (optional)
  - Date of Birth (optional)
  - Deposit Amount in USD (optional)
  - Duration in days (optional)
  - Personal Item (Yes/No select)
  - Profile Picture (file upload, image types only)
  - Password (required, min 8 chars)
  - Retype Password (required, must match)
- **Features**:
  - Form validation with error messages
  - Success state shows "Check your email" message
  - Loading state
  - Password confirmation validation
  - File input for profile picture
  - Terms and privacy agreement
- **Styling**: Light grey fields (bg-gray-100), red error text

### State Management

#### `frontend/src/stores/authStore.ts`
- **Purpose**: Zustand store managing all auth state
- **State**:
  - `user`: Current user object with personal data
  - `escrowAccount`: Escrow account details
  - `isAuthenticated`: Boolean, true if user logged in
  - `isLoading`: Boolean, true during async operations
  - `error`: Error message string
  - `signupSuccess`: Boolean, true after successful signup (shows email confirmation prompt)
- **Actions**:
  - `signup(payload)`: Create new account
  - `signin(payload)`: Login with email/password
  - `logout()`: Clear session
  - `getCurrentUser()`: Load user from cache or restore session
- **Helper Functions**:
  - `mapToUser()`: Convert GoTrue user object to app User interface
  - `mapToEscrow()`: Extract escrow account data from user metadata
- **Key Change**: No localStorage token management; GoTrue handles all token storage automatically

### Services

#### `frontend/src/services/apiClient.ts`
- **Purpose**: Initialize GoTrue SDK and define auth service methods
- **Configuration**:
  - `IDENTITY_URL = /.netlify/identity` (Netlify Identity endpoint)
  - Uses gotrue-js library
- **Helper Functions**:
  - `generateAccountId()`: Creates unique ISEA-XXXX-XXXX format IDs
- **Auth Service Methods**:
  - `signup(payload)`: Register with metadata
  - `signin(payload)`: Login
  - `getCurrentUser()`: Get cached user
  - `logout()`: Sign out
  - `confirm(token)`: Verify email confirmation
  - `requestPasswordRecovery(email)`: Initiate password reset
- **Key Concept**: All API calls go to Netlify Identity (/.netlify/identity) via GoTrue SDK. No custom backend needed.

### Main App

#### `frontend/src/App.tsx`
- **Purpose**: Root component with routing and global auth flow
- **Features**:
  - Client-side routing with React Router
  - Email confirmation token detection and handling
  - Auto-restore user session on app load
  - Loading state for confirmation flow
  - Redirect to signin/dashboard based on auth state
- **Routes**:
  - `/` → redirects to `/signin` or `/dashboard`
  - `/signin` → AuthPage with signin mode
  - `/signup` → AuthPage with signup mode
  - `/dashboard` → DashboardPage (protected, requires auth)

### Configuration Files

#### `netlify.toml`
- **Purpose**: Netlify deployment and build configuration
- **Key Settings**:
  - Build command: `cd frontend && npm run build`
  - Build output: `frontend/build`
  - SPA redirect rule: `/* → /index.html` (for client-side routing)
  - Identity configuration enabled
- **Environment**: No build environment variables needed initially

#### `tailwind.config.js`
- **Purpose**: Tailwind CSS customization
- **Content Paths**: `./src/**/*.{js,ts,jsx,tsx}`, `./public/index.html`
- **Custom Theme**: None (uses default); can be extended
- **Key Colors Used**: Purple (primary), blue (accent), white, grey
- **Note**: JavaScript file (not TypeScript) for react-scripts compatibility

#### `postcss.config.js`
- **Purpose**: PostCSS processing pipeline
- **Plugins**:
  - `tailwindcss`: Processes Tailwind directives
  - `autoprefixer`: Adds vendor prefixes for browser compatibility

#### `tsconfig.json`
- **Purpose**: TypeScript configuration
- **Key Settings**:
  - `moduleResolution: "node"` (required for imports to work)
  - `jsx: "react-jsx"` (React 18 new JSX transform)
  - `strict: true` (strict type checking enabled)
- **Important**: Path aliases (@stores/, etc.) do NOT work with react-scripts; use relative imports

#### `package.json`
- **Key Dependencies**:
  - `react`, `react-dom` (UI framework)
  - `react-router-dom` (routing)
  - `zustand` (state management)
  - `react-hook-form` (form management)
  - `tailwindcss` (styling)
  - `gotrue-js` (Netlify Identity SDK)
  - `typescript` (type checking)
- **Dev Dependencies**: Build tools and linters

---

## Setup & Installation

### Prerequisites
- **Node.js** 16+ and npm
- **git** for version control
- **Netlify CLI** (for local development with Identity: `npm install -g netlify-cli`)

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd isea-entry/frontend
npm install --legacy-peer-deps
```

**Note**: `--legacy-peer-deps` flag is required due to react-scripts peer dependency constraints.

### Step 2: Add Logo
Place your ISEA logo at:
```
frontend/public/logo.png
```
Logo should be 200x100px minimum for good display.

### Step 3: Environment Setup
No `.env` file needed for local development. Netlify Identity is configured via `netlify.toml` and the deployed site's Netlify dashboard.

### Step 4: Run Locally

**Option A: With Netlify (Recommended - enables Identity)**
```bash
npm install -g netlify-cli      # If not installed
cd isea-entry
netlify dev                      # Runs React app + Netlify Identity locally
# Access at http://localhost:8888
```

**Option B: Standard React (No Identity - signin/signup won't work)**
```bash
cd isea-entry/frontend
npm start
# Access at http://localhost:3000
# But Netlify Identity won't function; you'll get auth errors
```

---

## Development

### Project Structure Quick Reference
- **Pages**: Create new pages in `frontend/src/pages/`
- **Components**: Reusable UI components in `frontend/src/components/`
- **State**: Add state stores to `frontend/src/stores/`
- **Services**: API integration in `frontend/src/services/`

### Common Development Tasks

#### Add a New Page
1. Create file: `frontend/src/pages/NewPage.tsx`
2. Add route in `App.tsx`
3. Import components and use hooks

#### Add a New Component
1. Create file: `frontend/src/components/NewComponent.tsx`
2. Use in pages or other components
3. Follow existing component patterns (React.FC, TypeScript interfaces for props)

#### Update Tailwind Styles
- Tailwind is already configured; just use classes in JSX
- Rebuild CSS automatically on save during `npm start`
- Custom colors/sizes can be added to `tailwind.config.js`

#### Modify Form Fields
- Update `SignupFormData` interface in `SignupForm.tsx`
- Add form field JSX
- Update payload construction in `onSubmit()`
- Update `SignupPayload` interface in `apiClient.ts` if backend field changes

#### Access User Data in Components
```typescript
import { useAuthStore } from '../stores/authStore';

function MyComponent() {
  const { user, escrowAccount } = useAuthStore();
  
  return (
    <div>
      <p>{user?.first_name}</p>
      <p>Account ID: {escrowAccount?.account_id}</p>
    </div>
  );
}
```

### Debugging Auth Issues
1. Open browser DevTools → Application tab
2. Check localStorage for `gotrue.js` token
3. Check Network tab for auth API calls to `/.netlify/identity`
4. Verify email confirmation in Netlify dashboard if signup succeeds but login fails

---

## Deployment

### Prerequisites for Deployment
1. **GitHub repository** (create and push code)
2. **Netlify account** (free tier works)
3. **Email service** (Netlify provides default or configure custom)

### Deployment Steps

#### Step 1: Push to GitHub
```bash
cd isea-entry
git add .
git commit -m "ISEA: Netlify Identity auth, responsive dashboard, form validation"
git push origin main
```

#### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click "New site from Git"
4. Select your repository
5. Accept build settings (should auto-detect from `netlify.toml`)
6. Deploy

#### Step 3: Enable Netlify Identity
1. In Netlify dashboard, go to Site Settings → Identity
2. Click "Enable Identity"
3. Configure email provider:
   - Option A: Use Netlify's built-in (default, works immediately)
   - Option B: Configure custom email service (SMTP, SendGrid, etc.)

#### Step 4: Configure Email Confirmation
In Netlify Dashboard → Identity → Settings:
- **Auto Confirm**: Enable if you want users to login immediately without email (testing)
- **Email Confirmation**: Require if you want users to confirm email first (production)

#### Step 5: Test Production
1. Visit your deployed site
2. Create account
3. If email confirmation enabled: check email, click link, then login
4. If auto-confirm enabled: login immediately
5. Verify dashboard loads and shows account data

### Production Checklist
- [ ] Logo placed at `frontend/public/logo.png`
- [ ] Git repository connected to Netlify
- [ ] Netlify Identity enabled
- [ ] Email confirmation configured
- [ ] Test signup flow (email received, confirmation works)
- [ ] Test login flow
- [ ] Test dashboard rendering
- [ ] Test responsive design on mobile
- [ ] Test logout flow

---

## Important Design Decisions

### 1. Backend: Netlify Identity vs Custom Server
**Decision**: Use Netlify Identity (GoTrue SDK)
- **Why**: Eliminates need to host/manage a backend server
- **Benefits**: 
  - Admin manages users via Netlify dashboard (no code required)
  - Authentication fully managed by Netlify
  - Scales automatically
  - Email built-in
  - Cost-effective (free tier included with Netlify hosting)
- **Trade-off**: Less control over custom auth logic (but not needed for this project)

### 2. State Management: Zustand
**Decision**: Use Zustand (lightweight Zustand library)
- **Why**: Simpler than Redux, smaller bundle size
- **Benefits**:
  - Easy to learn
  - Minimal boilerplate
  - Perfect for auth state
  - No context wrapper required
- **Alternative Considered**: Context API (adequate but more boilerplate)

### 3. Styling: Tailwind CSS
**Decision**: Use Tailwind CSS utility classes
- **Why**: Rapid development, consistent design system
- **Benefits**:
  - No CSS files to manage
  - Responsive design made simple (sm:, md:, lg: breakpoints)
  - Consistent spacing/colors
  - Easy to update (edit JSX)
- **Alternative Considered**: CSS Modules (more complex, overkill for this project)

### 4. Form Management: React Hook Form
**Decision**: Use React Hook Form with `useForm` hook
- **Why**: Performant, minimal re-renders, built-in validation
- **Benefits**:
  - No external component library needed
  - Field-level validation
  - Easy error handling
  - Works with Tailwind
- **Alternative Considered**: Formik (works but heavier)

### 5. Routing: React Router v6
**Decision**: Use React Router v6
- **Why**: Industry standard, client-side routing on Netlify
- **Features**:
  - Simple page routing (signin, signup, dashboard)
  - Protected routes (require auth)
  - URL-based state (confirmation token in hash)
- **SPA Redirect**: Netlify.toml redirects all routes to `index.html` for client-side routing

### 6. Data Storage: GoTrue User Metadata
**Decision**: Store all custom user data in GoTrue's `user_metadata` JSON field
- **Why**: Eliminates need for separate database
- **Benefits**:
  - Admin can view/edit in Netlify dashboard
  - No database setup required
  - Scales with Netlify's infrastructure
- **Structure**:
  ```json
  user_metadata: {
    full_name, first_name, last_name,
    phone, gender, date_of_birth,
    affiliated_authorities, postal_code,
    escrow_account: { account_id, account_status, escrow_deposit_amount, duration_days, personal_item }
  }
  ```

### 7. UI Design: Dark Dashboard + Light Auth
**Decision**: Dark gradient dashboard, light grey auth pages
- **Why**: Matches modern SaaS design; dark for extended viewing, light for quick signin
- **Color Scheme**:
  - Auth pages: Light grey background (bg-gray-100), white card, purple accents
  - Dashboard: Dark gradient (teal/blue), purple highlights
  - Status colors: Green (success), Yellow (pending), Red (error)

### 8. Responsive Design: Mobile-First
**Decision**: Design for mobile first, enhance for larger screens
- **Breakpoints Used**:
  - Mobile: `<640px` (no prefix, e.g., `flex`)
  - Tablet: `≥640px` (`sm:` prefix, e.g., `sm:flex`)
  - Medium: `≥768px` (`md:` prefix)
  - Large: `≥1024px` (`lg:` prefix)
- **Benefits**: Works on all devices, no zooming needed
- **Examples**: Sidebar hidden on mobile (`hidden md:flex`), grid adjusts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

### 9. Account ID Generation: Client-Side Random
**Decision**: Generate unique account IDs on client (format: ISEA-XXXX-XXXX)
- **Why**: Simple, no server logic needed
- **Risk**: Collision possible but extremely unlikely (36^8 combinations)
- **Future**: If needed, could validate against backend or use UUID library

### 10. Email Confirmation Flow
**Decision**: Require email confirmation before first login (Netlify default)
- **Why**: Prevents account takeover, verifies valid email
- **Admin Override**: Can disable in Netlify dashboard for testing
- **User Experience**:
  1. Signup → "Check your email" message
  2. User clicks link in email
  3. Email verified → Can login

---

## Troubleshooting

### "Cannot find module 'ajv/dist/compile/codegen'"
**Solution**: Run `npm install ajv@^8 --legacy-peer-deps`

### "GoTrue-js: Failed to parse tokenResponse claims"
**Cause**: User email not confirmed yet
**Solution**: 
- Option A: Disable email confirmation in Netlify (Settings → Identity → Email Confirmation → OFF)
- Option B: Check email, click confirmation link, then try login again

### "Can't resolve '@stores/authStore'"
**Cause**: Path aliases don't work with react-scripts
**Solution**: Use relative imports `../stores/authStore` instead of `@stores/authStore`

### Netlify Identity endpoint not working
**Cause**: Not running with `netlify dev`
**Solution**: Use `netlify dev` instead of `npm start` for local development with Identity

### Logo not showing
**Cause**: File not at `frontend/public/logo.png`
**Solution**: Place logo file and rebuild (should appear, or fallback brand shows)

### Styles not applied (page looks unstyled)
**Cause**: Missing `postcss.config.js` or `tailwind.config.js`
**Solution**: Ensure both files exist in `frontend/` root directory

---

## Summary

ISEA is a **serverless, full-stack authentication and account management platform** built with:
- **React** frontend (responsive, mobile-first)
- **Netlify Identity** backend (no server code)
- **Zustand** for state
- **Tailwind CSS** for styling

The entire project is deployable in minutes with zero backend maintenance. Admin manages users via Netlify's visual dashboard. Users can create accounts, verify email, and access a professional dashboard with account details and verification tracking.

**Next Steps After Deployment**:
1. Monitor user signups via Netlify Identity dashboard
2. Review verification status and mark users as compliant
3. Extend dashboard with transaction history (future feature)
4. Integrate with payment processor for deposits (future feature)
5. Add compliance reporting tools (future feature)
