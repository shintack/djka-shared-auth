export interface Role {
  id: number;
  role: string;
  kode_role: string;
  description: string | null;
}

export interface User {
  id: number;
  nip: string | null;
  nik: string | null;
  nama: string;
  email: string;
  foto: string | null;
  telp: string | null;
  jabatan_struktural: string | null;
  jabatan_fungsional: string | null;
  golongan: string | null;
  kode_unit: string | null;
  nama_unit: string | null;
  kode_kantor: string | null;
  nama_kantor: string | null;
  kode_subdirektorat: string | null;
  kode_seksi: string | null;
  status: number | null;
  kode_role: string | null;
  role: Role | null;
  permissions: string[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginSso: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  hasAnyRole: (roleCodes: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

export interface CreateApiConfig {
  baseUrl: string;
  publicPaths?: string[];
  tokenKey?: string;
}
