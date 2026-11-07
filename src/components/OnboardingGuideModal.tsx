import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Plus,
  HelpCircle,
  X,
} from 'lucide-react';
import { SmartBudgetLogo } from './SmartBudgetLogo';

interface OnboardingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: {
    currency: string;
    income: number;
    startClean: boolean;
  }) => void;
  currentCurrency?: string;
  currentIncome?: number;
}

export const OnboardingGuideModal: React.FC<OnboardingGuideModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  currentCurrency = 'TND',
  currentIncome = 1800,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currency, setCurrency] = useState(currentCurrency);
  const [income, setIncome] = useState(currentIncome > 0 ? currentIncome.toString() : '1500');
  const [startClean, setStartClean] = useState(true);

  if (!isOpen) return null;

  const currencies = ['TND', '€', '$', 'DZD', 'MAD', 'CHF', 'CAD'];

  const handleFinish = () => {
    const parsedIncome = parseFloat(income) || 0;
    onComplete({
      currency,
      income: parsedIncome,
      startClean,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Progress Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <SmartBudgetLogo size={36} />
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full">
                Guide de Démarrage
              </span>
              <h2 className="text-lg font-black tracking-tight mt-1">Bienvenue sur SmartBudget</h2>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 1 ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 2 ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 3 ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>100% Autonome &amp; Confidentiel</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  SmartBudget fonctionne intégralement <strong>hors-ligne</strong> sur votre smartphone.
                  Vos finances restent strictement privées, stockées localement sur votre téléphone.
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Comment ça fonctionne ?
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-emerald-700 font-extrabold text-sm block">50%</span>
                    <span className="text-[11px] font-bold text-slate-800 block">Besoins</span>
                    <span className="text-[9px] text-slate-500 block">Loyer, courses, factures</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-teal-700 font-extrabold text-sm block">30%</span>
                    <span className="text-[11px] font-bold text-slate-800 block">Envies</span>
                    <span className="text-[9px] text-slate-500 block">Cafés, sorties, loisirs</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-indigo-700 font-extrabold text-sm block">20%</span>
                    <span className="text-[11px] font-bold text-slate-800 block">Épargne</span>
                    <span className="text-[9px] text-slate-500 block">Fonds de secours, projets</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <span>Configurer mon budget</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  1. Choisissez votre devise :
                </label>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        currency === curr
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  2. Votre revenu ou budget mensuel estimé :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="Ex: 1800"
                    className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  3. Mode de départ :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStartClean(true)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      startClean
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">✨ Projet Vierge</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Démarrer à vide, prêt pour vos vraies dépenses.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartClean(false)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      !startClean
                        ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">📋 Démo Exemple</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Avec données types pour explorer l'app.
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-700 font-bold text-xs"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>3 Astuces pour bien démarrer</span>
                </h4>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      <strong>Ajout en 3 secondes :</strong> Cliquez sur le bouton <span className="font-bold text-emerald-700">+</span> en bas pour enregistrer chaque café, course ou facture.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      <strong>Conseiller IA Hors-Ligne :</strong> L'onglet Conseiller analyse vos dépenses et calcule votre score de santé sans jamais se connecter à Internet.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      <strong>Sauvegarde Automatique :</strong> Vos données sont sauvegardées toutes les 12h sur votre appareil.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>C'est parti, ouvrir SmartBudget ! 🚀</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

