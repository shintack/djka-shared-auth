'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Search, Pencil, Trash2, UserPlus, Shield, Users,
  Loader2, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { createManagementApi } from './api';
import type { ManagementApiInstance } from './types';
import type { ManagementUser, AppRoleAssignment, UserAppRolesResponse } from './types';

const APP_NAMES = ['akreditasi', 'crossing', 'lintas'] as const;
type AppName = (typeof APP_NAMES)[number];

const APP_LABELS: Record<AppName, string> = {
  akreditasi: 'Akreditasi',
  crossing: 'Crossing',
  lintas: 'Lintas',
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const btnPrimary = 'inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50';
const btnGhost = 'inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors disabled:opacity-50';
const btnDanger = 'inline-flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50';
const badgeBase = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
const badges: Record<string, string> = {
  primary: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
const modalBox = 'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto';

interface Props {
  api: ManagementApiInstance;
  permission?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Allowed app names. Defaults to all three. */
  apps?: readonly AppName[];
}

export function UserAppRolesView({
  api,
  permission = 'admin.user_management',
  title = 'User App Roles',
  subtitle = 'Kelola role per aplikasi untuk setiap pengguna',
  className,
  apps = APP_NAMES,
}: Props) {
  const mgmtApi = useMemo(() => createManagementApi(api), [api]);

  // ── User list state ──
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [roles, setRoles] = useState<{ id: number; role: string; kode_role: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 10;

  // ── Selected user state ──
  const [selectedUser, setSelectedUser] = useState<ManagementUser | null>(null);
  const [appRoles, setAppRoles] = useState<UserAppRolesResponse | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ── Modal state ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingApp, setEditingApp] = useState<AppName | null>(null);
  const [assignAppName, setAssignAppName] = useState<AppName>('akreditasi');
  const [assignRoleId, setAssignRoleId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [deletingApp, setDeletingApp] = useState<string | null>(null);

  // ── Fetch user list ──
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params: Record<string, string | number> = { per_page: LIMIT, page };
      if (search) params.search = search;
      const res = await mgmtApi.user.list(params);
      const body = res.data as Record<string, unknown>;
      const list = (body.data as ManagementUser[]) || [];
      const meta = (body.meta as { page: number; total_page: number; total: number }) || { page: 1, total_page: 1, total: 0 };
      setUsers(list);
      setTotalPages(meta.total_page || 1);
      setTotal(meta.total || 0);
    } catch {
      toast.error('Gagal memuat data pengguna');
    } finally {
      setLoadingUsers(false);
    }
  }, [mgmtApi, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Fetch roles dropdown ──
  useEffect(() => {
    mgmtApi.role.list({ per_page: 100 }).then((res) => {
      const body = res.data as Record<string, unknown>;
      setRoles((body.data as { id: number; role: string; kode_role: string }[]) || []);
    }).catch(() => {});
  }, [mgmtApi]);

  // ── Fetch app roles for selected user ──
  const fetchAppRoles = useCallback(async (userId: number) => {
    setLoadingRoles(true);
    try {
      const res = await mgmtApi.appRole.listUserAppRoles(userId);
      const body = res.data as Record<string, unknown>;
      setAppRoles(body as unknown as UserAppRolesResponse);
    } catch {
      toast.error('Gagal memuat app-role assignments');
    } finally {
      setLoadingRoles(false);
    }
  }, [mgmtApi]);

  useEffect(() => {
    if (selectedUser?.id) fetchAppRoles(selectedUser.id);
  }, [selectedUser?.id, fetchAppRoles]);

  // ── Handlers ──
  function handleSelectUser(user: ManagementUser) {
    setSelectedUser(user);
  }

  function handleBackToList() {
    setSelectedUser(null);
    setAppRoles(null);
  }

  function openAddModal() {
    const assignedApps = new Set(appRoles?.app_roles.map((ar) => ar.app_name) ?? []);
    const firstUnassigned = apps.find((a) => !assignedApps.has(a)) ?? apps[0];
    setEditingApp(null);
    setAssignAppName(firstUnassigned);
    setAssignRoleId('');
    setShowAssignModal(true);
  }

  function openEditModal(ar: AppRoleAssignment) {
    setEditingApp(ar.app_name as AppName);
    setAssignAppName(ar.app_name as AppName);
    setAssignRoleId(ar.role_id);
    setShowAssignModal(true);
  }

  async function handleAssign() {
    if (!selectedUser?.id || !assignRoleId) return;
    setSaving(true);
    try {
      await mgmtApi.appRole.upsert(selectedUser.id, assignAppName, Number(assignRoleId));
      toast.success(`Role untuk ${APP_LABELS[assignAppName]} berhasil disimpan.`);
      setShowAssignModal(false);
      setEditingApp(null);
      fetchAppRoles(selectedUser.id);
    } catch {
      toast.error('Gagal menyimpan app-role');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(appName: string) {
    if (!selectedUser?.id) return;
    setDeletingApp(appName);
    try {
      await mgmtApi.appRole.remove(selectedUser.id, appName);
      toast.success(`App-role untuk ${APP_LABELS[appName as AppName]} berhasil dihapus.`);
      fetchAppRoles(selectedUser.id);
    } catch {
      toast.error('Gagal menghapus app-role');
    } finally {
      setDeletingApp(null);
    }
  }

  // ── Derived ──
  const assignedApps = new Set(appRoles?.app_roles.map((ar) => ar.app_name) ?? []);
  const availableApps = apps.filter((a) => !assignedApps.has(a));
  const canAdd = availableApps.length > 0 || (appRoles?.app_roles.length ?? 0) < apps.length;

  return (
    <div className={className}>
      {selectedUser ? (
        /* ── Detail view ── */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Kembali"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedUser.nama}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedUser.email}
                {selectedUser.nip ? ` · NIP ${selectedUser.nip}` : ''}
              </p>
            </div>
          </div>

          {/* Default role */}
          {appRoles?.default_role && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Default Role (Global)
              </p>
              <span className={`${badgeBase} ${badges.primary}`}>
                {appRoles.default_role.kode_role}
              </span>
              {appRoles.default_role.role_label && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {appRoles.default_role.role_label}
                </span>
              )}
            </div>
          )}

          {/* App roles */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">App-Specific Roles</h3>
              {canAdd && (
                <button type="button" onClick={openAddModal} className={btnPrimary}>
                  <UserPlus className="h-4 w-4" />
                  Tambah Role
                </button>
              )}
            </div>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data...
              </div>
            ) : !appRoles?.app_roles.length ? (
              <div className="p-12 text-center">
                <Shield className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Belum ada app-role assignments</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Klik &quot;Tambah Role&quot; untuk menetapkan role per aplikasi
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {appRoles.app_roles.map((ar) => (
                  <div
                    key={ar.app_name}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${badgeBase} ${badges.primary} min-w-[100px] justify-center`}>
                        {APP_LABELS[ar.app_name as AppName] ?? ar.app_name}
                      </span>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {ar.kode_role}
                        </span>
                        {ar.role_label && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            — {ar.role_label}
                          </span>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Diupdate: {new Date(ar.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(ar)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label={`Edit role ${ar.app_name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ar.app_name)}
                        disabled={deletingApp === ar.app_name}
                        className={`${btnDanger} disabled:opacity-50`}
                        aria-label={`Hapus role ${ar.app_name}`}
                      >
                        {deletingApp === ar.app_name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── User list ── */
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          {/* List */}
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Memuat data...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {user.nama?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{user.nama}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                        {user.nip ? ` · NIP ${user.nip}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role?.kode_role && (
                      <span className={`${badgeBase} ${badges.neutral}`}>
                        {user.role.kode_role}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Halaman {page} dari {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Assign / Edit Modal ── */}
      {showAssignModal && (
        <div
          className={modalOverlay}
          onClick={(e) => { if (e.target === e.currentTarget && !saving) setShowAssignModal(false); }}
          role="dialog"
          aria-modal="true"
        >
          <div className={modalBox}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingApp ? 'Edit' : 'Tambah'} App Role
              </h3>
              <button
                type="button"
                onClick={() => !saving && setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="app-name" className={labelCls}>Aplikasi</label>
                <select
                  id="app-name"
                  value={assignAppName}
                  onChange={(e) => setAssignAppName(e.target.value as AppName)}
                  disabled={saving || editingApp !== null}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  {apps.map((a) => (
                    <option key={a} value={a} disabled={assignedApps.has(a) && a !== assignAppName}>
                      {APP_LABELS[a]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="role-select" className={labelCls}>Role</label>
                <select
                  id="role-select"
                  value={assignRoleId}
                  onChange={(e) => setAssignRoleId(e.target.value ? Number(e.target.value) : '')}
                  disabled={saving}
                  className={`${inputCls} disabled:opacity-50`}
                >
                  <option value="">— Pilih Role —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.role} ({r.kode_role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !saving && setShowAssignModal(false)}
                disabled={saving}
                className={btnGhost}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={saving || !assignRoleId}
                className={btnPrimary}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
