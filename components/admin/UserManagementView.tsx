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
  const [directRole, setDirectRole] = useState<UserRole>('employee');
  const [directDept, setDirectDept] = useState<Department>('Video Editing');
  const [directClientId, setDirectClientId] = useState(clients[0]?.id || '');
  const [directPhone, setDirectPhone] = useState('');

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
      role: directRole,
      department: directRole === 'employee' ? directDept : undefined,
      clientId: directRole === 'client' ? directClientId : undefined,
      clientName: directRole === 'client' ? matchedClient?.name : undefined,
      phone: directPhone,
    });

    setIsDirectCreateModalOpen(false);
    setDirectName('');
    setDirectEmail('');
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
                        {canAdmin && u.id !== currentUser.id && (
                          <button
                            onClick={() => onToggleUserStatus(u.id)}
                            className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded hover:bg-neutral-100"
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
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
              onChange={(e) => setDirectEmail(e.target.value)}
              placeholder="sameer@rahicreative.com"
              className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900"
            />
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
    </div>
  );
}
