import React, { useState } from 'react';
import { User } from '@/lib/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  allUsers?: User[];
  onLogin: (user: User) => void;
  onOpenInviteModal: () => void;
  onOpenResetPasswordModal: () => void;
}

export function LoginView({
  allUsers = [],
  onLogin,
  onOpenInviteModal,
  onOpenResetPasswordModal,
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setError('A connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-1">
            <img
              src="/rahi-logo.png"
              alt="RAHI Creative Media"
              className="w-16 h-auto max-h-16 object-contain drop-shadow-sm"
            />
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 uppercase">
            RAHI FLOWDESK
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            BY RAHI CREATIVE MEDIA
          </p>
          <p className="mt-1 text-xs text-slate-400 italic">
            One Workspace. Every Creative Workflow.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
          {/* Architecture Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Unified Four-Portal Security Backbone</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Authenticating automatically maps your permissions and routes you into your designated portal.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5">
              <div className="text-center p-1.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-[10px] font-semibold text-indigo-700">
                Admin Portal
              </div>
              <div className="text-center p-1.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[10px] font-semibold text-blue-700">
                Manager Portal
              </div>
              <div className="text-center p-1.5 rounded-lg bg-emerald-50/80 border border-emerald-100 text-[10px] font-semibold text-emerald-700">
                Employee Portal
              </div>
              <div className="text-center p-1.5 rounded-lg bg-purple-50/80 border border-purple-100 text-[10px] font-semibold text-purple-700">
                Client Portal
              </div>
            </div>
          </div>

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="e.g. admin@rahicreative.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={onOpenResetPasswordModal}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Your Portal
            </Button>
          </form>

          {/* Invitation Acceptance Link Trigger */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Have an invitation token?</span>
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Claim Invitation Link</span>
            </button>
          </div>

          {/* Security Policy Reminder */}
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-500 text-center leading-relaxed">
            Strict policy enforced: No public self-registration. Passwords are never stored in plain text. Equal administrative authority shared between Admin and Manager.
          </div>
        </div>
      </div>
    </div>
  );
}
