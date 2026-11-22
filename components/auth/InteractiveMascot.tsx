import React, { useState, useEffect } from 'react';
import { Sparkles, Shield, Heart, Laugh } from 'lucide-react';

export type MascotState =
  | 'idle'
  | 'email'
  | 'password'
  | 'password-show'
  | 'loading'
  | 'success'
  | 'error';

interface InteractiveMascotProps {
  state: MascotState;
  emailLength?: number;
  onMascotClick?: () => void;
}

export function InteractiveMascot({
  state,
  emailLength = 0,
  onMascotClick,
}: InteractiveMascotProps) {
  const [blink, setBlink] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [customQuip, setCustomQuip] = useState<string | null>(null);

  // Natural blinking interval
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3600);
    return () => clearInterval(blinkInterval);
  }, []);

  // Easter egg quotes when user taps on the character
  const handleTapMascot = () => {
    setClickCount((prev) => prev + 1);
    const quips = [
      "Hi! I'm Rohan from RAHI Creative! 👋",
      "Ready to ship creative magic today? ✨",
      "Don't worry, all client portals are 100% isolated! 🛡️",
      "Hey! Tickling won't bypass the rate limiter! 😄",
      "RAHI Flowdesk: One Workspace, Every Creative Workflow! 🚀",
    ];
    setCustomQuip(quips[clickCount % quips.length]);
    setTimeout(() => setCustomQuip(null), 3200);
    if (onMascotClick) onMascotClick();
  };

  // Determine speech bubble text and icon
  const getSpeechBubble = () => {
    if (customQuip) {
      return { text: customQuip, color: 'text-indigo-600', badge: 'Creative Mascot' };
    }
    switch (state) {
      case 'email':
        return {
          text: emailLength > 0 ? `Looking good! (${emailLength} chars)` : "Enter your agency email address...",
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
          text: "Authenticating your permissions... ⚡",
          color: 'text-blue-600',
          badge: 'Verifying',
        };
      case 'success':
        return {
          text: "Welcome back! Entering your portal... 🎉",
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
          badge: 'RAHI Flowdesk',
        };
    }
  };

  const bubble = getSpeechBubble();

  // Eye pupil offset calculation
  let pupilX = 0;
  let pupilY = 0;
  if (state === 'email') {
    pupilX = Math.min(6, 2 + Math.floor(emailLength * 0.15));
    pupilY = 4;
  } else if (state === 'loading') {
    pupilY = -3;
  } else if (state === 'error') {
    pupilY = 2;
  }

  // Cover-eyes hands animation logic
  const isHandsCovering = state === 'password';
  const isOneHandPeeking = state === 'password-show';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[280px] sm:max-w-[320px] mx-auto">
      {/* Speech Bubble */}
      <div className="w-full mb-3 px-2 transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-bottom-2">
        <div className="relative bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-lg shadow-slate-200/50 text-center">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-500 inline" />
              {bubble.badge}
            </span>
            <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded-full">
              RAHI 3D
            </span>
          </div>
          <p className={`text-xs font-bold leading-snug transition-colors duration-200 ${bubble.color}`}>
            {bubble.text}
          </p>
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-r border-b border-slate-200/90 rotate-45" />
        </div>
      </div>

      {/* 3D Character Canvas */}
      <div
        onClick={handleTapMascot}
        className="relative cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
        title="Click me!"
      >
        <svg
          viewBox="0 0 320 380"
          className="w-56 h-auto sm:w-64 drop-shadow-xl"
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

            {/* Suit Gradient */}
            <linearGradient id="suitGrad" x1="100" y1="210" x2="220" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#090D16" />
            </linearGradient>

            {/* RAHI Crimson Accent Gradient */}
            <linearGradient id="rahiRedGrad" x1="150" y1="220" x2="170" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#B91C1C" />
            </linearGradient>

            {/* Eye Iris Gradient */}
            <linearGradient id="irisGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dynamic Floor Shadow */}
          <ellipse
            cx="160"
            cy="365"
            rx={isSuccess ? "80" : "68"}
            ry="11"
            fill="#0F172A"
            opacity={isSuccess ? "0.1" : "0.18"}
            className="transition-all duration-300"
          />

          {/* MAIN CHARACTER BODY GROUP (Breathing & Floating Animation) */}
          <g
            className={`transition-transform duration-500 ease-out origin-bottom ${
              isSuccess ? '-translate-y-4' : isError ? 'translate-y-0.5' : 'hover:-translate-y-1'
            }`}
          >
            {/* Legs */}
            <g id="legs">
              {/* Left Leg */}
              <rect x="134" y="275" width="22" height="78" rx="6" fill="#1E293B" />
              {/* Right Leg */}
              <rect x="164" y="275" width="22" height="78" rx="6" fill="#1E293B" />
              {/* Left Shoe */}
              <path
                d="M126 348 C126 342 142 342 156 345 L156 358 C144 359 126 359 126 348 Z"
                fill="#0F172A"
              />
              <rect x="126" y="354" width="30" height="4" rx="2" fill="#EF4444" />
              {/* Right Shoe */}
              <path
                d="M164 345 C178 342 194 342 194 348 C194 359 176 359 164 358 Z"
                fill="#0F172A"
              />
              <rect x="164" y="354" width="30" height="4" rx="2" fill="#EF4444" />
            </g>

            {/* Torso & Suit */}
            <g id="torso">
              {/* Blazer Body */}
              <path
                d="M115 190 L135 158 C145 156 175 156 185 158 L205 190 L208 280 C180 285 140 285 112 280 Z"
                fill="url(#suitGrad)"
              />

              {/* White Dress Shirt V-Neck */}
              <polygon points="144,158 176,158 160,225" fill="#F8FAFC" />

              {/* RAHI Crimson Red Tie */}
              <polygon points="156,168 164,168 166,220 160,234 154,220" fill="url(#rahiRedGrad)" />

              {/* Lapels */}
              <polygon points="135,158 148,198 126,208" fill="#334155" opacity="0.6" />
              <polygon points="185,158 172,198 194,208" fill="#334155" opacity="0.6" />

              {/* RAHI Creative Media Lapel Badge */}
              <circle cx="138" cy="195" r="4.5" fill="#EF4444" />
              <path d="M136 193 L140 195 L136 197 Z" fill="#FFFFFF" />
            </g>

            {/* Neck */}
            <rect x="151" y="142" width="18" height="20" rx="4" fill="#FDBA74" />
            {/* Neck Shadow */}
            <path d="M151 146 Q160 152 169 146 L169 152 Q160 158 151 152 Z" fill="#EA580C" opacity="0.3" />

            {/* Head & Face */}
            <g
              id="head"
              className={`transition-all duration-300 origin-center ${
                state === 'email'
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
              <circle cx="132" cy="126" r="7" fill="#F43F5E" opacity="0.25" />
              <circle cx="188" cy="126" r="7" fill="#F43F5E" opacity="0.25" />

              {/* Modern Sleek Undercut Hair (Back & Top) */}
              <path
                d="M112 110 C108 72 135 48 160 48 C192 48 214 66 210 108 C206 95 198 84 186 82 C172 80 162 88 150 82 C138 76 126 84 116 98 Z"
                fill="url(#hairGrad)"
              />
              {/* Hair Highlights */}
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
                {/* Left Eyebrow */}
                <path
                  d="M128 96 Q139 90 149 95"
                  stroke="#1E293B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {/* Right Eyebrow */}
                <path
                  d="M171 95 Q181 90 192 96"
                  stroke="#1E293B"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </g>

              {/* EYES (Interactive Tracking & Blinking) */}
              <g id="eyes">
                {/* Left Eye */}
                <g className="transition-transform duration-100">
                  <ellipse cx="138" cy="112" rx="11" ry="13" fill="#FFFFFF" />
                  {/* Left Pupil */}
                  <g
                    style={{
                      transform: `translate(${pupilX}px, ${pupilY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <ellipse cx="138" cy="112" rx="7.5" ry="8" fill="url(#irisGrad)" />
                    <circle cx="138" cy="112" r="4.5" fill="#0F172A" />
                    {/* Specular highlights */}
                    <circle cx="136" cy="109" r="2.2" fill="#FFFFFF" />
                    <circle cx="140" cy="114" r="1.2" fill="#FFFFFF" />
                  </g>
                  {/* Left Eyelid Blink */}
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
                  <ellipse
                    cx="138"
                    cy="112"
                    rx="11"
                    ry="13"
                    stroke="#1E293B"
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.4"
                  />
                </g>

                {/* Right Eye */}
                <g className="transition-transform duration-100">
                  <ellipse cx="182" cy="112" rx="11" ry="13" fill="#FFFFFF" />
                  {/* Right Pupil */}
                  <g
                    style={{
                      transform: `translate(${pupilX}px, ${pupilY}px)`,
                      transition: 'transform 0.15s ease-out',
                    }}
                  >
                    <ellipse cx="182" cy="112" rx="7.5" ry="8" fill="url(#irisGrad)" />
                    <circle cx="182" cy="112" r="4.5" fill="#0F172A" />
                    {/* Specular highlights */}
                    <circle cx="180" cy="109" r="2.2" fill="#FFFFFF" />
                    <circle cx="184" cy="114" r="1.2" fill="#FFFFFF" />
                  </g>
                  {/* Right Eyelid Blink */}
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
                  <ellipse
                    cx="182"
                    cy="112"
                    rx="11"
                    ry="13"
                    stroke="#1E293B"
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.4"
                  />
                </g>
              </g>

              {/* Nose */}
              <path
                d="M158 118 Q160 124 163 124"
                stroke="#EA580C"
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Mouth (Dynamic States) */}
              <g id="mouth" className="transition-all duration-300">
                {isSuccess ? (
                  // Big beaming smile
                  <path
                    d="M148 134 Q160 152 172 134 Z"
                    fill="#BE123C"
                    stroke="#881337"
                    strokeWidth="1.5"
                  />
                ) : isHandsCovering || isOneHandPeeking ? (
                  // Shy coy smile
                  <path
                    d="M152 136 Q160 142 168 136"
                    stroke="#881337"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : isError ? (
                  // Pout / Wobbly line
                  <path
                    d="M150 142 Q160 135 170 142"
                    stroke="#881337"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : (
                  // Gentle friendly smile
                  <path
                    d="M150 134 Q160 144 170 134"
                    stroke="#881337"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </g>
            </g>

            {/* ARMS & HANDS (The Interactive Showcase!) */}

            {/* LEFT ARM & HAND */}
            <g
              id="left-arm"
              style={{
                transformOrigin: '115px 190px',
                transform: isSuccess
                  ? 'rotate(-85deg) translate(-10px, -20px)'
                  : isHandsCovering || isOneHandPeeking
                  ? 'rotate(-55deg) translate(30px, -70px)'
                  : isError
                  ? 'rotate(-25deg) translate(10px, 0px)'
                  : 'rotate(0deg)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Sleeve */}
              <path
                d="M115 190 L95 245 L108 250 L126 195 Z"
                fill="url(#suitGrad)"
              />
              {/* Cuff */}
              <rect x="94" y="244" width="15" height="5" rx="1" fill="#FFFFFF" />
              {/* Left Hand */}
              <ellipse cx="100" cy="255" rx="7" ry="8" fill="#FDBA74" />
              {/* Fingers */}
              <circle cx="96" cy="258" r="2.8" fill="#FDBA74" />
              <circle cx="100" cy="261" r="2.8" fill="#FDBA74" />
              <circle cx="104" cy="258" r="2.8" fill="#FDBA74" />
            </g>

            {/* RIGHT ARM & HAND */}
            <g
              id="right-arm"
              style={{
                transformOrigin: '205px 190px',
                transform: isSuccess
                  ? 'rotate(85deg) translate(10px, -20px)'
                  : isHandsCovering
                  ? 'rotate(55deg) translate(-30px, -70px)'
                  : isOneHandPeeking
                  ? 'rotate(30deg) translate(-15px, -30px)' // Peek down!
                  : state === 'email'
                  ? 'rotate(25deg) translate(8px, -15px)' // Pointing right!
                  : isError
                  ? 'rotate(25deg) translate(-10px, 0px)'
                  : 'rotate(0deg)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {/* Sleeve */}
              <path
                d="M205 190 L225 245 L212 250 L194 195 Z"
                fill="url(#suitGrad)"
              />
              {/* Cuff */}
              <rect x="211" y="244" width="15" height="5" rx="1" fill="#FFFFFF" />
              {/* Right Hand */}
              <ellipse cx="220" cy="255" rx="7" ry="8" fill="#FDBA74" />
              {/* Fingers */}
              <circle cx="216" cy="258" r="2.8" fill="#FDBA74" />
              <circle cx="220" cy="261" r="2.8" fill="#FDBA74" />
              <circle cx="224" cy="258" r="2.8" fill="#FDBA74" />
            </g>

            {/* SPECIAL COVER-EYES HANDS OVERLAY (Renders on top of face when covering eyes) */}
            {(isHandsCovering || isOneHandPeeking) && (
              <g id="covering-hands" className="animate-in fade-in zoom-in-95 duration-200">
                {/* Left hand covering left eye */}
                <g transform="translate(136, 110)">
                  {/* Palm */}
                  <ellipse cx="0" cy="0" rx="14" ry="12" fill="#FDBA74" />
                  {/* Fingers spread over eye */}
                  <rect x="-12" y="-14" width="5.5" height="15" rx="2.5" fill="#FED7AA" />
                  <rect x="-5" y="-17" width="5.5" height="18" rx="2.5" fill="#FED7AA" />
                  <rect x="2" y="-16" width="5.5" height="17" rx="2.5" fill="#FED7AA" />
                  <rect x="9" y="-13" width="5" height="14" rx="2.5" fill="#FED7AA" />
                </g>

                {/* Right hand covering right eye (only when not peeking) */}
                {isHandsCovering && (
                  <g transform="translate(184, 110)">
                    {/* Palm */}
                    <ellipse cx="0" cy="0" rx="14" ry="12" fill="#FDBA74" />
                    {/* Fingers spread over eye */}
                    <rect x="-14" y="-13" width="5" height="14" rx="2.5" fill="#FED7AA" />
                    <rect x="-7" y="-16" width="5.5" height="17" rx="2.5" fill="#FED7AA" />
                    <rect x="0" y="-17" width="5.5" height="18" rx="2.5" fill="#FED7AA" />
                    <rect x="7" y="-14" width="5.5" height="15" rx="2.5" fill="#FED7AA" />
                  </g>
                )}
              </g>
            )}

            {/* Celebratory Confetti / Stars on Success */}
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

      {/* Interactive Helper Hint */}
      <div className="mt-2 text-center">
        <span className="text-[10px] text-slate-400 font-medium inline-flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60">
          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          Interactive Agency Mascot • Tap to interact
        </span>
      </div>
    </div>
  );
}
