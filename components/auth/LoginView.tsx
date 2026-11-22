import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { InteractiveMascot, MascotState, IntroPhase } from './InteractiveMascot';
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  FastForward,
} from 'lucide-react';

interface LoginViewProps {
  allUsers: User[];
  onLogin: (user: User) => void;
  onOpenInviteModal: () => void;
  onOpenResetPasswordModal: () => void;
}

export function LoginView({
  allUsers,
  onLogin,
  onOpenInviteModal,
  onOpenResetPasswordModal,
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [introPhase, setIntroPhase] = useState<IntroPhase>('walking');

  // Fast demo user presets across all 4 portals
  const adminUser = allUsers.find((u) => u.role === 'admin') || allUsers[0];
  const managerUser = allUsers.find((u) => u.role === 'manager') || allUsers[1];
  const employeeUser =
    allUsers.find((u) => u.role === 'employee') || allUsers[2];
  const clientUser = allUsers.find((u) => u.role === 'client') || allUsers[3];

  // Cinematic Walk -> Open Briefcase -> Pop Up Login sequence
  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;

    if (introPhase === 'walking') {
      // Walk for 1.6s
      t1 = setTimeout(() => {
        setIntroPhase('opening');
      }, 1600);
    } else if (introPhase === 'opening') {
      // Open briefcase for 0.8s, then pop up login details
      t2 = setTimeout(() => {
        setIntroPhase('ready');
      }, 800);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [introPhase]);

  const handleSkipIntro = () => {
    setIntroPhase('ready');
  };

  const handleReplayIntro = () => {
    setIntroPhase('walking');
    setMascotState('idle');
  };

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      setMascotState('error');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMascotState('loading');

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
        setMascotState('success');
        setTimeout(() => {
          onLogin(data.user);
        }, 700);
      } else {
        setMascotState('error');
        setError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setMascotState('error');
      setError('A connection error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (user: User) => {
    if (user.status === 'inactive') {
      setError('This account is currently deactivated.');
      setMascotState('error');
      return;
    }
    setMascotState('success');
    setTimeout(() => {
      onLogin(user);
    }, 600);
  };

  const togglePasswordVisibility = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    if (mascotState === 'password' || mascotState === 'password-show') {
      setMascotState(nextShow ? 'password-show' : 'password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Clean White Studio Ambient Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-white via-slate-50 to-transparent pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Studio Floor Horizon Line */}
      <div className="absolute bottom-24 inset-x-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent pointer-events-none" />

      {/* Replay & Skip Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {introPhase !== 'ready' ? (
          <button
            type="button"
            onClick={handleSkipIntro}
            className="px-3 py-1.5 text-xs font-semibold bg-white/90 hover:bg-white text-slate-700 border border-slate-200 rounded-full shadow-xs hover:shadow-sm transition flex items-center gap-1.5 backdrop-blur-xs"
          >
            <FastForward className="w-3.5 h-3.5 text-slate-500" />
            <span>Skip Intro</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReplayIntro}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-xs hover:shadow-sm transition flex items-center gap-1.5"
            title="Replay Entrance & Briefcase Open"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            <span>Replay Entrance</span>
          </button>
        )}
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200 shadow-xs mb-2">
            <img
              src="/rahi-logo.png"
              alt="RAHI Creative Media"
              className="w-14 h-auto max-h-14 object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
            RAHI FLOWDESK
          </h1>
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mt-0.5">
            BY RAHI CREATIVE MEDIA
          </p>
          <p className="text-xs text-slate-500 italic mt-1">
            One Workspace. Every Creative Workflow.
          </p>
        </div>

        {/* Cinematic Stage: Walking Character + Briefcase + Pop-up Login Card */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 min-h-[460px]">
          {/* LEFT: Walking RAHI-Suited Character with Briefcase */}
          <div
            className={`w-full lg:w-88 shrink-0 flex flex-col items-center transition-all duration-1000 ease-out ${
              introPhase === 'walking'
                ? '-translate-x-14 sm:-translate-x-24 opacity-95'
                : 'translate-x-0 opacity-100'
            }`}
          >
            <InteractiveMascot
              state={mascotState}
              introPhase={introPhase}
              emailLength={email.length}
            />
          </div>

          {/* RIGHT: Login Details Card (Pops Up Out of Briefcase Reveal) */}
          <div className="w-full max-w-md">
            {introPhase !== 'ready' ? (
              // Pre-reveal Briefcase Presentation Placeholder
              <div className="bg-white/80 backdrop-blur-xs border border-dashed border-slate-300 rounded-3xl p-8 text-center flex flex-col items-center justify-center shadow-xs min-h-[380px] animate-pulse">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-3 shadow-inner">
                  <Sparkles className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {introPhase === 'walking'
                    ? "Agent Walking In with Executive Briefcase..."
                    : "Opening RAHI Briefcase..."}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  {introPhase === 'walking'
                    ? "Delivering your enterprise access credentials."
                    : "Unlocking encrypted agency keys and launching portal..."}
                </p>
                <button
                  type="button"
                  onClick={handleSkipIntro}
                  className="mt-5 text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4"
                >
                  Click to open immediately
                </button>
              </div>
            ) : (
              // REVEALED LOGIN CARD (Springs up into place!)
              <div
                className="bg-white text-slate-900 py-8 px-6 sm:px-8 border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 space-y-5"
                style={{
                  animation: 'cardSpringReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              >
                {/* Architecture Banner */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Unified Four-Portal Security Backbone</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Authenticating routes you automatically into your assigned portal.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                    <div className="text-center py-1 px-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">
                      Admin
                    </div>
                    <div className="text-center py-1 px-1.5 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-700">
                      Manager
                    </div>
                    <div className="text-center py-1 px-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700">
                      Employee
                    </div>
                    <div className="text-center py-1 px-1.5 rounded-lg bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-700">
                      Client
                    </div>
                  </div>
                </div>

                {/* Credentials Form */}
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="e.g. rohan@rahicreative.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setMascotState('email');
                    }}
                    onFocus={() => setMascotState('email')}
                    onBlur={() => {
                      if (mascotState === 'email') setMascotState('idle');
                    }}
                    required
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Password</label>
                      <button
                        type="button"
                        onClick={onOpenResetPasswordModal}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700 transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setMascotState(showPassword ? 'password-show' : 'password')}
                      onBlur={() => {
                        if (mascotState === 'password' || mascotState === 'password-show') {
                          setMascotState('idle');
                        }
                      }}
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="text-slate-400 hover:text-slate-600 focus:outline-hidden p-1 rounded-md transition"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full shadow-md hover:shadow-lg transition-all"
                    isLoading={isLoading}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In to Your Portal
                  </Button>
                </form>

                {/* Fast Testing Personas (DEV ONLY) */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-amber-200" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase">
                        <span className="bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full text-amber-800 font-bold tracking-wider">
                          DEV ONLY — Instant Portal Login
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Admin Persona */}
                        {adminUser && (
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(adminUser)}
                            className="p-2 text-left border border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition flex items-center gap-2 group"
                          >
                            <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              AD
                            </div>
                            <div className="truncate min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {adminUser.name}
                              </div>
                              <div className="text-[9px] text-indigo-700 font-semibold truncate">
                                Admin Portal
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Manager Persona */}
                        {managerUser && (
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(managerUser)}
                            className="p-2 text-left border border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition flex items-center gap-2 group"
                          >
                            <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              MG
                            </div>
                            <div className="truncate min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {managerUser.name}
                              </div>
                              <div className="text-[9px] text-blue-700 font-semibold truncate">
                                Manager Portal
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Employee Persona */}
                        {employeeUser && (
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(employeeUser)}
                            className="p-2 text-left border border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition flex items-center gap-2 group"
                          >
                            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              EM
                            </div>
                            <div className="truncate min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {employeeUser.name}
                              </div>
                              <div className="text-[9px] text-emerald-700 font-semibold truncate">
                                Employee Portal
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Client Persona */}
                        {clientUser && (
                          <button
                            type="button"
                            onClick={() => handleQuickLogin(clientUser)}
                            className="p-2 text-left border border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 rounded-xl transition flex items-center gap-2 group"
                          >
                            <div className="w-6 h-6 rounded-md bg-purple-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              CL
                            </div>
                            <div className="truncate min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {clientUser.name}
                              </div>
                              <div className="text-[9px] text-purple-700 font-semibold truncate">
                                Client Portal
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Invitation Acceptance Link Trigger */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Have an invitation token?</span>
                  <button
                    type="button"
                    onClick={onOpenInviteModal}
                    className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Claim Invitation Link</span>
                  </button>
                </div>

                {/* Security Policy Reminder */}
                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] text-slate-500 text-center leading-relaxed">
                  Strict policy enforced: No public self-registration. Passwords are never stored in plain text. Equal administrative authority shared between Admin and Manager.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
