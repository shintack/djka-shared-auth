'use client';

import { type ReactNode } from 'react';
import { useAuth } from '../AuthContext';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}

interface RoleGuardProps {
  role: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { hasRole } = useAuth();
  if (!hasRole(role)) return <>{fallback}</>;
  return <>{children}</>;
}

interface AnyPermissionGuardProps {
  permissions: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyPermissionGuard({ permissions, children, fallback = null }: AnyPermissionGuardProps) {
  const { hasAnyPermission } = useAuth();
  if (!hasAnyPermission(permissions)) return <>{fallback}</>;
  return <>{children}</>;
}

interface AnyRoleGuardProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function AnyRoleGuard({ roles, children, fallback = null }: AnyRoleGuardProps) {
  const { hasAnyRole } = useAuth();
  if (!hasAnyRole(roles)) return <>{fallback}</>;
  return <>{children}</>;
}
