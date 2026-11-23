import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ isOpen, onClose }: ResetPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password_request',
          email: email.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Password reset link has been dispatched to your email.');
      } else {
        setError(data.error || 'Unable to process reset request.');
      }
    } catch {
      setError('An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reset Your Password" maxWidth="sm">
      <div className="space-y-4">
        {successMessage ? (
          <div className="p-4 bg-neutral-50 border border-neutral-300 rounded-xl space-y-2 text-center">
            <CheckCircle2 className="w-8 h-8 text-black mx-auto" />
            <div className="text-xs font-semibold text-black">Instructions Sent</div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">{successMessage}</p>
            <div className="pt-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Return to Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your registered RAHI Flowdesk email address. We will verify your account and dispatch secure password reset instructions.
            </p>

            <Input
              type="email"
              label="Account Email"
              placeholder="name@rahicreative.com or client email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
            />

            {error && (
              <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-lg flex items-center gap-2 text-xs text-black">
                <AlertCircle className="w-4 h-4 shrink-0 text-black" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                Send Reset Link
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
