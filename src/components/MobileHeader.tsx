import React, { useState } from 'react';
import {
  Wallet,
  Smartphone,
  Cloud,
  MoreHorizontal,
  Download,
  RefreshCw,
  Layers,
  ArrowRightLeft,
  FolderKanban,
  GitBranch,
  BookOpen,
} from 'lucide-react';
import { BudgetState } from '../types';
import { SmartBudgetLogo } from './SmartBudgetLogo';

interface MobileHeaderProps {
  budgetData: BudgetState;
  onCurrencyChange: (currency: string) => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenMobileModal: () => void;
  onOpenAuthModal: () => void;
  onOpenProjectsManager?: () => void;
  onOpenWalletTransfer?: () => void;
  onOpenBackupManager?: () => void;
  onOpenDocumentation?: () => void;
  onOpenOnboarding?: () => void;
  onQuickCheckUpdate?: () => void;
  isCheckingUpdate?: boolean;
  hasUpdateAvailable?: boolean;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  budgetData,
  onCurrencyChange,
  onReset,
  onOpenExport,
  onOpenMobileModal,
  onOpenAuthModal,
  onOpenProjectsManager,
  onOpenWalletTransfer,
  onOpenBackupManager,
  onOpenDocumentation,
  onOpenOnboarding,
  onQuickCheckUpdate,
  isCheckingUpdate = false,
  hasUpdateAvailable,
  isMobileFrame,
  onToggleFrame,
}) => {
  const currencies = ['TND', '€', '$', 'DZD', 'MAD', 'CHF'];
  const [showMenu, setShowMenu] = useState(false);

  const userName = budgetData.userAccount?.name || 'Karim Dkhili';

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-800 px-3 sm:px-4 py-2.5 sticky top-0 z-30 border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Account Header */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center space-x-2 text-left group shrink-0"
          title="Mon Compte & Données"
        >
          <SmartBudgetLogo size={32} animated={true} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900">
                Smart<span className="text-emerald-700">Budget</span>
              </h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Hors-Ligne</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <span className="truncate max-w-[100px] sm:max-w-[180px]">
                {budgetData.userAccount?.email || userName}
              </span>
            </p>
          </div>
        </button>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-1.5 relative shrink-0">
          {/* Check Update Button (Direct 1-Tap Access for GitHub / Mobile Update) */}
          <button
            onClick={() => {
              if (onQuickCheckUpdate) {
                onQuickCheckUpdate();
              } else {
                onOpenMobileModal();
              }
            }}
            className={`relative px-2 py-1.5 rounded-lg border flex items-center space-x-1 transition-all active:scale-95 ${
              hasUpdateAvailable
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-xs'
                : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-slate-200/90'
            }`}
            title="Vérifier les mises à jour GitHub & Application (Check Update)"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isCheckingUpdate
                  ? 'animate-spin text-emerald-600'
                  : hasUpdateAvailable
                  ? 'text-white'
                  : 'text-emerald-600'
              }`}
            />
            <span className="text-[10px] font-bold hidden xs:inline">
              {hasUpdateAvailable ? 'Mise à jour !' : 'Update'}
            </span>
            {hasUpdateAvailable && (
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping" />
            )}
          </button>

          {/* Wallet Transfer Button */}
          {onOpenWalletTransfer && (
            <button
              onClick={onOpenWalletTransfer}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 flex items-center space-x-1 transition-colors"
              title="Virement de solde entre portefeuilles"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold hidden sm:inline">Virement</span>
            </button>
          )}

          {/* Currency Selector */}
          <select
            value={budgetData.currency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200/80 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            title="Devise"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* User Account / Cloud Sync Button */}
          <button
            onClick={onOpenAuthModal}
            className="p-1.5 sm:px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center gap-1 transition-colors"
            title="Connexion Firebase & Synchronisation"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline text-[11px]">Cloud</span>
          </button>

          {/* Overflow Menu Toggle */}
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 transition-colors"
            title="Plus d'actions"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Menu Backdrop Overlay */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 z-50 text-xs text-slate-700 animate-fadeIn">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenMobileModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/70 flex items-center justify-between font-bold text-emerald-900"
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-emerald-600" />
                    <span>Vérifier Mises à Jour (GitHub)</span>
                  </span>
                  {hasUpdateAvailable && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>

                {onOpenProjectsManager && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProjectsManager();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-bold text-slate-800"
                  >
                    <FolderKanban className="w-4 h-4 text-emerald-600" />
                    <span>Mes Projets & Périodes</span>
                  </button>
                )}

                {onOpenWalletTransfer && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenWalletTransfer();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-800"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                    <span>Transférer du Solde</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenMobileModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <span>Installation & Lien Mobile</span>
                </button>

                {onOpenBackupManager && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenBackupManager();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 font-semibold text-slate-800"
                  >
                    <Cloud className="w-4 h-4 text-emerald-600" />
                    <span>Sauvegardes & Restauration</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenExport();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Exporter le rapport</span>
                </button>

                {onOpenOnboarding && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenOnboarding();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/70 flex items-center gap-2 font-bold text-slate-800"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Guide de Démarrage</span>
                  </button>
                )}

                {onOpenDocumentation && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenDocumentation();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/70 flex items-center gap-2 font-bold text-slate-800"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Guide & Documentation</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleFrame();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>{isMobileFrame ? 'Mode Plein Écran Responsive' : 'Aperçu Cadre Mobile'}</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onReset();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
                >
                  <RefreshCw className="w-4 h-4 text-rose-500" />
                  <span>Réinitialiser les données</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
