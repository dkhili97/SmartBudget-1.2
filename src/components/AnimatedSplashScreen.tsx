import React, { useEffect, useState } from 'react';
import { SmartBudgetLogo } from './SmartBudgetLogo';
import { ShieldCheck, WifiOff, Sparkles } from 'lucide-react';

interface AnimatedSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onFinish,
  minDurationMs = 1800,
}) => {
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Démarrage du coffre financier...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Chargement des portefeuilles & comptes...');
    }, 400);

    const t2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Calcul des enveloppes 50/30/20...');
    }, 900);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Prêt ! Vos données sont sécurisées hors-ligne.');
    }, 1400);

    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, minDurationMs);

    const t5 = setTimeout(() => {
      setIsRemoved(true);
      if (onFinish) onFinish();
    }, minDurationMs + 450);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [minDurationMs, onFinish]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsRemoved(true);
      if (onFinish) onFinish();
    }, 250);
  };

  if (isRemoved) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-slate-950 via-[#0a1120] to-slate-950 text-white select-none transition-all duration-500 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-2 z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] backdrop-blur-md">
          <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-300">100% Hors-Ligne</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>v1.5.0</span>
        </div>
      </div>

      {/* Center Branding & Animated Logo */}
      <div className="flex flex-col items-center justify-center my-auto text-center z-10 space-y-6">
        <div className="relative">
          <SmartBudgetLogo size={110} animated={true} />
        </div>

        <div className="space-y-1.5 animate-fadeIn">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center justify-center gap-1">
            Smart<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">Budget</span>
          </h1>
          <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
            Gestion budgétaire 50/30/20 &amp; finances personnelles
          </p>
        </div>
      </div>

      {/* Bottom Progress Bar & Loading State */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-4 pb-6 z-10">
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="animate-pulse">{statusText}</span>
            <span className="font-mono text-emerald-400">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Données chiffrées &amp; stockées localement</span>
        </div>
      </div>
    </div>
  );
};
