import React, { useEffect, useState } from 'react';
import { SmartBudgetLogo } from './SmartBudgetLogo';

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onFinish,
  minDurationMs = 900,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, minDurationMs);

    const timerRemove = setTimeout(() => {
      setIsRemoved(true);
      if (onFinish) onFinish();
    }, minDurationMs + 350);

    return () => {
      clearTimeout(timerFade);
      clearTimeout(timerRemove);
    };
  }, [minDurationMs, onFinish]);

  if (isRemoved) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-350 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Centered Minimal Brand */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <SmartBudgetLogo size={84} animated={true} />

        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Smart<span className="text-emerald-400">Budget</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5">
            100% Hors-Ligne
          </p>
        </div>

        {/* Minimalist Spinner */}
        <div className="pt-2">
          <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
};
