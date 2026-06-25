export interface ManagementUser {
  id: number;
  nip: string | null;
  nik: string | null;
  nama: string;
  email: string;
  telp: string | null;
  role: { id: number; role: string; kode_role: string } | null;
  id_role: number | null;
  status: number | null;
  foto: string | null;
  created_at: string | null;
}

export interface ManagementRole {
  id: number;
  role: string;
  kode_role: string;
  description: string | null;
  permissions: { id: number; name: string; label: string; group: string }[];
  users_count: number;
}

export interface Permission {
  id: number;
  name: string;
  label: string;
  group: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_page: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export type ManagementApiInstance = {
  get: (url: string, config?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
  post: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
  put: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
  delete: (url: string, config?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
  patch: (url: string, data?: unknown, config?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
};
