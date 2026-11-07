import React from 'react';

interface SmartBudgetLogoProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

export const SmartBudgetLogo: React.FC<SmartBudgetLogoProps> = ({
  size = 'md',
  animated = false,
  showText = false,
  className = '',
}) => {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 24
      : size === 'sm'
      ? 32
      : size === 'md'
      ? 44
      : size === 'lg'
      ? 64
      : size === 'xl'
      ? 96
      : 128;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          animated ? 'transition-transform duration-500 hover:scale-105' : ''
        }`}
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* Glow halo */}
        {animated && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-400/30 blur-md animate-pulse" />
        )}

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sb-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="sb-accent-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>

            <linearGradient id="sb-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <filter id="sb-inner-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
              <feFlood floodColor="#34d399" floodOpacity="0.4" />
              <feComposite in2="shadowDiff" operator="in" />
              <feComposite in2="SourceGraphic" operator="over" />
            </filter>
          </defs>

          {/* Rounded Squircle Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            fill="url(#sb-bg-grad)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="2"
          />

          {/* Subtle Grid Pattern Overlay */}
          <circle cx="50" cy="50" r="34" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Stylized Geometric Smart "S" Financial Vault Icon */}
          {/* Top curve / upper loop of S */}
          <path
            d="M66 32 C66 25 58 20 48 20 C36 20 28 27 28 36 C28 47 40 49 52 52 C65 55 72 59 72 68 C72 79 62 84 50 84 C36 84 28 78 27 68"
            stroke="url(#sb-accent-grad)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upward Ascending Growth Bar 1 */}
          <rect x="36" y="58" width="5" height="12" rx="2.5" fill="rgba(255, 255, 255, 0.35)" />
          {/* Upward Ascending Growth Bar 2 */}
          <rect x="47" y="50" width="5" height="20" rx="2.5" fill="rgba(255, 255, 255, 0.55)" />
          {/* Upward Ascending Growth Bar 3 */}
          <rect x="58" y="40" width="5" height="30" rx="2.5" fill="url(#sb-gold-grad)" />

          {/* Dynamic Sparkle Node */}
          <path
            d="M74 24 L76 29 L81 31 L76 33 L74 38 L72 33 L67 31 L72 29 Z"
            fill="url(#sb-gold-grad)"
            className={animated ? 'animate-pulse' : ''}
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold tracking-tight text-slate-900 dark:text-white leading-none text-lg">
            Smart<span className="text-emerald-700">Budget</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-800">
            Finances Hors-Ligne
          </span>
        </div>
      )}
    </div>
  );
};

