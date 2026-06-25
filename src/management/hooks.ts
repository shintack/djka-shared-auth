'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ManagementApiClient } from './api';
import type { ManagementUser, ManagementRole, Permission, PaginatedResponse } from './types';

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
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const params: Record<string, string | number> = { per_page: perPage, page };
      if (search) params.search = search;
      if (idRole) params.id_role = idRole;
      if (status) params.status = Number(status);

      const [usersRes, rolesRes] = await Promise.all([
        api.user.list(params),
        api.role.list({ per_page: 100 }),
      ]);

      const usersData = (usersRes.data as Record<string, unknown>).data as PaginatedResponse<ManagementUser> | undefined;
      const rolesData = (rolesRes.data as Record<string, unknown>).data as { data?: { id: number; role: string; kode_role: string }[] } | undefined;

      setUsers(usersData?.data || []);
      setPagination({
        current_page: usersData?.current_page || 1,
        last_page: usersData?.last_page || 1,
        per_page: usersData?.per_page || perPage,
        total: usersData?.total || 0,
      });
      setRoles(rolesData?.data || []);
    } catch (error) {
      console.error('Failed to fetch management data:', error);
    } finally {
      setLoading(false);
    }
  }, [api, page, perPage, search, idRole, status]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
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
        api.role.list({ per_page: 100 }),
        api.permission.list({ per_page: 200 }),
      ]);

      const rolesData = (rolesRes.data as Record<string, unknown>).data as { data?: ManagementRole[] } | undefined;
      const permsData = (permsRes.data as Record<string, unknown>).data as { data?: Permission[] } | undefined;

      setRoles(rolesData?.data || []);
      setPermissions(permsData?.data || []);
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

      const res = await api.role.listUsers(roleId, params);
      const data = (res.data as Record<string, unknown>).data as PaginatedResponse<ManagementUser> | undefined;

      setUsers(data?.data || []);
      setPagination({
        current_page: data?.current_page || 1,
        last_page: data?.last_page || 1,
        per_page: data?.per_page || perPage,
        total: data?.total || 0,
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
