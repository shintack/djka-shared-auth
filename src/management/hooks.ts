'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ManagementApiClient } from './api';
import type { ManagementUser, ManagementRole, Permission } from './types';

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 429 && retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

interface UseManagementUsersParams {
  api: ManagementApiClient;
  page?: number;
  perPage?: number;
  search?: string;
  idRole?: string;
  status?: string;
}

export function useManagementUsers({
  api,
  page = 1,
  perPage = 10,
  search = '',
  idRole = '',
  status = '',
}: UseManagementUsersParams) {
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [roles, setRoles] = useState<{ id: number; role: string; kode_role: string }[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: perPage, page };
      if (search) params.search = search;
      if (idRole) params.id_role = idRole;
      if (status) params.status = Number(status);

      const [usersRes, rolesRes] = await Promise.all([
        withRetry(() => api.user.list(params)),
        withRetry(() => api.role.list({ per_page: 100 })),
      ]);

      const usersBody = usersRes.data as Record<string, unknown>;
      const usersList = (usersBody.data as ManagementUser[]) || [];
      const usersMeta = (usersBody.meta as { page: number; limit: number; total: number; total_page: number }) || { page: 1, limit: perPage, total: 0, total_page: 1 };

      const rolesBody = rolesRes.data as Record<string, unknown>;
      const rolesList = (rolesBody.data as { id: number; role: string; kode_role: string }[]) || [];

      setUsers(usersList);
      setPagination({
        current_page: usersMeta.page || 1,
        last_page: usersMeta.total_page || 1,
        per_page: usersMeta.limit || perPage,
        total: usersMeta.total || 0,
      });
      setRoles(rolesList);
    } catch (error) {
      console.error('Failed to fetch management data:', error);
    } finally {
      setLoading(false);
    }
  }, [api, page, perPage, search, idRole, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { users, roles, pagination, loading, refetch: fetchData };
}

interface UseManagementRolesParams {
  api: ManagementApiClient;
}

export function useManagementRoles({ api }: UseManagementRolesParams) {
  const [roles, setRoles] = useState<ManagementRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        withRetry(() => api.role.list({ per_page: 100 })),
        withRetry(() => api.permission.list({ per_page: 200 })),
      ]);

      const rolesBody = rolesRes.data as Record<string, unknown>;
      const permsBody = permsRes.data as Record<string, unknown>;

      setRoles((rolesBody.data as ManagementRole[]) || []);
      setPermissions((permsBody.data as Permission[]) || []);
    } catch (error) {
      console.error('Failed to fetch roles data:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { roles, permissions, loading, refetch: fetchData };
}

interface UseManagementRoleUsersParams {
  api: ManagementApiClient;
  roleId: number | null;
  page?: number;
  perPage?: number;
  search?: string;
}

export function useManagementRoleUsers({
  api,
  roleId,
  page = 1,
  perPage = 10,
  search = '',
}: UseManagementRoleUsersParams) {
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (roleId === null) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: perPage, page };
      if (search) params.search = search;

      const res = await withRetry(() => api.role.listUsers(roleId, params));
      const body = res.data as Record<string, unknown>;
      const list = (body.data as ManagementUser[]) || [];
      const meta = (body.meta as { page: number; limit: number; total: number; total_page: number }) || { page: 1, limit: perPage, total: 0, total_page: 1 };

      setUsers(list);
      setPagination({
        current_page: meta.page || 1,
        last_page: meta.total_page || 1,
        per_page: meta.limit || perPage,
        total: meta.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch role users:', error);
      setUsers([]);
      setPagination({ current_page: 1, last_page: 1, per_page: perPage, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [api, roleId, page, perPage, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, pagination, loading, refetch: fetchUsers };
}
