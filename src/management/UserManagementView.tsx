'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Plus, Search, Pencil, Trash2, Power, PowerOff, X, Users,
  Loader2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { createManagementApi } from './api';
import type { ManagementApiInstance } from './types';
import { useManagementUsers } from './hooks';
import type { ManagementUser } from './types';

const STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Nonaktif', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  1: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  2: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const PER_PAGE_OPTIONS = [10, 25, 50];

const inputCls = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const btnPrimary = 'inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50';
const btnGhost = 'inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors disabled:opacity-50';
const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
const modalBox = 'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto';
const modalHeader = 'sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10';

interface Props {
  api: ManagementApiInstance;
  permission?: string;
  currentUserId?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function UserManagementView({
  api, permission = 'admin.user_management', currentUserId,
  title = 'Manajemen User', subtitle = 'Kelola data pengguna dan akses sistem',
  className,
}: Props) {
  const mgmtApi = useMemo(() => createManagementApi(api), [api]);
  const { user: currentUser, hasPermission } = useAuth();
  const myId = currentUserId ?? currentUser?.id;
  const canEdit = hasPermission(permission);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const searchRef = useRef<HTMLInputElement>(null);

  const { users, roles, pagination, loading, refetch } = useManagementUsers({
    api: mgmtApi, page, perPage, search, idRole: roleFilter, status: statusFilter,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<ManagementUser | null>(null);
  const [editUser, setEditUser] = useState<ManagementUser | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const emptyForm = { nip: '', nik: '', nama: '', email: '', password: '', id_role: '', telp: '', status: 2 };
  const [form, setForm] = useState(emptyForm);
  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (u: ManagementUser) => {
    setEditUser(u);
    setForm({ nip: u.nip || '', nik: u.nik || '', nama: u.nama, email: u.email, password: '', id_role: u.role?.id?.toString() || '', telp: u.telp || '', status: u.status ?? 2 });
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(-1);
    try {
      if (editUser) {
        await mgmtApi.user.update(editUser.id, { nip: form.nip, nik: form.nik, nama: form.nama, email: form.email, id_role: form.id_role, telp: form.telp, status: form.status });
        toast.success('User berhasil diperbarui.');
      } else {
        await mgmtApi.user.create(form);
        toast.success('User berhasil ditambahkan.');
      }
      setFormOpen(false); setEditUser(null); setForm(emptyForm); refetch();
    } catch { toast.error('Gagal menyimpan user.'); }
    finally { setBusy(null); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setBusy(deleteId);
    try { await mgmtApi.user.remove(deleteId); toast.success('User dihapus.'); setDeleteId(null); refetch(); }
    catch { toast.error('Gagal menghapus user.'); setDeleteId(null); }
    finally { setBusy(null); }
  };

  const toggleStatus = async (u: ManagementUser) => {
    setBusy(u.id);
    try { await mgmtApi.user.updateStatus(u.id, u.status === 2 ? 0 : 2); refetch(); }
    catch { toast.error('Gagal mengubah status.'); }
    finally { setBusy(null); }
  };

  const onSearchKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { setPage(1); } };
  const resetFilters = () => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setPage(1); };
  const hasFilters = search || roleFilter || statusFilter;

  const activeCount = users.filter((u) => u.status === 2).length;
  const pendingCount = users.filter((u) => u.status === 1).length;

  return (
    <div className={`p-4 sm:p-6 space-y-4 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        {canEdit && (
          <button onClick={openAdd} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Tambah User
          </button>
        )}
      </div>

      {/* Stats pills */}
      {!loading && pagination.total > 0 && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">
            {pagination.total} total
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
            {activeCount} aktif
          </span>
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input ref={searchRef} type="text" placeholder="Cari nama, email, NIP..." value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearchKey}
            className={`${inputCls} pl-10`} />
        </div>
        <div className="flex gap-2">
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className={`${inputCls} sm:w-48`}>
            <option value="">Semua Role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.role}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`${inputCls} sm:w-40`}>
            <option value="">Semua Status</option>
            <option value="2">Aktif</option>
            <option value="1">Pending</option>
            <option value="0">Nonaktif</option>
          </select>
          {hasFilters && (
            <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap px-2 flex-shrink-0">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-10 w-10 mb-2" />
            <p className="font-medium">Tidak ada data user</p>
            <p className="text-sm">{hasFilters ? 'Coba ubah filter' : 'Klik "Tambah User" untuk menambahkan'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800/60 divide-y divide-gray-100 dark:divide-gray-700/50">
                  {users.map((u) => {
                    const s = STATUS[u.status as keyof typeof STATUS] || STATUS[0];
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">{u.nama.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                              {u.nip && <p className="text-xs text-gray-400 dark:text-gray-500 sm:hidden">NIP: {u.nip}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.role ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                              {u.role.role}
                            </span>
                          ) : <span className="text-xs text-gray-400">-</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setDetailUser(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Detail">
                              <Eye className="h-4 w-4" />
                            </button>
                            {canEdit && (
                              <>
                                <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" title="Edit">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button onClick={() => toggleStatus(u)} disabled={busy === u.id} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-40" title={u.status === 2 ? 'Nonaktifkan' : 'Aktifkan'}>
                                  {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.status === 2 ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </button>
                                {u.id !== myId && (
                                  <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Hapus">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <span>Menampilkan {pagination.total > 0 ? `${(page - 1) * perPage + 1}–${Math.min(page * perPage, pagination.total)}` : 0} dari {pagination.total}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Per halaman:</span>
                  <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    className="border border-gray-300 dark:border-gray-600 rounded-md text-sm px-2 py-1 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    {PER_PAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(page - 1)} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pagination.last_page - 4));
                  const p = start + i;
                  if (p > pagination.last_page) return null;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      {p}
                    </button>
                  );
                })}

                <button onClick={() => setPage(page + 1)} disabled={page === pagination.last_page}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(pagination.last_page)} disabled={page === pagination.last_page}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}>
          <div className={modalBox}>
            <div className={modalHeader}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editUser ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nama <span className="text-red-500">*</span></label>
                <input type="text" required value={form.nama} onChange={(e) => set('nama', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
              </div>
              {!editUser && (
                <div>
                  <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                  <input type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} className={inputCls} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role <span className="text-red-500">*</span></label>
                  <select required value={form.id_role} onChange={(e) => set('id_role', e.target.value)} className={inputCls}>
                    <option value="">Pilih</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.role}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={(e) => set('status', Number(e.target.value))} className={inputCls}>
                    <option value={2}>Aktif</option>
                    <option value={1}>Pending</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
              </div>
              <details className="group">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300">
                  Data tambahan (opsional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>NIP</label>
                      <input type="text" value={form.nip} onChange={(e) => set('nip', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>NIK</label>
                      <input type="text" value={form.nik} onChange={(e) => set('nik', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Telepon</label>
                    <input type="text" value={form.telp} onChange={(e) => set('telp', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </details>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setFormOpen(false)} className={btnGhost}>Batal</button>
                <button type="submit" disabled={busy === -1} className={btnPrimary}>
                  {busy === -1 && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editUser ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailUser && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDetailUser(null)}>
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail User</h2>
              <button onClick={() => setDetailUser(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-300">{detailUser.nama.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{detailUser.nama}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{detailUser.role?.role || 'Tanpa Role'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
              {[['Email', detailUser.email], ['NIP', detailUser.nip], ['NIK', detailUser.nik], ['Telepon', detailUser.telp], ['Status', STATUS[detailUser.status as keyof typeof STATUS]?.label]]
                .filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">{k}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus User?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className={btnGhost} disabled={busy === deleteId}>Batal</button>
              <button onClick={handleDelete} disabled={busy === deleteId} className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50">
                {busy === deleteId && <Loader2 className="h-4 w-4 animate-spin" />} Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
