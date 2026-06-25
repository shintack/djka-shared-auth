import type { ManagementApiInstance } from './types';

export function createManagementApi(api: ManagementApiInstance) {
  return {
    user: {
      list: (params?: Record<string, string | number>) =>
        api.get('/v1/users', { params }),

      get: (id: string | number) =>
        api.get(`/v1/users/${id}`),

      create: (data: unknown) =>
        api.post('/v1/users', data),

      update: (id: string | number, data: unknown) =>
        api.put(`/v1/users/${id}`, data),

      remove: (id: string | number) =>
        api.delete(`/v1/users/${id}`),

      updateStatus: (id: string | number, status: number | string) =>
        api.patch(`/v1/users/${id}/status`, { status }),
    },

    role: {
      list: (params?: Record<string, string | number>) =>
        api.get('/v1/roles', { params }),

      get: (id: string | number) =>
        api.get(`/v1/roles/${id}`),

      create: (data: unknown) =>
        api.post('/v1/roles', data),

      update: (id: string | number, data: unknown) =>
        api.put(`/v1/roles/${id}`, data),

      remove: (id: string | number) =>
        api.delete(`/v1/roles/${id}`),

      listUsers: (id: string | number, params?: Record<string, string | number>) =>
        api.get(`/v1/roles/${id}/users`, { params }),

      addUser: (roleId: string | number, userId: number) =>
        api.post(`/v1/roles/${roleId}/users`, { user_id: userId }),

      removeUser: (roleId: string | number, userId: number) =>
        api.delete(`/v1/roles/${roleId}/users/${userId}`),

      syncPermissions: (roleId: string | number, data: { permission_ids: number[] }) =>
        api.post(`/v1/roles/${roleId}/permissions`, data),
    },

    permission: {
      list: (params?: Record<string, string | number>) =>
        api.get('/v1/permissions', { params }),
    },
  };
}

export type ManagementApiClient = ReturnType<typeof createManagementApi>;
