# Dashboard Development - User Data Integration Guide

This guide explains how the dashboard will access and display user information and profile pictures from the authentication system.

## Overview

The authentication system stores all user data and handles profile picture uploads. The dashboard can access this data through:
1. **Zustand Auth Store** (frontend state management)
2. **REST API** (`/api/auth/me` endpoint)
3. **Local Storage** (for tokens and quick access)

---

## Accessing User Data

### Method 1: Using Zustand Store (Recommended for React)

```tsx
import { useAuthStore } from '@stores/authStore';

export function UserProfile() {
  const { user, escrowAccount, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <img 
        src={user?.profile_picture_url} 
        alt="Profile" 
        className="w-20 h-20 rounded-full"
      />
      <h1>{user?.first_name} {user?.last_name}</h1>
      <p>{user?.email}</p>
      <p>Account: {escrowAccount?.account_id}</p>
    </div>
  );
}
```

### Method 2: Using API Directly

```typescript
import apiClient, { authService } from '@services/apiClient';

async function loadUserData() {
  try {
    const response = await authService.getCurrentUser();
    const { user, escrowAccount } = response;
    
    console.log(user.first_name, user.last_name);
    console.log(user.profile_picture_url);
    console.log(escrowAccount.account_id);
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}
```

### Method 3: Using Raw Fetch

```typescript
async function getCurrentUser(accessToken: string) {
  const response = await fetch('http://localhost:5000/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}
```

---

## Available User Data

The `/api/auth/me` endpoint returns:

```typescript
interface UserData {
  user: {
    id: string;                        // UUID
    email: string;                     // user@example.com
    username?: string;                 // optional
    first_name: string;                // John
    last_name: string;                 // Doe
    phone?: string;                    // +1 (555) 000-0000
    gender?: string;                   // male, female, other
    date_of_birth?: string;            // YYYY-MM-DD format
    profile_picture_url?: string;      // https://s3.amazonaws.com/...
    affiliated_authorities?: string;   // Government Agency
    postal_code?: string;              // 12345
  };
  escrowAccount: {
    id: string;                        // UUID
    account_id: string;                // ISEA-A1B2-C3D4
    account_status: string;            // pending, identity_submitted, etc.
    escrow_deposit_amount?: number;    // 1000.00
    duration_days?: number;            // 30
    status: string;                    // pending, active, completed
  };
}
```

---

## Working with Profile Pictures

### Display Profile Picture

```tsx
// Simple display
<img 
  src={user.profile_picture_url} 
  alt={`${user.first_name} ${user.last_name}`}
  onError={(e) => e.currentTarget.src = '/default-avatar.png'} // Fallback
/>

// With fallback component
function ProfilePicture({ user }: { user: User }) {
  return (
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center overflow-hidden">
      {user.profile_picture_url ? (
        <img 
          src={user.profile_picture_url} 
          alt="Profile"
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-2xl font-bold text-white">
          {user.first_name[0]}{user.last_name[0]}
        </span>
      )}
    </div>
  );
}
```

### Picture Properties

- **Format**: WebP (optimized automatically)
- **Size**: 300x300 pixels (square, center-cropped)
- **Access**: Direct HTTPS CDN URL (public-read on S3)
- **Max Size**: 5MB (validated on upload)
- **Cache**: 1-day browser cache

---

## Example Dashboard Card

```tsx
export function AccountOverviewCard() {
  const { user, escrowAccount, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Account Overview</h2>
      
      <div className="flex items-start gap-4 mb-6">
        {/* Profile Picture */}
        <img
          src={user?.profile_picture_url}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
        
        {/* User Info */}
        <div>
          <h3 className="text-lg font-semibold">
            {user?.first_name} {user?.last_name}
          </h3>
          <p className="text-gray-600">{user?.email}</p>
          {user?.phone && (
            <p className="text-gray-500 text-sm">{user.phone}</p>
          )}
        </div>
      </div>

      {/* Account Status */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-600">Account ID</p>
          <p className="font-mono text-sm">{escrowAccount?.account_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Status</p>
          <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            {escrowAccount?.account_status}
          </span>
        </div>
      </div>

      {/* Additional Info */}
      {user?.date_of_birth && (
        <div className="pt-4 border-t mt-4">
          <p className="text-sm text-gray-600">Date of Birth</p>
          <p>{new Date(user.date_of_birth).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Authentication & Session Management

### Access Token Management

```typescript
// Access token automatically stored in localStorage
const accessToken = localStorage.getItem('accessToken');

// Tokens are automatically refreshed by the API client
// When access token expires, refresh token is used automatically

// For manual refresh:
const response = await authService.refreshToken(refreshToken);
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

### Checking Authentication Status

```typescript
export function useProtectedRoute() {
  const { isAuthenticated, getCurrentUser } = useAuthStore();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      navigate('/signin');
      return;
    }

    getCurrentUser().then(() => setIsReady(true));
  }, []);

  return isReady;
}
```

---

## Data Update Patterns

### Refresh User Data

```typescript
async function refreshUserData() {
  const { getCurrentUser } = useAuthStore();
  try {
    await getCurrentUser();
    console.log('User data refreshed');
  } catch (error) {
    console.error('Failed to refresh:', error);
  }
}
```

### Update Profile

```typescript
async function updateUserProfile() {
  const { updateProfile } = useAuthStore();
  try {
    await updateProfile({
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '+1 (555) 111-1111',
    });
    console.log('Profile updated');
  } catch (error) {
    console.error('Update failed:', error);
  }
}
```

---

## Displaying Account Status

The escrow_account has multiple status fields:

```typescript
// account_status progression:
// 'pending' -> 'identity_submitted' -> 'compliance_review' -> 'activated'

function getStatusBadge(status: string) {
  const config: Record<string, { color: string; label: string }> = {
    'pending': { color: 'yellow', label: 'Pending' },
    'identity_submitted': { color: 'blue', label: 'Identity Submitted' },
    'compliance_review': { color: 'orange', label: 'Compliance Review' },
    'activated': { color: 'green', label: 'Activated' },
    'completed': { color: 'gray', label: 'Completed' },
  };

  const config_status = config[status] || config['pending'];
  return (
    <span className={`badge badge-${config_status.color}`}>
      {config_status.label}
    </span>
  );
}
```

---

## Common Dashboard Features

### User Profile Section
```tsx
- Display profile picture
- Show name, email, phone
- Show account ID
- Show verification status
- "Edit Profile" button (calls updateProfile)
```

### Account Overview Card
```tsx
- Account ID
- Account status
- Escrow deposit amount
- Duration
- Creation date
```

### Account Settings
```tsx
- View/edit profile information
- Change password (TODO: implement endpoint)
- View security logs (TODO: implement endpoint)
- Manage sessions (TODO: implement endpoint)
```

---

## API Error Handling

```typescript
async function loadUserWithErrorHandling() {
  const { user, error, setError, isLoading } = useAuthStore();

  useEffect(() => {
    loadUserData();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!user) return <EmptyState />;

  return <Dashboard user={user} />;
}
```

---

## Performance Tips

1. **Cache User Data**
   - Store in Zustand (already done)
   - Fetch only on first load or refresh
   - Don't re-fetch on every page navigation

2. **Use Profile Picture CDN**
   - Images are WebP and pre-optimized
   - Use standard `<img>` tag (browser cache handles it)
   - Set `loading="lazy"` for lists of users

3. **Lazy Load Screens**
   - Load dashboard data after route transition
   - Show skeleton screen while loading
   - Fetch only needed fields

4. **Handle Offline**
   - Check localStorage for user data
   - Fall back to cached data if API fails
   - Show sync status indicator

---

## Types for TypeScript

```typescript
// src/types/auth.ts
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  profile_picture_url?: string;
  affiliated_authorities?: string;
  postal_code?: string;
}

export interface EscrowAccount {
  id: string;
  account_id: string;
  account_status: 'pending' | 'identity_submitted' | 'compliance_review' | 'activated' | 'completed';
  status: string;
  escrow_deposit_amount?: number;
  duration_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  escrowAccount: EscrowAccount;
}
```

---

## Next Steps

1. ✅ Authentication system complete
2. 📋 Dashboard UI design (use data structures above)
3. 📊 Dashboard pages (Account Overview, Profile, Security, Transactions)
4. 🔄 Add password change endpoint (backend TODO)
5. 📝 Add user feedback/support system
6. 🔐 Add two-factor authentication (optional)
7. 📧 Add email verification workflow (optional)

---

## Support

For implementation questions:
- Check [DOCUMENTATION.md](../DOCUMENTATION.md) for API details
- Review Zustand store in [frontend/src/stores/authStore.ts](../frontend/src/stores/authStore.ts)
- Check example components: [SignupForm.tsx](../frontend/src/components/SignupForm.tsx)
