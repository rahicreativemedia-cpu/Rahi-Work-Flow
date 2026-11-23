import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Modal } from '../common/Modal';
import { Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, UserCheck, Database, ExternalLink } from 'lucide-react';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

export function AdminProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}: AdminProfileModalProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Supabase Status State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setUsername(currentUser.username || currentUser.email.split('@')[0] || '');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(null);
      setError(null);

      // Check live Supabase status
      fetch('/api/supabase/status')
        .then((res) => res.json())
        .then((data) => setSupabaseStatus(data))
        .catch(() => {
          setSupabaseStatus({
            configured: false,
            connected: false,
            status: 'unreachable',
            message: 'Unable to query Supabase status endpoint.',
          });
        });
    }
  }, [isOpen, currentUser]);

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let gen = '';
    for (let i = 0; i < 12; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!name.trim() || !email.trim() || !username.trim()) {
      setError('Name, email, and username are required.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_self_credentials',
          userId: currentUser.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setSuccessMessage(data.message || 'Your credentials have been updated successfully.');
        onUserUpdated(data.user);
        try {
          localStorage.setItem('rahi_flowdesk_current_user', JSON.stringify(data.user));
        } catch {}

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update credentials.');
      }
    } catch {
      setError('A network error occurred while updating your profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Admin Profile & Credential Settings"
      description="Update your administrator name, portal handle / username, email, and password."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <span className="text-[10px] bg-neutral-200 text-neutral-800 px-1.5 py-0.2 rounded font-mono uppercase">
                {currentUser.role}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              Active Session • {currentUser.email}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Display Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahi Creative Media"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@rahicreative.com"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Portal Username / Handle *
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. admin or rahi"
            className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-black"
          />
          <p className="text-[11px] text-neutral-400 mt-1">
            You can use either this username or your email to sign in.
          </p>
        </div>

        {/* Change Password Block */}
        <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800">
              Change Account Password
            </span>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-[11px] text-stone-600 hover:text-black flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              <span>Generate Strong</span>
            </button>
          </div>
          <p className="text-[11px] text-neutral-500">
            Leave blank if you do not wish to change your current password.
          </p>

          <div className="space-y-2 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full text-xs p-2 pr-8 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {newPassword && (
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full text-xs p-2 bg-white border border-neutral-300 rounded-lg text-neutral-900 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Supabase PostgreSQL Integration Card */}
        <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
              <Database className="w-3.5 h-3.5 text-[#ED1C24]" />
              <span>Supabase Cloud Database</span>
            </div>
            {supabaseStatus?.connected ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            ) : supabaseStatus?.configured ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Schema Pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-600 bg-neutral-200/60 px-2 py-0.5 rounded-full">
                Local Fallback Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 leading-tight">
            {supabaseStatus?.message || 'Configured via .env.local with seamless automatic fallback to local JSON storage.'}
          </p>
        </div>

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            {isLoading ? 'Saving...' : 'Save Profile & Credentials'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
