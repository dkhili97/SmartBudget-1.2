import React, { useEffect, useState } from 'react';
import { SmartBudgetLogo } from './SmartBudgetLogo';

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onFinish,
  minDurationMs = 700,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Smooth minimalist progress animation
    const timerProgress1 = setTimeout(() => setProgress(65), 180);
    const timerProgress2 = setTimeout(() => setProgress(100), 450);

    const timerFade = setTimeout(() => {
      setIsFadingOut(true);
    }, minDurationMs);

    const timerRemove = setTimeout(() => {
      setIsRemoved(true);
      if (onFinish) onFinish();
    }, minDurationMs + 250);

    return () => {
      clearTimeout(timerProgress1);
      clearTimeout(timerProgress2);
      clearTimeout(timerFade);
      clearTimeout(timerRemove);
    };
  }, [minDurationMs, onFinish]);

  if (isRemoved) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white select-none transition-opacity duration-250 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Simple & Crisp App Logo */}
        <SmartBudgetLogo size={64} animated={false} />

        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            Smart<span className="text-emerald-400">Budget</span>
          </h1>
        </div>

        {/* Ultra-sleek minimalist progress line */}
        <div className="w-28 h-1 bg-slate-800/80 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
