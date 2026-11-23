import React, { useState } from 'react';
import { User as UserType } from '@/lib/types';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Layers,
  Video,
  Users,
  BadgeCheck,
  Calendar,
  BarChart3,
  FileEdit,
  TrendingUp,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';

interface LoginViewProps {
  allUsers?: UserType[];
  onLogin: (user: UserType) => void;
  onOpenInviteModal: () => void;
  onOpenResetPasswordModal: () => void;
}

export function LoginView({
  allUsers = [],
  onLogin,
  onOpenInviteModal,
  onOpenResetPasswordModal,
}: LoginViewProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();

    if (!cleanId) {
      setError('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
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
          email: cleanId,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Invalid credentials. Please verify your username/email and password.');
      }
    } catch {
      setError('A connection error occurred. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 8 Feature Highlights matching reference exactly
  const features = [
    { label: 'Project Management', icon: Layers },
    { label: 'Creative Workflow', icon: Video },
    { label: 'Team Collaboration', icon: Users },
    { label: 'Client Approvals', icon: BadgeCheck },
    { label: 'Content Calendar', icon: Calendar },
    { label: 'Deliverable Tracking', icon: BarChart3 },
    { label: 'Revisions & Feedback', icon: FileEdit },
    { label: 'Reports & Performance', icon: TrendingUp },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#FAF9F8] text-[#171717] overflow-x-hidden flex items-center justify-center font-sans">
      {/* Decorative Red Curved Ribbon in Top-Right Corner (Matches Reference) */}
      <div className="absolute top-0 right-0 w-[320px] sm:w-[480px] lg:w-[620px] h-[320px] sm:h-[480px] lg:h-[620px] pointer-events-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full text-[#ED1C24]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M500 0C400 60 320 180 340 320C360 440 440 480 500 500V0Z"
            fill="url(#redGrad1)"
            opacity="0.9"
          />
          <path
            d="M500 0C430 40 370 120 380 230C390 320 450 380 500 420V0Z"
            fill="url(#redGrad2)"
            opacity="0.95"
          />
          <defs>
            <linearGradient id="redGrad1" x1="500" y1="0" x2="320" y2="350" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ED1C24" />
              <stop offset="0.6" stopColor="#F43F5E" stopOpacity="0.85" />
              <stop offset="1" stopColor="#FFE4E6" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="redGrad2" x1="500" y1="0" x2="360" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#DC2626" />
              <stop offset="0.5" stopColor="#ED1C24" />
              <stop offset="1" stopColor="#FB7185" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Decorative Soft Red Accent in Bottom-Left Corner */}
      <div className="absolute bottom-0 left-0 w-[240px] sm:w-[360px] h-[240px] sm:h-[360px] pointer-events-none z-0 overflow-hidden">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 300C80 280 150 220 130 140C110 70 40 20 0 0V300Z"
            fill="url(#redGradLeft)"
            opacity="0.45"
          />
          <defs>
            <linearGradient id="redGradLeft" x1="0" y1="300" x2="160" y2="120" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ED1C24" stopOpacity="0.6" />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Split Screen Container */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* ========================================================= */}
        {/* LEFT MARKETING PANEL (Matches Reference Image Exactly)    */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[56%] flex flex-col justify-center">
          {/* Top Header Brand Tab */}
          <div className="inline-flex items-center gap-3.5 bg-white border border-stone-200/80 rounded-2xl px-5 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)] mb-8 self-start">
            <img
              src="/rahi-logo.png"
              alt="RAHI Creative Media Logo"
              className="h-8 w-auto object-contain"
            />
            <div className="w-[1.5px] h-7 bg-stone-200" />
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wide text-[#171717] uppercase leading-tight">
                RAHI FLOWDESK
              </span>
              <span className="text-[9px] font-bold text-stone-500 tracking-[0.22em] uppercase leading-tight mt-0.5">
                BY RAHI CREATIVE MEDIA
              </span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="mb-4 self-start">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#FFF1F2] text-[#ED1C24] border border-[#FFE4E6] tracking-wide">
              Agency Operations Platform
            </span>
          </div>

          {/* Main Headline with Highlight and Underline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-[#171717] tracking-tight leading-[1.15]">
            Plan. Produce. Approve.
            <br />
            <span className="text-[#ED1C24] relative inline-block">
              Deliver. Together.
              {/* Dynamic curved red accent swoosh under "Together." */}
              <svg
                className="absolute -bottom-2.5 left-0 w-full h-3.5 text-[#ED1C24] overflow-visible"
                viewBox="0 0 160 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 9C45 2.5 115 2 158 9.5"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Supporting Description */}
          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-lg mt-5 mb-8">
            A unified workspace for the RAHI team and our clients to manage projects, content, approvals and campaign delivery — all in one place.
          </p>

          {/* 8 Feature Highlight Cards (2 rows of 4 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[560px]">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.label}
                  className="bg-white rounded-2xl p-3 sm:p-3.5 border border-stone-200/70 shadow-[0_4px_14px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-stone-300 transition-all flex flex-col items-center justify-center text-center min-h-[92px] group"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-50/50 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4 text-[#ED1C24] stroke-[2]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#171717] leading-tight group-hover:text-[#ED1C24] transition-colors">
                    {feat.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Creative Studio Desk Graphic */}
          <div className="mt-8 flex items-center gap-4 pt-4 border-t border-stone-200/50 max-w-[560px]">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#ED1C24]" />
              <span>Full-Stack Creative Agency Engine</span>
            </div>
            <div className="h-3 w-[1px] bg-stone-300" />
            <div className="text-stone-400 text-xs">
              Video Production &bull; Social Campaigns &bull; Retainer Delivery
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT LOGIN PANEL (Matches Reference Image Exactly)       */}
        {/* ========================================================= */}
        <div className="w-full lg:w-[44%] flex justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-[36px] border border-stone-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] p-8 sm:p-12 relative z-10">
            {/* Card Brand Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/rahi-logo.png"
                  alt="RAHI Logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <h2 className="text-2xl font-black text-[#171717] tracking-tight">
                RAHI Flowdesk
              </h2>
              {/* Horizontal line accents with text */}
              <div className="flex items-center justify-center gap-2.5 mt-1.5">
                <span className="w-7 h-[1.5px] bg-[#ED1C24] rounded-full" />
                <span className="text-[10px] font-bold text-[#737373] tracking-[0.22em] uppercase">
                  BY RAHI CREATIVE MEDIA
                </span>
                <span className="w-7 h-[1.5px] bg-[#ED1C24] rounded-full" />
              </div>
            </div>

            {/* Welcome Heading */}
            <div className="mb-6">
              <h3 className="text-2xl font-black text-[#171717] tracking-tight">
                Welcome back
              </h3>
              <p className="text-xs sm:text-sm text-[#737373] font-medium mt-1">
                Sign in to your workspace
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              {/* Field 1: Username or Email */}
              <div className="relative">
                <User className="w-4 h-4 text-[#737373] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Username or Email"
                  autoComplete="username"
                  required
                  className="w-full h-12 bg-white border border-stone-200 rounded-xl pl-11 pr-4 text-xs sm:text-sm text-[#171717] placeholder:text-stone-400 focus:outline-hidden focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/10 transition-all font-medium"
                />
              </div>

              {/* Field 2: Password with Show/Hide toggle */}
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 bg-white border border-stone-200 rounded-xl pl-11 pr-11 text-xs sm:text-sm text-[#171717] placeholder:text-stone-400 focus:outline-hidden focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-stone-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              </div>

              {/* Forgot Password Right Aligned Link */}
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={onOpenResetPasswordModal}
                  className="text-xs font-bold text-[#ED1C24] hover:text-[#d6151c] hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1C24]" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Primary Action Button: Pill Red #ED1C24 with Arrow */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#ED1C24] hover:bg-[#d6151c] text-white rounded-full text-sm font-bold shadow-[0_6px_20px_rgba(237,28,36,0.32)] flex items-center justify-center gap-2 transition-all mt-6 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Token / Invitation Acceptance Trigger */}
            <div className="pt-6 mt-6 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Have an invitation token?</span>
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="font-bold text-[#ED1C24] hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Claim Invitation</span>
              </button>
            </div>

            {/* Portal Architecture Security Note */}
            <div className="mt-4 pt-3 border-t border-dashed border-stone-100 text-[10px] text-stone-400 text-center leading-relaxed">
              Unified authentication automatically routes Admin, Manager, Employee, and Client accounts into their isolated workspace.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
