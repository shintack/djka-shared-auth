# @djka/shared-auth

Shared authentication package for DJKA frontend applications.

## Installation

```bash
npm install @djka/shared-auth
```

## Setup

### 1. Configure API client

Initialize the API client early in your app (e.g., in root layout or a setup file):

```ts
import { createApi, setBasePath } from '@djka/shared-auth';

createApi({
  baseUrl: process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8080',
  publicPaths: ['/', '/login'],
});
```

### 2. Wrap app with AuthProvider

```tsx
import { AuthProvider } from '@djka/shared-auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider loginPath="/login" dashboardPath="/dashboard">
      {children}
    </AuthProvider>
  );
}
```

### 3. Use auth features

```tsx
import { useAuth, ProtectedRoute, GuestRoute, PermissionGuard } from '@djka/shared-auth';

// Get user/auth state
const { user, login, logout, hasPermission, hasRole } = useAuth();

// Protect routes
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Guest-only routes (redirects to dashboard if already logged in)
<GuestRoute>
  <LoginPage />
</GuestRoute>

// Permission-based rendering
<PermissionGuard permission="users.create">
  <CreateUserButton />
</PermissionGuard>
```

## Next.js Configuration

If consuming via TypeScript source (recommended), add to `next.config.ts`:

```ts
const nextConfig = {
  transpilePackages: ['@djka/shared-auth'],
};
```

If consuming via compiled output, no additional config is needed.

## Development

```bash
npm run build    # Compile TypeScript
npm run lint     # Type-check without emitting
```

## API

| Export | Description |
|--------|-------------|
| `createApi(config)` | Initialize Axios instance with base URL, token handling, and 401 redirect |
| `getApi()` | Get the configured Axios instance |
| `AuthProvider` | React context provider for auth state |
| `useAuth()` | Hook returning `{ user, loading, login, logout, loginSso, isAuthenticated, hasPermission, hasRole, ... }` |
| `ProtectedRoute` | Route guard that redirects unauthenticated users to login |
| `GuestRoute` | Route guard that redirects authenticated users to dashboard |
| `PermissionGuard` | Renders children only if user has a specific permission |
| `RoleGuard` | Renders children only if user has a specific role |
| `AnyPermissionGuard` | Renders children if user has any of the specified permissions |
| `AnyRoleGuard` | Renders children if user has any of the specified roles |
| `withBasePath` | Prepends base path for sub-path deployments |
| `stripBasePath` | Removes base path from a URL |
| `getToken` | Get JWT token from localStorage |
| `setToken` | Store JWT token in localStorage |
| `removeToken` | Remove JWT token from localStorage |
