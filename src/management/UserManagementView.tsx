'use client';

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Filter,
  X,
  Users,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { createManagementApi } from './api';
import type { ManagementApiInstance } from './types';
import { useManagementUsers } from './hooks';
import type { ManagementUser } from './types';

const statusConfig = {
  0: { label: 'Nonaktif', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  1: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  2: { label: 'Aktif', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const PER_PAGE_OPTIONS = [10, 25, 50];

interface UserManagementViewProps {
  api: ManagementApiInstance;
  permission?: string;
  currentUserId?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function UserManagementView({
  api,
  permission = 'admin.user_management',
  currentUserId,
  title = 'Manajemen User',
  subtitle = 'Kelola data pengguna dan akses sistem',
  className,
}: UserManagementViewProps) {
  const mgmtApi = useMemo(() => createManagementApi(api), [api]);
  const { user: currentUser, hasPermission } = useAuth();
  const effectiveCurrentUserId = currentUserId ?? currentUser?.id;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { users, roles, pagination, loading, refetch } = useManagementUsers({
    api: mgmtApi,
    page: currentPage,
    perPage,
    search,
    idRole: roleFilter,
    status: statusFilter,
  });

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<ManagementUser | null>(null);
  const [editingUser, setEditingUser] = useState<ManagementUser | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    nip: '',
    nik: '',
    nama: '',
    email: '',
    password: '',
    id_role: '',
    telp: '',
    status: 2,
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || roleFilter || statusFilter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(-1);
    try {
      if (editingUser) {
        await mgmtApi.user.update(editingUser.id, {
          nip: formData.nip,
          nik: formData.nik,
          nama: formData.nama,
          email: formData.email,
          id_role: formData.id_role,
          telp: formData.telp,
          status: formData.status,
        });
        toast.success('User berhasil diperbarui.');
      } else {
        await mgmtApi.user.create(formData);
        toast.success('User berhasil ditambahkan.');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ nip: '', nik: '', nama: '', email: '', password: '', id_role: '', telp: '', status: 2 });
      refetch();
    } catch {
      toast.error('Gagal menyimpan user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (user: ManagementUser) => {
    setEditingUser(user);
    setFormData({
      nip: user.nip || '',
      nik: user.nik || '',
      nama: user.nama,
      email: user.email,
      password: '',
      id_role: user.role?.id?.toString() || '',
      telp: user.telp || '',
      status: user.status ?? 2,
    });
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    setDeleteLoading(true);
    try {
      await mgmtApi.user.remove(deleteConfirm);
      toast.success('User berhasil dihapus.');
      setDeleteConfirm(null);
      refetch();
    } catch {
      toast.error('Gagal menghapus user.');
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (id: number, currentStatus: number | null) => {
    setActionLoading(id);
    try {
      const newStatus = currentStatus === 2 ? 0 : 2;
      await mgmtApi.user.updateStatus(id, newStatus);
      refetch();
    } catch {
      toast.error('Gagal mengupdate status.');
    } finally {
      setActionLoading(null);
    }
  };

  const openAddForm = () => {
    setEditingUser(null);
    setFormData({ nip: '', nik: '', nama: '', email: '', password: '', id_role: '', telp: '', status: 2 });
    setShowForm(true);
  };

  const startItem = (pagination.current_page - 1) * pagination.per_page + 1;
  const endItem = Math.min(pagination.current_page * pagination.per_page, pagination.total);

  const getPageNumbers = (): (number | '...')[] => {
    const { current_page: current, last_page: last } = pagination;
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const pages: (number | '...')[] = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < last - 2) pages.push('...');
    pages.push(last);
    return pages;
  };

  return (
    <div className={`p-6 space-y-6 ${className ?? ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        {hasPermission(permission) && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama, NIP, NIK, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Semua Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.role}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-4 pr-8 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="2">Aktif</option>
              <option value="1">Pending</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Search className="h-4 w-4" />
            Cari
          </button>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Total {pagination.total} user ditemukan</span>
            {roleFilter && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                Role: {roles.find(r => r.id.toString() === roleFilter)?.role}
              </span>
            )}
            {statusFilter && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                Status: {statusConfig[Number(statusFilter) as keyof typeof statusConfig]?.label}
              </span>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingUser ? 'Edit User' : 'Tambah User'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIP</label>
                  <input type="text" value={formData.nip} onChange={(e) => setFormData({ ...formData, nip: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIK</label>
                  <input type="text" value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password <span className="text-red-500">*</span></label>
                  <input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role <span className="text-red-500">*</span></label>
                  <select required value={formData.id_role} onChange={(e) => setFormData({ ...formData, id_role: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Pilih Role</option>
                    {roles.map((r) => (<option key={r.id} value={r.id}>{r.role}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value={2}>Aktif</option>
                    <option value={1}>Pending</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telepon</label>
                <input type="text" value={formData.telp} onChange={(e) => setFormData({ ...formData, telp: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors">Batal</button>
                <button type="submit" disabled={actionLoading === -1} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {actionLoading === -1 && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail User</h2>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-300">{showDetail.nama.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{showDetail.nama}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{showDetail.role?.role || 'Tanpa Role'}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {([
                  ['NIP', showDetail.nip],
                  ['NIK', showDetail.nik],
                  ['Email', showDetail.email],
                  ['Telepon', showDetail.telp],
                  ['Status', statusConfig[showDetail.status as keyof typeof statusConfig]?.label],
                ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
              <button onClick={() => setDeleteConfirm(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                disabled={deleteLoading}
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Tidak ada data user</p>
            <p className="text-sm">Coba ubah filter atau tambahkan user baru</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
                    const sc = statusConfig[u.status as keyof typeof statusConfig] || statusConfig[0];
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-gray-600">{u.nama.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {u.role ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                              {u.role.role}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setShowDetail(u)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {hasPermission(permission) && (
                              <>
                                <button
                                  onClick={() => handleEdit(u)}
                                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(u.id, u.status)}
                                  disabled={actionLoading === u.id}
                                  className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                                  title={u.status === 2 ? 'Nonaktifkan' : 'Aktifkan'}
                                >
                                  {actionLoading === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.status === 2 ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                                </button>
                                {u.id !== effectiveCurrentUserId && (
                                  <button
                                    onClick={() => setDeleteConfirm(u.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Hapus"
                                  >
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

            <div className="border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                  Menampilkan {pagination.total > 0 ? `${startItem}-${endItem}` : 0} dari {pagination.total} user
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Per halaman:</span>
                  <select
                    value={perPage}
                    onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {PER_PAGE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page as number)}
                      className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === pagination.current_page
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage(pagination.current_page + 1)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.last_page)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
