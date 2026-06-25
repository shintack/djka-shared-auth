'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  X,
  Loader2,
  KeyRound,
  Check,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { createManagementApi } from './api';
import type { ManagementApiInstance } from './types';
import { useManagementRoles, useManagementRoleUsers } from './hooks';
import type { ManagementRole, Permission, ManagementUser } from './types';

const roleColors = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'bg-lime-50 text-lime-700 border-lime-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-pink-50 text-pink-700 border-pink-200',
];

const statusConfig: Record<number, { label: string; bg: string; text: string; dot: string }> = {
  0: { label: 'Nonaktif', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  1: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  2: { label: 'Aktif', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

interface RoleManagementViewProps {
  api: ManagementApiInstance;
  permission?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function RoleManagementView({
  api,
  permission = 'admin.role_management',
  title = 'Manajemen Role',
  subtitle = 'Kelola role dan hak akses pengguna',
  className,
}: RoleManagementViewProps) {
  const mgmtApi = useMemo(() => createManagementApi(api), [api]);

  const { roles, permissions, loading, refetch } = useManagementRoles({ api: mgmtApi });

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<ManagementRole | null>(null);
  const [formData, setFormData] = useState({ role: '', kode_role: '', description: '' });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ManagementRole | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchPerm, setSearchPerm] = useState('');

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [usersModalRole, setUsersModalRole] = useState<ManagementRole | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [activeUserTab, setActiveUserTab] = useState<'list' | 'add'>('list');
  const [addUserSearch, setAddUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ManagementUser[]>([]);
  const [searchResultsLoading, setSearchResultsLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const { users: roleUsers, pagination: userPagination, loading: usersLoading, refetch: refetchRoleUsers } = useManagementRoleUsers({
    api: mgmtApi,
    roleId: usersModalRole?.id ?? null,
    page: userPage,
    search: userSearch,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(-1);
    try {
      if (editingRole) {
        await mgmtApi.role.update(editingRole.id, formData);
        toast.success('Role berhasil diperbarui.');
      } else {
        await mgmtApi.role.create(formData);
        toast.success('Role berhasil ditambahkan.');
      }
      setShowForm(false);
      setEditingRole(null);
      setFormData({ role: '', kode_role: '', description: '' });
      refetch();
    } catch {
      toast.error('Gagal menyimpan role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = (role: ManagementRole) => {
    setEditingRole(role);
    setFormData({ role: role.role, kode_role: role.kode_role, description: role.description || '' });
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm === null) return;
    setDeleteLoading(true);
    try {
      await mgmtApi.role.remove(deleteConfirm);
      toast.success('Role berhasil dihapus.');
      setDeleteConfirm(null);
      refetch();
    } catch {
      toast.error('Gagal menghapus role.');
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openPermissionModal = (role: ManagementRole) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setExpandedGroups({});
    setSearchPerm('');
    setShowPermissionModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setActionLoading(selectedRole.id);
    try {
      await mgmtApi.role.syncPermissions(selectedRole.id, { permission_ids: selectedPermissions });
      toast.success('Permissions berhasil disimpan.');
      setShowPermissionModal(false);
      setSelectedRole(null);
      refetch();
    } catch {
      toast.error('Gagal menyimpan permissions.');
    } finally {
      setActionLoading(null);
    }
  };

  const togglePermission = (permId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const selectAllInGroup = (group: string, groupPerms: Permission[]) => {
    const allSelected = groupPerms.every((p) => selectedPermissions.includes(p.id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !groupPerms.some((p) => p.id === id)));
    } else {
      setSelectedPermissions((prev) => {
        const newIds = groupPerms.filter((p) => !prev.includes(p.id)).map((p) => p.id);
        return [...prev, ...newIds];
      });
    }
  };

  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    const group = perm.group || 'Lainnya';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  const filteredGroupedPermissions = searchPerm
    ? Object.fromEntries(
        Object.entries(groupedPermissions).map(([group, perms]) => [
          group,
          perms.filter((p) =>
            p.label.toLowerCase().includes(searchPerm.toLowerCase()) ||
            p.name.toLowerCase().includes(searchPerm.toLowerCase())
          ),
        ]).filter(([, perms]) => perms.length > 0)
      )
    : groupedPermissions;

  const openUsersModal = (role: ManagementRole) => {
    setUsersModalRole(role);
    setUserPage(1);
    setUserSearch('');
    setActiveUserTab('list');
    setAddUserSearch('');
    setSearchResults([]);
    setShowUsersModal(true);
  };

  const handleUserSearch = useCallback(async () => {
    if (!usersModalRole || !addUserSearch.trim()) return;
    setSearchResultsLoading(true);
    try {
      const res = await mgmtApi.user.list({ search: addUserSearch, per_page: 20 });
      const allUsers = ((res.data as Record<string, unknown>).data as { data?: ManagementUser[] })?.data || [];
      setSearchResults(allUsers.filter((u) => u.id_role !== usersModalRole.id));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchResultsLoading(false);
    }
  }, [mgmtApi, addUserSearch, usersModalRole]);

  const handleAddUser = async (userId: number) => {
    if (!usersModalRole) return;
    setAddingUserId(userId);
    try {
      await mgmtApi.role.addUser(usersModalRole.id, userId);
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
      refetchRoleUsers();
      toast.success('User berhasil ditambahkan ke role.');
    } catch {
      toast.error('Gagal menambahkan user ke role.');
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!usersModalRole) return;
    setRemovingUserId(userId);
    try {
      await mgmtApi.role.removeUser(usersModalRole.id, userId);
      refetchRoleUsers();
      toast.success('User berhasil dihapus dari role.');
    } catch {
      toast.error('Gagal menghapus user dari role.');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className ?? ''}`}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingRole(null); setFormData({ role: '', kode_role: '', description: '' }); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <Plus className="h-4 w-4" />
          Tambah Role
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingRole ? 'Edit Role' : 'Tambah Role'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Role <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Contoh: Staff Verifikasi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode Role <span className="text-red-500">*</span></label>
                <input type="text" required value={formData.kode_role} onChange={(e) => setFormData({ ...formData, kode_role: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Contoh: staff" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" rows={3} placeholder="Deskripsi role..." />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors">Batal</button>
                <button type="submit" disabled={actionLoading === -1} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {actionLoading === -1 && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRole ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPermissionModal && selectedRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kelola Permissions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRole.role} &mdash; {selectedPermissions.length} permissions dipilih</p>
              </div>
              <button onClick={() => setShowPermissionModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Cari permission..."
                  value={searchPerm}
                  onChange={(e) => setSearchPerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(Object.entries(filteredGroupedPermissions) as [string, Permission[]][]).map(([group, perms]) => {
                const isExpanded = expandedGroups[group] !== false;
                const allSelected = perms.every((p) => selectedPermissions.includes(p.id));
                const someSelected = perms.some((p) => selectedPermissions.includes(p.id));
                return (
                  <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleGroup(group)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">{group}</span>
                        <span className="text-xs text-gray-400">({perms.length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          onClick={(e) => { e.stopPropagation(); selectAllInGroup(group, perms); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); selectAllInGroup(group, perms); } }}
                          role="button"
                          tabIndex={0}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 cursor-pointer focus:outline-none"
                        >
                          {allSelected ? 'Hapus Semua' : 'Pilih Semua'}
                        </div>
                        <span className={`w-4 h-4 rounded border flex items-center justify-center ${allSelected ? 'bg-blue-600 border-blue-600' : someSelected ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}>
                          {allSelected && <Check className="h-3 w-3 text-white" />}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isSelected = selectedPermissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePermission(perm.id)}
                                className="sr-only"
                              />
                              <span className={`text-sm ${isSelected ? 'text-blue-700 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{perm.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{selectedPermissions.length}</span> permissions dipilih
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPermissionModal(false)} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors">Batal</button>
                <button
                  onClick={handleSavePermissions}
                  disabled={actionLoading === selectedRole.id}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === selectedRole.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Permissions
                </button>
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
              Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan.
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

      {showUsersModal && usersModalRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Users &mdash; {usersModalRole.role}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{userPagination.total} user</p>
              </div>
              <button onClick={() => setShowUsersModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveUserTab('list')}
                className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${
                  activeUserTab === 'list'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveUserTab('add')}
                className={`flex-1 px-6 py-3 text-sm font-medium text-center transition-colors ${
                  activeUserTab === 'add'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Tambah User
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeUserTab === 'list' ? (
                <>
                  <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          placeholder="Cari user..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && setUserPage(1)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </div>

                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : roleUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Tidak ada user</p>
                    </div>
                  ) : (
                    <>
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800/60 divide-y divide-gray-100 dark:divide-gray-700/50">
                          {roleUsers.map((u) => {
                            const sc = statusConfig[u.status ?? 0];
                            return (
                              <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{u.nama.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.nip || '-'}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                    {sc.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button
                                    onClick={() => handleRemoveUser(u.id)}
                                    disabled={removingUserId === u.id}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                    title="Hapus dari role"
                                  >
                                    {removingUserId === u.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {userPagination.last_page > 1 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Halaman {userPagination.current_page} dari {userPagination.last_page}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setUserPage(1)}
                              disabled={userPagination.current_page === 1}
                              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setUserPage(userPagination.current_page - 1)}
                              disabled={userPagination.current_page === 1}
                              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            {Array.from({ length: userPagination.last_page }, (_, i) => i + 1)
                              .filter((p) => p === 1 || p === userPagination.last_page || Math.abs(p - userPagination.current_page) <= 1)
                              .map((p, idx, arr) => (
                                <span key={p}>
                                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                                  <button
                                    onClick={() => setUserPage(p)}
                                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                                      p === userPagination.current_page
                                        ? 'bg-blue-600 text-white border border-blue-600'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {p}
                                  </button>
                                </span>
                              ))}
                            <button
                              onClick={() => setUserPage(userPagination.current_page + 1)}
                              disabled={userPagination.current_page === userPagination.last_page}
                              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setUserPage(userPagination.last_page)}
                              disabled={userPagination.current_page === userPagination.last_page}
                              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="p-6">
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        placeholder="Cari user berdasarkan nama, NIP, atau email..."
                        value={addUserSearch}
                        onChange={(e) => setAddUserSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                      />
                    </div>
                    <button
                      onClick={handleUserSearch}
                      disabled={searchResultsLoading || !addUserSearch.trim()}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {searchResultsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Cari
                    </button>
                  </div>

                  {searchResultsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : searchResults.length === 0 && addUserSearch.trim() ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Tidak ada user ditemukan</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                      <Users className="h-12 w-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="font-medium">Cari user untuk ditambahkan</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800/60 divide-y divide-gray-100 dark:divide-gray-700/50">
                        {searchResults.map((u) => {
                          const sc = statusConfig[u.status ?? 0];
                          return (
                            <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{u.nama.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.nama}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{u.nip || '-'}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                  {sc.label}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleAddUser(u.id)}
                                  disabled={addingUserId === u.id}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                  {addingUserId === u.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Plus className="h-4 w-4" />
                                  )}
                                  Tambah
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((r, idx) => {
          const colorClass = roleColors[idx % roleColors.length];
          return (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md dark:hover:shadow-gray-900/30 transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} border`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{r.role}</h3>
                      <span className="text-xs text-gray-400 font-mono">{r.kode_role}</span>
                    </div>
                  </div>
                </div>
                {r.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{r.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4" />
                    <span>{r.permissions?.length || 0} permissions</span>
                  </div>
                  <button
                    onClick={() => openUsersModal(r)}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>{r.users_count || 0} users</span>
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50/50 dark:bg-gray-800/90 flex items-center justify-end gap-1">
                <button
                  onClick={() => openPermissionModal(r)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-medium"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Permissions
                </button>
                <button
                  onClick={() => handleEdit(r)}
                  className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(r.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
