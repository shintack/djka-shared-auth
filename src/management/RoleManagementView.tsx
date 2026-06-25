'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, Shield, X, Loader2, KeyRound, Check,
  Search, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { createManagementApi } from './api';
import type { ManagementApiInstance } from './types';
import { useManagementRoles, useManagementRoleUsers } from './hooks';
import type { ManagementRole, Permission, ManagementUser } from './types';

const CARD_COLORS = [
  'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  'bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
  'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
];

const STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: 'Nonaktif', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  1: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  2: { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

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
  title?: string;
  subtitle?: string;
  className?: string;
}

export function RoleManagementView({
  api, permission = 'admin.role_management',
  title = 'Manajemen Role', subtitle = 'Kelola role dan hak akses pengguna',
  className,
}: Props) {
  const mgmtApi = useMemo(() => createManagementApi(api), [api]);
  const { roles, permissions, loading, refetch } = useManagementRoles({ api: mgmtApi });

  const [formOpen, setFormOpen] = useState(false);
  const [editRole, setEditRole] = useState<ManagementRole | null>(null);
  const [form, setForm] = useState({ role: '', kode_role: '', description: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const [permOpen, setPermOpen] = useState(false);
  const [permRole, setPermRole] = useState<ManagementRole | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [permSearch, setPermSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [usersOpen, setUsersOpen] = useState(false);
  const [usersRole, setUsersRole] = useState<ManagementRole | null>(null);
  const [userTab, setUserTab] = useState<'list' | 'add'>('list');
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [results, setResults] = useState<ManagementUser[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const { users: roleUsers, pagination: userPag, loading: usersLoading, refetch: refetchUsers } = useManagementRoleUsers({
    api: mgmtApi, roleId: usersRole?.id ?? null, page: userPage, search: userSearch,
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Form
  const openAdd = () => { setEditRole(null); setForm({ role: '', kode_role: '', description: '' }); setFormOpen(true); };
  const openEdit = (r: ManagementRole) => { setEditRole(r); setForm({ role: r.role, kode_role: r.kode_role, description: r.description || '' }); setFormOpen(true); };
  const handleForm = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(-1);
    try {
      if (editRole) { await mgmtApi.role.update(editRole.id, form); toast.success('Role diperbarui.'); }
      else { await mgmtApi.role.create(form); toast.success('Role ditambahkan.'); }
      setFormOpen(false); setEditRole(null); refetch();
    } catch { toast.error('Gagal menyimpan role.'); }
    finally { setBusy(null); }
  };

  // Delete
  const handleDelete = async () => {
    if (deleteId === null) return; setBusy(deleteId);
    try { await mgmtApi.role.remove(deleteId); toast.success('Role dihapus.'); setDeleteId(null); refetch(); }
    catch { toast.error('Gagal menghapus role.'); setDeleteId(null); }
    finally { setBusy(null); }
  };

  // Permissions
  const groupedPerms = useMemo(() => {
    const g: Record<string, Permission[]> = {};
    permissions.forEach((p) => { const k = p.group || 'Lainnya'; (g[k] ??= []).push(p); });
    return g;
  }, [permissions]);

  const filteredPerms = useMemo(() => {
    if (!permSearch) return groupedPerms;
    const q = permSearch.toLowerCase();
    return Object.fromEntries(
      Object.entries(groupedPerms).map(([g, ps]) => [g, ps.filter((p) => p.label.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))]).filter(([, ps]) => ps.length > 0)
    );
  }, [groupedPerms, permSearch]);

  const openPerms = (r: ManagementRole) => { setPermRole(r); setSelectedPerms(r.permissions?.map((p) => p.id) || []); setPermSearch(''); setExpanded({}); setPermOpen(true); };
  const togglePerm = (id: number) => setSelectedPerms((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleGroup = (g: string) => setExpanded((p) => ({ ...p, [g]: p[g] === false }));
  const selectAllGroup = (g: string, ps: Permission[]) => {
    const all = ps.every((p) => selectedPerms.includes(p.id));
    setSelectedPerms((prev) => all ? prev.filter((id) => !ps.some((p) => p.id === id)) : [...prev, ...ps.filter((p) => !prev.includes(p.id)).map((p) => p.id)]);
  };
  const savePerms = async () => {
    if (!permRole) return; setBusy(permRole.id);
    try { await mgmtApi.role.syncPermissions(permRole.id, { permission_ids: selectedPerms }); toast.success('Permissions disimpan.'); setPermOpen(false); refetch(); }
    catch { toast.error('Gagal menyimpan permissions.'); }
    finally { setBusy(null); }
  };

  // Users in role
  const openUsers = (r: ManagementRole) => { setUsersRole(r); setUserPage(1); setUserSearch(''); setUserTab('list'); setAddSearch(''); setResults([]); setUsersOpen(true); };
  const searchUsers = useCallback(async () => {
    if (!usersRole || !addSearch.trim()) return; setSearchBusy(true);
    try { const res = await mgmtApi.user.list({ search: addSearch, per_page: 20 }); const d = ((res.data as Record<string, unknown>).data as { data?: ManagementUser[] })?.data || []; setResults(d.filter((u) => u.id_role !== usersRole.id)); }
    catch { setResults([]); }
    finally { setSearchBusy(false); }
  }, [mgmtApi, addSearch, usersRole]);
  const addUser = async (userId: number) => {
    if (!usersRole) return; setAddingId(userId);
    try { await mgmtApi.role.addUser(usersRole.id, userId); setResults((p) => p.filter((u) => u.id !== userId)); refetchUsers(); toast.success('User ditambahkan ke role.'); }
    catch { toast.error('Gagal menambahkan user.'); }
    finally { setAddingId(null); }
  };
  const removeUser = async (userId: number) => {
    if (!usersRole) return; setRemovingId(userId);
    try { await mgmtApi.role.removeUser(usersRole.id, userId); refetchUsers(); toast.success('User dihapus dari role.'); }
    catch { toast.error('Gagal menghapus user.'); }
    finally { setRemovingId(null); }
  };

  if (loading && roles.length === 0) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className={`p-4 sm:p-6 space-y-4 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}><Plus className="h-4 w-4" /> Tambah Role</button>
      </div>

      {/* Role Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((r, i) => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${CARD_COLORS[i % CARD_COLORS.length]}`}>
                  <Shield className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{r.role}</h3>
                  <span className="text-xs text-gray-400 font-mono">{r.kode_role}</span>
                </div>
              </div>
              {r.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{r.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> {r.permissions?.length || 0}</span>
                <button onClick={() => openUsers(r)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <Users className="h-3.5 w-3.5" /> {r.users_count || 0} user
                </button>
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 flex items-center justify-end gap-1 bg-gray-50/50 dark:bg-gray-800/50">
              <button onClick={() => openPerms(r)} className="px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors flex items-center gap-1">
                <KeyRound className="h-3 w-3" /> Permissions
              </button>
              <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors" title="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Hapus">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && !loading && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <Shield className="h-10 w-10 mb-2" />
            <p className="font-medium">Belum ada role</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {formOpen && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}>
          <div className={modalBox}>
            <div className={modalHeader}>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editRole ? 'Edit Role' : 'Tambah Role'}</h2>
              <button onClick={() => setFormOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleForm} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Nama Role <span className="text-red-500">*</span></label>
                <input type="text" required value={form.role} onChange={(e) => set('role', e.target.value)} className={inputCls} placeholder="Contoh: Staff Verifikasi" />
              </div>
              <div>
                <label className={labelCls}>Kode Role <span className="text-red-500">*</span></label>
                <input type="text" required value={form.kode_role} onChange={(e) => set('kode_role', e.target.value)} className={inputCls} placeholder="Contoh: staff" />
              </div>
              <div>
                <label className={labelCls}>Deskripsi</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className={inputCls} rows={3} placeholder="Deskripsi role..." />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setFormOpen(false)} className={btnGhost}>Batal</button>
                <button type="submit" disabled={busy === -1} className={btnPrimary}>
                  {busy === -1 && <Loader2 className="h-4 w-4 animate-spin" />} {editRole ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Modal */}
      {permOpen && permRole && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setPermOpen(false)}>
          <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Permissions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{permRole.role} &mdash; {selectedPerms.length} dipilih</p>
              </div>
              <button onClick={() => setPermOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Cari permission..." value={permSearch} onChange={(e) => setPermSearch(e.target.value)} className={`${inputCls} pl-10`} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {(Object.entries(filteredPerms) as [string, Permission[]][]).map(([group, perms]) => {
                const isOpen = expanded[group] !== false;
                const all = perms.every((p) => selectedPerms.includes(p.id));
                const some = perms.some((p) => selectedPerms.includes(p.id));
                return (
                  <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => toggleGroup(group)} className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">{group} <span className="text-xs text-gray-400 font-normal">({perms.length})</span></span>
                      <div className="flex items-center gap-2">
                        <span onClick={(e) => { e.stopPropagation(); selectAllGroup(group, perms); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); selectAllGroup(group, perms); } }}
                          role="button" tabIndex={0}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer">
                          {all ? 'Hapus Semua' : 'Pilih Semua'}
                        </span>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${all ? 'bg-blue-600 border-blue-600' : some ? 'bg-blue-100 border-blue-400' : 'border-gray-300 dark:border-gray-600'}`}>
                          {all && <Check className="h-3 w-3 text-white" />}
                        </span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {perms.map((p) => {
                          const on = selectedPerms.includes(p.id);
                          return (
                            <label key={p.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${on ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                              <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${on ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                {on && <Check className="h-3 w-3 text-white" />}
                              </span>
                              <input type="checkbox" checked={on} onChange={() => togglePerm(p.id)} className="sr-only" />
                              <span className={`${on ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(filteredPerms).length === 0 && <p className="text-center text-gray-400 py-8">Tidak ditemukan</p>}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">{selectedPerms.length} dipilih</span>
              <div className="flex gap-2">
                <button onClick={() => setPermOpen(false)} className={btnGhost}>Batal</button>
                <button onClick={savePerms} disabled={busy === permRole.id} className={btnPrimary}>
                  {busy === permRole.id && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId !== null && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setDeleteId(null)}>
          <div className="max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus Role?</h3>
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

      {/* Users Modal */}
      {usersOpen && usersRole && (
        <div className={modalOverlay} onClick={(e) => e.target === e.currentTarget && setUsersOpen(false)}>
          <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users &mdash; {usersRole.role}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userPag.total} user</p>
              </div>
              <button onClick={() => setUsersOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {(['list', 'add'] as const).map((t) => (
                <button key={t} onClick={() => setUserTab(t)}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${userTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                  {t === 'list' ? 'Users' : 'Tambah User'}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {userTab === 'list' ? (
                <>
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <input type="text" placeholder="Cari user..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} className={inputCls} />
                  </div>
                  {usersLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                  ) : roleUsers.length === 0 ? (
                    <div className="text-center py-12 text-gray-400"><Users className="h-8 w-8 mx-auto mb-2" /><p className="text-sm">Tidak ada user</p></div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {roleUsers.map((u) => (
                        <div key={u.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{u.nama.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${(STATUS[u.status ?? 0] || STATUS[0]).cls}`}>{(STATUS[u.status ?? 0] || STATUS[0]).label}</span>
                            <button onClick={() => removeUser(u.id)} disabled={removingId === u.id} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40" title="Hapus">
                              {removingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {userPag.last_page > 1 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between text-sm text-gray-500">
                      <span>Hal. {userPag.current_page}/{userPag.last_page}</span>
                      <div className="flex gap-1">
                        <button onClick={() => setUserPage(userPag.current_page - 1)} disabled={userPag.current_page === 1} className="p-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                        <button onClick={() => setUserPage(userPag.current_page + 1)} disabled={userPag.current_page === userPag.last_page} className="p-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4">
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Cari nama, NIP, email..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchUsers()} className={`${inputCls} flex-1`} />
                    <button onClick={searchUsers} disabled={searchBusy || !addSearch.trim()} className={btnPrimary}>
                      {searchBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Cari
                    </button>
                  </div>
                  {searchBusy ? (
                    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">{addSearch.trim() ? 'Tidak ditemukan' : 'Ketik nama untuk mencari'}</div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {results.map((u) => (
                        <div key={u.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{u.nama.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                            </div>
                          </div>
                          <button onClick={() => addUser(u.id)} disabled={addingId === u.id} className="text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1 flex-shrink-0">
                            {addingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Tambah
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
