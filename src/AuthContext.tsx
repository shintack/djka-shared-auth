'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getApi } from './api';
import { withBasePath } from './basePath';
import type { User, AuthContextType } from './types';
import { removeToken } from './token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  loginPath?: string;
  dashboardPath?: string;
}

export function AuthProvider({
  children,
  loginPath = '/login',
  dashboardPath = '/dashboard',
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await getApi().get('/v2/auth/me');
      const rawUser = data.data.user;
      setUser({
        ...rawUser,
        status: rawUser.status ? Number(rawUser.status) : null,
        role: rawUser.role
          ? { ...rawUser.role, id: Number(rawUser.role.id) }
          : null,
        permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : [],
      });
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    const { data } = await getApi().post('/v2/auth/login', { identifier, password });
    const rawUser = data.data.user;
    setUser({
      ...rawUser,
      status: rawUser.status ? Number(rawUser.status) : null,
      role: rawUser.role
        ? { ...rawUser.role, id: Number(rawUser.role.id) }
        : null,
      permissions: Array.isArray(rawUser.permissions) ? rawUser.permissions : [],
    });
    router.push(dashboardPath);
  };

  const loginSso = async () => {
    const { data } = await getApi().get('/v2/auth/sso-kemenhub');
    window.location.href = data.data.redirect_url;
  };

  const logout = async () => {
    try {
      await getApi().post('/v2/auth/logout');
    } catch (err) {
      console.error('Logout gagal:', err);
    }
    setUser(null);
    removeToken();
    window.location.href = withBasePath(loginPath);
  };

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!user) return false;
      return permissions.some((p) => user.permissions.includes(p));
    },
    [user],
  );

  const hasRole = useCallback(
    (roleCode: string): boolean => {
      if (!user || !user.role) return false;
      return user.role.kode_role === roleCode;
    },
    [user],
  );

  const hasAnyRole = useCallback(
    (roleCodes: string[]): boolean => {
      if (!user || !user.role) return false;
      return roleCodes.includes(user.role.kode_role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginSso,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        hasAnyPermission,
        hasRole,
        hasAnyRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
