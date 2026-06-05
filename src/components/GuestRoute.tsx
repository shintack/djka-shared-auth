'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';

interface GuestRouteProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function GuestRoute({
  children,
  loadingFallback,
}: GuestRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      loadingFallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      )
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
