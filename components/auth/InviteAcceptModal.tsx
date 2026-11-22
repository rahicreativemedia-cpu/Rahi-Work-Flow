import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { StatusBadge } from '../common/StatusBadge';
import { Lock, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import { User, Invitation } from '@/lib/types';

interface InviteAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  onSuccess: (user: User) => void;
}

export function InviteAcceptModal({
  isOpen,
  onClose,
  token: initialToken = '',
  onSuccess,
}: InviteAcceptModalProps) {
  const [token, setToken] = useState(initialToken);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      fetchInvitation(initialToken);
    }
  }, [initialToken]);

  const fetchInvitation = async (t: string) => {
    if (!t) return;
    setIsLoadingToken(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth?token=${encodeURIComponent(t.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.invitation) {
          setInvitation(data.invitation);
        } else {
          setError('Invitation not found or expired');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid invitation token');
      }
    } catch {
      setError('Unable to verify invitation token');
    } finally {
      setIsLoadingToken(false);
    }
  };

  const handleLookupToken = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvitation(token);
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_invitation',
          token: token.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onSuccess(data.user);
        onClose();
      } else {
        setError(data.error || 'Failed to activate account');
      }
    } catch {
      setError('An error occurred during account activation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Accept Invitation & Set Password"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Step 1: Token verification if not preloaded */}
        {!invitation && (
          <form onSubmit={handleLookupToken} className="space-y-4">
            <p className="text-xs text-slate-500">
              Enter your secure invitation token to verify your account and set up your initial password.
            </p>

            <Input
              label="Invitation Token"
              placeholder="e.g. inv_173228..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              leftIcon={<KeyRound className="w-4 h-4 text-slate-400" />}
              helperText="Check your invitation email or message from RAHI Creative Media"
            />

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoadingToken}>
                Verify Token
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: Password Setup once invitation is found */}
        {invitation && (
          <form onSubmit={handleAcceptSubmit} className="space-y-4">
            {/* Invitation Details Banner */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{invitation.fullName}</div>
                  <div className="text-[11px] text-slate-500">{invitation.email}</div>
                </div>
                <StatusBadge status={invitation.role} />
              </div>

              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                <span>
                  Portal Scope:{' '}
                  <strong className="capitalize text-slate-800">{invitation.role} Portal</strong>
                </span>
                {invitation.department && (
                  <span className="text-slate-500">Dept: {invitation.department}</span>
                )}
                {invitation.clientName && (
                  <span className="text-slate-500">Org: {invitation.clientName}</span>
                )}
              </div>
            </div>

            {/* Password input fields */}
            <Input
              type="password"
              label="Choose a Password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            />

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 bg-blue-50/60 border border-blue-200/60 rounded-lg text-[11px] text-blue-800 leading-snug">
              Upon confirmation, your account will be activated and you will be routed automatically to the{' '}
              <strong className="capitalize">{invitation.role} Portal</strong>.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Activate Account & Enter
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
