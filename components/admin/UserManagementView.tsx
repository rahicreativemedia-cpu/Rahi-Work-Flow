import React, { useState } from 'react';
import { User, Invitation, Client, Department, UserRole } from '@/lib/types';
import { hasFullAdminAccess } from '@/lib/permissions';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { formatDateTime } from '@/lib/utils';
import {
  UserPlus,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Link,
  Lock,
  UserX,
  UserCheck,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  invitations: Invitation[];
  clients: Client[];
  currentUser: User;
  onSendInvitation: (invData: any) => void;
  onCreateDirectUser: (userData: any) => void;
  onToggleUserStatus: (targetUserId: string) => void;
}

export function UserManagementView({
  users,
  invitations,
  clients,
  currentUser,
  onSendInvitation,
  onCreateDirectUser,
  onToggleUserStatus,
}: UserManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDirectCreateModalOpen, setIsDirectCreateModalOpen] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('employee');
  const [inviteDept, setInviteDept] = useState<Department>('Video Editing');
  const [inviteClientId, setInviteClientId] = useState(clients[0]?.id || '');

  // Direct Create Form State
  const [directName, setDirectName] = useState('');
  const [directEmail, setDirectEmail] = useState('');
  const [directUsername, setDirectUsername] = useState('');
  const [directPassword, setDirectPassword] = useState('rahi123');
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  const [directRole, setDirectRole] = useState<UserRole>('employee');
  const [directDept, setDirectDept] = useState<Department>('Video Editing');
  const [directClientId, setDirectClientId] = useState(clients[0]?.id || '');
  const [directPhone, setDirectPhone] = useState('');

  // Management Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState<User | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [showChangePasswordInput, setShowChangePasswordInput] = useState(false);
  const [isSubmittingPasswordChange, setIsSubmittingPasswordChange] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const canAdmin = hasFullAdminAccess(currentUser);

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/?invite=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteFullName) return;

    const matchedClient = clients.find((c) => c.id === inviteClientId);
    onSendInvitation({
      email: inviteEmail,
      fullName: inviteFullName,
      username: inviteUsername || inviteEmail.split('@')[0],
      role: inviteRole,
      department: inviteRole === 'employee' ? inviteDept : undefined,
      clientId: inviteRole === 'client' ? inviteClientId : undefined,
      clientName: inviteRole === 'client' ? matchedClient?.name : undefined,
    });

    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteFullName('');
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmail || !directName) return;

    const matchedClient = clients.find((c) => c.id === directClientId);
    onCreateDirectUser({
      name: directName,
      email: directEmail,
      username: directUsername || directEmail.split('@')[0],
      password: directPassword.trim() || 'rahi123',
      role: directRole,
      department: directRole === 'employee' ? directDept : undefined,
      clientId: directRole === 'client' ? directClientId : undefined,
      clientName: directRole === 'client' ? matchedClient?.name : undefined,
      phone: directPhone,
    });

    setIsDirectCreateModalOpen(false);
    setDirectName('');
    setDirectEmail('');
    setDirectUsername('');
    setDirectPassword('rahi123');
  };

  const handleAdminChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForPasswordChange || !newPasswordForUser.trim()) return;

    setIsSubmittingPasswordChange(true);
    setPasswordChangeSuccess(null);
    setPasswordChangeError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manager_change_password',
          callerUserId: currentUser.id,
          targetUserId: userForPasswordChange.id,
          newPassword: newPasswordForUser.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordChangeSuccess(data.message || `Password successfully updated for ${userForPasswordChange.name}`);
        setNewPasswordForUser('');
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setUserForPasswordChange(null);
          setPasswordChangeSuccess(null);
        }, 1500);
      } else {
        setPasswordChangeError(data.error || 'Failed to update user password.');
      }
    } catch {
      setPasswordChangeError('A network error occurred while updating the password.');
    } finally {
      setIsSubmittingPasswordChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 tracking-tight">
              User Accounts & Secure Invitation Management
            </h2>
            <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded border border-neutral-300">
              Admin & Manager Equal Control
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Manage user accounts, send secure invitation links, set roles across all four portals, and manage account status.
          </p>
        </div>

        {canAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-900 to-rose-950 hover:brightness-110 text-white rounded-lg text-xs font-semibold shadow-xs transition-all border border-rose-800"
            >
              <Mail className="w-4 h-4" />
              <span>Send Invitation Link</span>
            </button>
            <button
              onClick={() => setIsDirectCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-950 rounded-lg text-xs font-semibold border border-rose-200 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Direct Account Create</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-semibold text-stone-500">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-rose-900 text-rose-950 font-bold'
              : 'border-transparent hover:text-stone-800'
          }`}
        >
          All System Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'border-rose-900 text-rose-950 font-bold'
              : 'border-transparent hover:text-stone-800'
          }`}
        >
          <span>Pending Invitations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-900 text-[10px] font-bold border border-rose-200">
            {invitations.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ALL USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Registered System Accounts</h3>
            <span className="text-xs text-neutral-500">
              Zero public self-registration • Invitation-governed access
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role & Portal</th>
                  <th className="py-3 px-4">Association / Dept</th>
                  <th className="py-3 px-4">Permission Group</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {users.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/70">
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-[10px]">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] font-normal text-neutral-400">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase bg-neutral-100 text-neutral-900 border-neutral-300"
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-700">
                        {u.role === 'client'
                          ? u.clientName || 'Associated Client'
                          : u.role === 'employee'
                          ? u.department
                          : 'Company-Wide'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px]">
                        {u.permissionGroup === 'FULL_ADMIN_ACCESS' ? (
                          <span className="text-black font-bold bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
                            FULL_ADMIN_ACCESS
                          </span>
                        ) : (
                          <span className="text-neutral-500">{u.permissionGroup}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={u.status === 'active' ? 'emerald' : 'slate'}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canAdmin && (currentUser.role === 'admin' || (currentUser.role === 'manager' && u.role !== 'admin')) && (
                            <button
                              onClick={() => {
                                setUserForPasswordChange(u);
                                setNewPasswordForUser('');
                                setPasswordChangeSuccess(null);
                                setPasswordChangeError(null);
                                setIsChangePasswordOpen(true);
                              }}
                              title={`Set password for ${u.name}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-700 hover:text-black px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors border border-neutral-200"
                            >
                              <KeyRound className="w-3 h-3 text-stone-600" />
                              <span>Set Password</span>
                            </button>
                          )}
                          {canAdmin && u.id !== currentUser.id && (
                            <button
                              onClick={() => onToggleUserStatus(u.id)}
                              className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded-md hover:bg-neutral-100 transition-colors"
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PENDING INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Secure Invitation Links</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Users receive secure activation links to set their own passwords. Plaintext passwords are never stored.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invitation Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-50/70">
                    <td className="py-3.5 px-4 font-bold text-neutral-900">{inv.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">{inv.email}</td>
                    <td className="py-3.5 px-4 capitalize font-semibold">{inv.role}</td>
                    <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                      {formatDateTime(inv.expiresAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={inv.status === 'pending' ? 'amber' : 'emerald'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleCopyLink(inv.token)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-xs font-semibold transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SEND INVITATION */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Send Secure Portal Invitation"
        description="User will receive a secure token to set their password upon initial login."
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
              placeholder="e.g. Maya Lin"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="maya@company.com"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Role *</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
            >
              <option value="employee">Employee (Creative Team)</option>
              <option value="client">Client (Private Workspace)</option>
              <option value="manager">Manager (Equal Admin Rights)</option>
              <option value="admin">Admin (Full Administrative)</option>
            </select>
          </div>

          {inviteRole === 'employee' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Department</label>
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value as Department)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
              >
                <option value="Video Editing">Video Editing</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Scriptwriting">Scriptwriting</option>
                <option value="Social Media">Social Media</option>
                <option value="Content Planning">Content Planning</option>
              </select>
            </div>
          )}

          {inviteRole === 'client' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Associated Client Brand</label>
              <select
                value={inviteClientId}
                onChange={(e) => setInviteClientId(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Generate & Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: DIRECT ACCOUNT CREATE */}
      <Modal
        isOpen={isDirectCreateModalOpen}
        onClose={() => setIsDirectCreateModalOpen(false)}
        title="Create Account Directly"
        description="Creates active account credentials immediately."
        maxWidth="md"
      >
        <form onSubmit={handleDirectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={directName}
              onChange={(e) => setDirectName(e.target.value)}
              placeholder="e.g. Sameer Dixit"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={directEmail}
              onChange={(e) => {
                setDirectEmail(e.target.value);
                if (!directUsername || directUsername === directEmail.split('@')[0]) {
                  setDirectUsername(e.target.value.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, ''));
                }
              }}
              placeholder="sameer@rahicreative.com"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Username / Handle *
              </label>
              <input
                type="text"
                required
                value={directUsername}
                onChange={(e) => setDirectUsername(e.target.value)}
                placeholder="e.g. sameer.d"
                className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Account Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
                    let gen = '';
                    for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                    setDirectPassword(gen);
                    setShowDirectPassword(true);
                  }}
                  className="text-[10px] text-stone-600 hover:text-black flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Auto</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showDirectPassword ? 'text' : 'password'}
                  required
                  value={directPassword}
                  onChange={(e) => setDirectPassword(e.target.value)}
                  placeholder="Set initial password"
                  className="w-full text-xs p-2 pr-8 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowDirectPassword(!showDirectPassword)}
                  className="absolute right-2 text-stone-400 hover:text-stone-700"
                >
                  {showDirectPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Role</label>
              <select
                value={directRole}
                onChange={(e) => setDirectRole(e.target.value as UserRole)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
              >
                <option value="employee">Employee</option>
                <option value="client">Client</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Phone</label>
              <input
                type="text"
                value={directPhone}
                onChange={(e) => setDirectPhone(e.target.value)}
                placeholder="+91..."
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
              />
            </div>
          </div>

          {directRole === 'employee' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Department</label>
              <select
                value={directDept}
                onChange={(e) => setDirectDept(e.target.value as Department)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
              >
                <option value="Video Editing">Video Editing</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Scriptwriting">Scriptwriting</option>
                <option value="Social Media">Social Media</option>
                <option value="Content Planning">Content Planning</option>
              </select>
            </div>
          )}

          {directRole === 'client' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Associated Client Brand</label>
              <select
                value={directClientId}
                onChange={(e) => setDirectClientId(e.target.value)}
                className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setIsDirectCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Create User Account
            </button>
          </div>
        </form>
      </Modal>
      {/* MODAL: MANAGEMENT CHANGE PASSWORD */}
      <Modal
        isOpen={isChangePasswordOpen}
        onClose={() => {
          setIsChangePasswordOpen(false);
          setUserForPasswordChange(null);
        }}
        title={`Set Password: ${userForPasswordChange?.name || 'User'}`}
        description={`Management Authority: Set or reset login password for ${userForPasswordChange?.name} (${userForPasswordChange?.role.toUpperCase()}).`}
        maxWidth="sm"
      >
        <form onSubmit={handleAdminChangePasswordSubmit} className="space-y-4">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Account Handle:</span>
              <span className="font-mono font-bold text-neutral-900">@{userForPasswordChange?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Registered Email:</span>
              <span className="font-mono text-neutral-800">{userForPasswordChange?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Role / Access:</span>
              <span className="uppercase font-semibold text-neutral-900">{userForPasswordChange?.role}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-neutral-700">
                New Login Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
                  let gen = '';
                  for (let i = 0; i < 10; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                  setNewPasswordForUser(gen);
                  setShowChangePasswordInput(true);
                }}
                className="text-[10px] text-stone-600 hover:text-black flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Auto-generate</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showChangePasswordInput ? 'text' : 'password'}
                required
                value={newPasswordForUser}
                onChange={(e) => setNewPasswordForUser(e.target.value)}
                placeholder="Enter new password"
                className="w-full text-xs p-2.5 pr-8 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowChangePasswordInput(!showChangePasswordInput)}
                className="absolute right-2 text-stone-400 hover:text-stone-700"
              >
                {showChangePasswordInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {passwordChangeSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordChangeSuccess}</span>
            </div>
          )}

          {passwordChangeError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
              {passwordChangeError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setIsChangePasswordOpen(false);
                setUserForPasswordChange(null);
              }}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingPasswordChange || !newPasswordForUser.trim()}
              className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              {isSubmittingPasswordChange ? 'Updating...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
