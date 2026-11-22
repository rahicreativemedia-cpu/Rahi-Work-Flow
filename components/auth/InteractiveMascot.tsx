import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Heart, Briefcase, Unlock, ArrowRight } from 'lucide-react';

export type MascotState =
  | 'idle'
  | 'email'
  | 'password'
  | 'password-show'
  | 'loading'
  | 'success'
  | 'error';

export type IntroPhase = 'walking' | 'opening' | 'ready';

interface InteractiveMascotProps {
  state: MascotState;
  introPhase: IntroPhase;
  emailLength?: number;
  onMascotClick?: () => void;
}

export function InteractiveMascot({
  state,
  introPhase,
  emailLength = 0,
  onMascotClick,
}: InteractiveMascotProps) {
  const [blink, setBlink] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [customQuip, setCustomQuip] = useState<string | null>(null);

  // Blinking eyes interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Easter egg quotes when user taps on the character
  const handleTapMascot = () => {
    if (introPhase !== 'ready') return;
    setClickCount((prev) => prev + 1);
    const quips = [
      "Sharp RAHI suit, right? Custom tailored! 👔✨",
      "Your Flowdesk access keys are straight out of the briefcase! 💼",
      "Ready to deliver exceptional creative work today? 🚀",
      "Don't worry, I won't peek at your password! 🙈",
      "RAHI Creative Media — One Workspace, Every Workflow. ⚡",
    ];
    setCustomQuip(quips[clickCount % quips.length]);
    setTimeout(() => setCustomQuip(null), 3200);
    if (onMascotClick) onMascotClick();
  };

  // Determine speech bubble text and badge
  const getSpeechBubble = () => {
    if (introPhase === 'walking') {
      return {
        text: 'Bringing in the agency briefcase... 💼',
        color: 'text-slate-800',
        badge: 'Arriving',
      };
    }
    if (introPhase === 'opening') {
      return {
        text: 'Opening briefcase — revealing your access keys! 🔓✨',
        color: 'text-red-600',
        badge: 'Unlocking',
      };
    }
    if (customQuip) {
      return { text: customQuip, color: 'text-indigo-600', badge: 'RAHI Mascot' };
    }
    switch (state) {
      case 'email':
        return {
          text: emailLength > 0 ? `Looking good! (${emailLength} chars)` : "Enter your agency email...",
          color: 'text-blue-600',
          badge: 'Focus',
        };
      case 'password':
        return {
          text: "I promise I'm not looking! 🙈",
          color: 'text-amber-600',
          badge: 'Security',
        };
      case 'password-show':
        return {
          text: "Aha! Caught me peeking! 🫣",
          color: 'text-purple-600',
          badge: 'Peek',
        };
      case 'loading':
        return {
          text: "Verifying agency credentials... ⚡",
          color: 'text-blue-600',
          badge: 'Authenticating',
        };
      case 'success':
        return {
          text: "Access Granted! Welcome to Flowdesk! 🎉",
          color: 'text-emerald-600',
          badge: 'Approved',
        };
      case 'error':
        return {
          text: "Hmm, that didn't match. Please try again! 🤔",
          color: 'text-rose-600',
          badge: 'Attention',
        };
      case 'idle':
      default:
        return {
          text: "Welcome to RAHI Flowdesk! Sign in to get started. 👋",
          color: 'text-slate-700',
          badge: 'Ready',
        };
    }
  };

  const bubble = getSpeechBubble();

  // Eye pupil offset calculation
  let pupilX = 0;
  let pupilY = 0;
  if (introPhase === 'walking') {
    pupilX = 4;
    pupilY = 1;
  } else if (introPhase === 'opening') {
    pupilX = 2;
    pupilY = 5; // looking down at the briefcase opening!
  } else if (state === 'email') {
    pupilX = Math.min(6, 2 + Math.floor(emailLength * 0.15));
    pupilY = 4;
  } else if (state === 'loading') {
    pupilY = -3;
  } else if (state === 'error') {
    pupilY = 2;
  }

  const isWalking = introPhase === 'walking';
  const isOpening = introPhase === 'opening';
  const isReady = introPhase === 'ready';

  const isHandsCovering = isReady && state === 'password';
  const isOneHandPeeking = isReady && state === 'password-show';
  const isSuccess = isReady && state === 'success';
  const isError = isReady && state === 'error';

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[320px] sm:max-w-[360px] mx-auto relative">
      {/* Dynamic Speech Bubble */}
      <div className="w-full mb-2 px-2 transition-all duration-300 transform scale-100">
        <div className="relative bg-white border border-slate-200 rounded-2xl p-3 shadow-md shadow-slate-200/60 text-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-500 inline" />
              {bubble.badge}
            </span>
            <span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-bold px-1.5 py-0.5 rounded-full">
              RAHI SUIT
            </span>
          </div>
          <p className={`text-xs font-bold leading-snug transition-colors duration-200 ${bubble.color}`}>
            {bubble.text}
          </p>
          {/* Bubble Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r border-b border-slate-200 rotate-45" />
        </div>
      </div>

      {/* Mascot Stage */}
      <div
        onClick={handleTapMascot}
        className={`relative ${
          isReady ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
        } transition-transform duration-300`}
        title={isReady ? 'Click me!' : undefined}
      >
        <svg
          viewBox="0 0 360 400"
          className="w-64 h-auto sm:w-72 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Skin Gradient */}
            <linearGradient id="skinGrad" x1="120" y1="80" x2="200" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>

            {/* Hair Gradient */}
            <linearGradient id="hairGrad" x1="110" y1="50" x2="210" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* RAHI Executive Suit Fabric Gradient */}
            <linearGradient id="suitGrad" x1="100" y1="210" x2="220" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="40%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* RAHI Crimson Red Gradient */}
            <linearGradient id="rahiRedGrad" x1="150" y1="220" x2="170" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>

            {/* Briefcase Leather Gradient */}
            <linearGradient id="caseLeatherGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="60%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Velvet Interior of Briefcase */}
            <linearGradient id="velvetGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#991B1B" />
              <stop offset="100%" stopColor="#450A0A" />
            </linearGradient>

            {/* Briefcase Beam Glow */}
            <linearGradient id="beamGrad" x1="0" y1="1" x2="0.3" y2="0">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </linearGradient>

            {/* Eye Iris Gradient */}
            <linearGradient id="irisGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Dynamic Floor Shadow on Clean White Studio Ground */}
          <ellipse
            cx={isWalking ? "160" : "160"}
            cy="375"
            rx={isSuccess ? "85" : "75"}
            ry="11"
            fill="#64748B"
            opacity="0.22"
            className="transition-all duration-300"
          />

          {/* RADIANT BEAM FROM OPENED BRIEFCASE (When opening & ready) */}
          {(isOpening || isReady) && (
            <g id="briefcase-glow-beam" className="animate-in fade-in duration-500">
              <polygon
                points="245,335 295,335 340,160 210,160"
                fill="url(#beamGrad)"
                className="opacity-75"
                style={{
                  animation: 'beamRise 0.7s ease-out forwards',
                  transformOrigin: '270px 335px',
                }}
              />
              {/* Floating particles from briefcase */}
              <circle cx="250" cy="270" r="2.5" fill="#EF4444" className="animate-pulse" />
              <circle cx="280" cy="230" r="3" fill="#60A5FA" className="animate-ping" />
              <circle cx="265" cy="190" r="2" fill="#FCD34D" />
              <circle cx="300" cy="180" r="2.5" fill="#EF4444" />
            </g>
          )}

          {/* CHARACTER CONTAINER (Walks in if isWalking) */}
          <g
            id="character-root"
            className="transition-transform duration-700 ease-out"
            style={{
              animation: isWalking ? 'walkBob 0.45s ease-in-out infinite' : undefined,
            }}
          >
            {/* LEGS & WALKING STRIDE */}
            <g id="legs">
              {/* Left Leg */}
              <g
                id="left-leg"
                style={{
                  transformOrigin: '142px 280px',
                  animation: isWalking ? 'walkStrideLeft 0.5s ease-in-out infinite' : undefined,
                }}
              >
                <rect x="134" y="278" width="20" height="82" rx="6" fill="#0F172A" />
                {/* Left Oxford Shoe */}
                <path
                  d="M125 354 C125 348 142 347 156 350 L156 366 C143 367 125 367 125 354 Z"
                  fill="#020617"
                />
                <rect x="125" y="362" width="31" height="4" rx="2" fill="#EF4444" />
              </g>

              {/* Right Leg */}
              <g
                id="right-leg"
                style={{
                  transformOrigin: '172px 280px',
                  animation: isWalking ? 'walkStrideRight 0.5s ease-in-out infinite' : undefined,
                }}
              >
                <rect x="164" y="278" width="20" height="82" rx="6" fill="#0F172A" />
                {/* Right Oxford Shoe */}
                <path
                  d="M164 350 C178 347 195 348 195 354 C195 367 177 367 164 366 Z"
                  fill="#020617"
                />
                <rect x="164" y="362" width="31" height="4" rx="2" fill="#EF4444" />
              </g>
            </g>

            {/* TORSO: CUSTOM RAHI EXECUTIVE SUIT */}
            <g id="torso">
              {/* Tailored Suit Jacket */}
              <path
                d="M112 195 L134 160 C144 158 176 158 186 160 L208 195 L210 286 C180 292 140 292 110 286 Z"
                fill="url(#suitGrad)"
              />

              {/* White Collared Shirt V-Neck */}
              <polygon points="144,160 176,160 160,228" fill="#FFFFFF" />

              {/* RAHI Crimson Red Necktie */}
              <polygon points="156,168 164,168 167,222 160,238 153,222" fill="url(#rahiRedGrad)" />

              {/* Suit Lapels */}
              <polygon points="134,160 148,206 124,216" fill="#1E293B" opacity="0.9" />
              <polygon points="186,160 172,206 196,216" fill="#1E293B" opacity="0.9" />

              {/* RAHI CREATIVE MEDIA EMBROIDERED LAPEL EMBLEM */}
              {/* Black rounded pin with stylized white R and red slash */}
              <g transform="translate(133, 204)">
                <rect x="0" y="0" width="13" height="13" rx="3.5" fill="#020617" stroke="#334155" strokeWidth="0.8" />
                {/* Stylized R in miniature */}
                <path d="M3 3 H7.5 C8.8 3 9.8 4 9.8 5.2 C9.8 6.5 8.8 7.5 7.5 7.5 H5.5 L9.5 10.5 H7.8 L4.5 7.5 V10.5 H3 Z" fill="#FFFFFF" />
                {/* Red Slash Accent */}
                <polygon points="2,8.8 3.8,7.2 4.6,8.2 2.8,9.8" fill="#EF4444" />
              </g>

              {/* Breast Pocket Handkerchief with RAHI Red Peak */}
              <rect x="180" y="210" width="14" height="2" rx="1" fill="#334155" />
              <polygon points="184,210 188,204 191,210" fill="#EF4444" />
            </g>

            {/* Neck */}
            <rect x="151" y="142" width="18" height="22" rx="4" fill="#FDBA74" />
            <path d="M151 146 Q160 152 169 146 L169 152 Q160 158 151 152 Z" fill="#EA580C" opacity="0.25" />

            {/* HEAD & EXPRESSIVE FACE */}
            <g
              id="head"
              className={`transition-all duration-300 origin-center ${
                isOpening
                  ? 'rotate-3 translate-y-1'
                  : state === 'email'
                  ? 'rotate-2 translate-x-1 translate-y-0.5'
                  : state === 'error'
                  ? '-rotate-2 translate-y-1'
                  : ''
              }`}
            >
              {/* Ears */}
              <circle cx="112" cy="116" r="9" fill="#FED7AA" />
              <circle cx="208" cy="116" r="9" fill="#FED7AA" />
              <circle cx="112" cy="116" r="5" fill="#FDBA74" opacity="0.5" />
              <circle cx="208" cy="116" r="5" fill="#FDBA74" opacity="0.5" />

              {/* Face Shape */}
              <ellipse cx="160" cy="116" rx="45" ry="48" fill="url(#skinGrad)" />

              {/* Blush Cheeks */}
              <circle cx="132" cy="126" r="7" fill="#F43F5E" opacity="0.22" />
              <circle cx="188" cy="126" r="7" fill="#F43F5E" opacity="0.22" />

              {/* Modern Agency Undercut Hair */}
              <path
                d="M112 110 C108 72 135 48 160 48 C192 48 214 66 210 108 C206 95 198 84 186 82 C172 80 162 88 150 82 C138 76 126 84 116 98 Z"
                fill="url(#hairGrad)"
              />
              <path
                d="M136 58 C155 52 178 54 192 68 C176 60 152 60 136 58 Z"
                fill="#475569"
                opacity="0.5"
              />

              {/* Eyebrows */}
              <g
                id="eyebrows"
                className={`transition-transform duration-300 ${
                  isSuccess
                    ? '-translate-y-2'
                    : isHandsCovering
                    ? 'translate-y-1 rotate-3'
                    : isError
                    ? 'translate-y-1'
                    : ''
                }`}
              >
                <path d="M128 96 Q139 90 149 95" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M171 95 Q181 90 192 96" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" />
              </g>

              {/* Eyes & Pupils */}
              <g id="eyes">
                {/* Left Eye */}
                <g>
                  <ellipse cx="138" cy="112" rx="11" ry="13" fill="#FFFFFF" />
                  <g
                    style={{
                      transform: `translate(${pupilX}px, ${pupilY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <ellipse cx="138" cy="112" rx="7.5" ry="8" fill="url(#irisGrad)" />
                    <circle cx="138" cy="112" r="4.5" fill="#0F172A" />
                    <circle cx="136" cy="109" r="2.2" fill="#FFFFFF" />
                    <circle cx="140" cy="114" r="1.2" fill="#FFFFFF" />
                  </g>
                  {/* Blink */}
                  <rect
                    x="126"
                    y="98"
                    width="24"
                    height="28"
                    fill="url(#skinGrad)"
                    className={`transition-all duration-100 origin-top ${
                      blink && !isHandsCovering ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                    }`}
                  />
                  <ellipse cx="138" cy="112" rx="11" ry="13" stroke="#1E293B" strokeWidth="1.2" fill="none" opacity="0.3" />
                </g>

                {/* Right Eye */}
                <g>
                  <ellipse cx="182" cy="112" rx="11" ry="13" fill="#FFFFFF" />
                  <g
                    style={{
                      transform: `translate(${pupilX}px, ${pupilY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <ellipse cx="182" cy="112" rx="7.5" ry="8" fill="url(#irisGrad)" />
                    <circle cx="182" cy="112" r="4.5" fill="#0F172A" />
                    <circle cx="180" cy="109" r="2.2" fill="#FFFFFF" />
                    <circle cx="184" cy="114" r="1.2" fill="#FFFFFF" />
                  </g>
                  {/* Blink */}
                  <rect
                    x="170"
                    y="98"
                    width="24"
                    height="28"
                    fill="url(#skinGrad)"
                    className={`transition-all duration-100 origin-top ${
                      blink && !isHandsCovering && !isOneHandPeeking
                        ? 'scale-y-100 opacity-100'
                        : 'scale-y-0 opacity-0'
                    }`}
                  />
                  <ellipse cx="182" cy="112" rx="11" ry="13" stroke="#1E293B" strokeWidth="1.2" fill="none" opacity="0.3" />
                </g>
              </g>

              {/* Nose */}
              <path d="M158 118 Q160 124 163 124" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Mouth */}
              <g id="mouth">
                {isSuccess ? (
                  <path d="M148 134 Q160 152 172 134 Z" fill="#BE123C" stroke="#881337" strokeWidth="1.5" />
                ) : isHandsCovering || isOneHandPeeking ? (
                  <path d="M152 136 Q160 142 168 136" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : isOpening ? (
                  // Open excited mouth when opening the case
                  <ellipse cx="160" cy="138" rx="6" ry="4" fill="#BE123C" />
                ) : isError ? (
                  <path d="M150 142 Q160 135 170 142" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                ) : (
                  <path d="M150 134 Q160 144 170 134" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                )}
              </g>
            </g>

            {/* LEFT ARM & HAND */}
            <g
              id="left-arm"
              style={{
                transformOrigin: '112px 195px',
                transform: isSuccess
                  ? 'rotate(-85deg) translate(-10px, -20px)'
                  : isHandsCovering || isOneHandPeeking
                  ? 'rotate(-55deg) translate(30px, -70px)'
                  : isWalking
                  ? 'rotate(20deg) translate(-5px, 0px)'
                  : isError
                  ? 'rotate(-25deg) translate(10px, 0px)'
                  : 'rotate(0deg)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <path d="M112 195 L92 250 L105 255 L123 200 Z" fill="url(#suitGrad)" />
              <rect x="91" y="249" width="15" height="5" rx="1" fill="#FFFFFF" />
              <ellipse cx="97" cy="260" rx="7" ry="8" fill="#FDBA74" />
            </g>

            {/* RIGHT ARM & HAND (Carrying / Opening Briefcase) */}
            <g
              id="right-arm"
              style={{
                transformOrigin: '208px 195px',
                transform: isSuccess
                  ? 'rotate(85deg) translate(10px, -20px)'
                  : isHandsCovering
                  ? 'rotate(55deg) translate(-30px, -70px)'
                  : isOneHandPeeking
                  ? 'rotate(30deg) translate(-15px, -30px)'
                  : isWalking
                  ? 'rotate(-20deg) translate(5px, 5px)' // swinging while walking
                  : isOpening
                  ? 'rotate(25deg) translate(15px, 20px)' // presenting the briefcase
                  : state === 'email'
                  ? 'rotate(25deg) translate(8px, -15px)' // pointing towards form
                  : 'rotate(5deg)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <path d="M208 195 L228 250 L215 255 L197 200 Z" fill="url(#suitGrad)" />
              <rect x="214" y="249" width="15" height="5" rx="1" fill="#FFFFFF" />
              <ellipse cx="223" cy="260" rx="7" ry="8" fill="#FDBA74" />

              {/* BRIEFCASE WHEN CARRIED IN HAND (During walk) */}
              {isWalking && (
                <g id="carried-briefcase" transform="translate(205, 260) rotate(-6)">
                  {/* Briefcase Handle */}
                  <path d="M18 0 C18 -7 32 -7 32 0" stroke="#94A3B8" strokeWidth="3" fill="none" />
                  {/* Case Body */}
                  <rect x="0" y="0" width="52" height="38" rx="4" fill="url(#caseLeatherGrad)" stroke="#475569" strokeWidth="1" />
                  {/* Metallic Corners */}
                  <path d="M0 6 L0 0 L6 0" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                  <path d="M46 0 L52 0 L52 6" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                  <path d="M0 32 L0 38 L6 38" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                  <path d="M46 38 L52 38 L52 32" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
                  {/* Latches */}
                  <rect x="12" y="8" width="5" height="6" rx="1" fill="#FCD34D" />
                  <rect x="35" y="8" width="5" height="6" rx="1" fill="#FCD34D" />
                  {/* RAHI Red Leather Stripe */}
                  <rect x="0" y="16" width="52" height="5" fill="#EF4444" />
                  <text x="26" y="20" textAnchor="middle" fill="#FFFFFF" fontSize="3.8" fontWeight="bold">RAHI</text>
                </g>
              )}
            </g>

            {/* BRIEFCASE ON THE FLOOR (When arrived: opening & ready) */}
            {(isOpening || isReady) && (
              <g
                id="opened-briefcase"
                transform="translate(225, 315)"
                className="animate-in fade-in duration-300"
              >
                {/* Briefcase Shadow */}
                <ellipse cx="36" cy="46" rx="40" ry="6" fill="#64748B" opacity="0.3" />

                {/* Briefcase Lower Shell (Base) */}
                <rect x="0" y="14" width="72" height="30" rx="3" fill="url(#caseLeatherGrad)" stroke="#334155" strokeWidth="1" />
                {/* Velvet Tray */}
                <rect x="3" y="16" width="66" height="26" rx="2" fill="url(#velvetGrad)" />

                {/* Glowing Holographic Folder inside Briefcase */}
                <rect x="8" y="20" width="56" height="18" rx="2" fill="#0F172A" stroke="#60A5FA" strokeWidth="1" />
                <rect x="12" y="24" width="22" height="3" rx="1" fill="#60A5FA" />
                <rect x="12" y="29" width="36" height="2" rx="1" fill="#93C5FD" opacity="0.8" />
                <circle cx="56" cy="29" r="4" fill="#EF4444" />

                {/* BRIEFCASE UPPER LID (Flipped Open Upwards) */}
                <g
                  style={{
                    transformOrigin: '0px 14px',
                    animation: isOpening ? 'briefcaseLidOpen 0.6s ease-out forwards' : undefined,
                    transform: isReady ? 'rotate(-105deg)' : undefined,
                  }}
                >
                  <rect x="0" y="0" width="72" height="14" rx="2" fill="url(#caseLeatherGrad)" stroke="#475569" strokeWidth="1" />
                  {/* RAHI Signature Stripe on Lid */}
                  <rect x="0" y="4" width="72" height="3" fill="#EF4444" />
                  {/* Brass Latches */}
                  <rect x="16" y="10" width="6" height="4" rx="1" fill="#FCD34D" />
                  <rect x="50" y="10" width="6" height="4" rx="1" fill="#FCD34D" />
                </g>
              </g>
            )}

            {/* COVER-EYES HANDS OVERLAY (When password focused) */}
            {(isHandsCovering || isOneHandPeeking) && (
              <g id="covering-hands" className="animate-in fade-in zoom-in-95 duration-200">
                {/* Left hand covering left eye */}
                <g transform="translate(136, 110)">
                  <ellipse cx="0" cy="0" rx="14" ry="12" fill="#FDBA74" />
                  <rect x="-12" y="-14" width="5.5" height="15" rx="2.5" fill="#FED7AA" />
                  <rect x="-5" y="-17" width="5.5" height="18" rx="2.5" fill="#FED7AA" />
                  <rect x="2" y="-16" width="5.5" height="17" rx="2.5" fill="#FED7AA" />
                  <rect x="9" y="-13" width="5" height="14" rx="2.5" fill="#FED7AA" />
                </g>

                {/* Right hand covering right eye (only when not peeking) */}
                {isHandsCovering && (
                  <g transform="translate(184, 110)">
                    <ellipse cx="0" cy="0" rx="14" ry="12" fill="#FDBA74" />
                    <rect x="-14" y="-13" width="5" height="14" rx="2.5" fill="#FED7AA" />
                    <rect x="-7" y="-16" width="5.5" height="17" rx="2.5" fill="#FED7AA" />
                    <rect x="0" y="-17" width="5.5" height="18" rx="2.5" fill="#FED7AA" />
                    <rect x="7" y="-14" width="5.5" height="15" rx="2.5" fill="#FED7AA" />
                  </g>
                )}
              </g>
            )}

            {/* Victory Confetti on Success */}
            {isSuccess && (
              <g id="celebration-sparks" className="animate-in zoom-in duration-300">
                <circle cx="90" cy="70" r="4" fill="#F59E0B" />
                <circle cx="230" cy="65" r="4" fill="#EF4444" />
                <polygon points="110,40 113,48 121,50 114,55 116,63 109,58 102,62 105,54 99,49 107,48" fill="#10B981" />
                <polygon points="210,40 213,48 221,50 214,55 216,63 209,58 202,62 205,54 199,49 207,48" fill="#3B82F6" />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* Helper Tag */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-slate-500 font-semibold inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
          <Briefcase className="w-3 h-3 text-red-500" />
          RAHI Executive Suite • Interactive Agency Mascot
        </span>
      </div>
    </div>
  );
}
