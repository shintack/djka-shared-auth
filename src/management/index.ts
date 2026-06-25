export { createManagementApi, type ManagementApiClient } from './api';
export { useManagementUsers, useManagementRoles, useManagementRoleUsers } from './hooks';
export { UserManagementView } from './UserManagementView';
export { RoleManagementView } from './RoleManagementView';
export type {
  ManagementUser,
  ManagementRole,
  Permission,
  PaginationMeta,
  PaginatedResponse,
  ManagementApiInstance,
} from './types';
