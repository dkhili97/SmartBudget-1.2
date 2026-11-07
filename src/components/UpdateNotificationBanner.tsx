import React from 'react';
import { Smartphone, RefreshCw, Sparkles, X, GitBranch, Cloud, Layers } from 'lucide-react';
import { AppUpdateInfo } from '../types';

interface UpdateNotificationBannerProps {
  version: string;
  updateInfo?: AppUpdateInfo | null;
  onRefresh: () => void;
  onDismiss: () => void;
  onOpenMobileModal: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  version,
  updateInfo,
  onRefresh,
  onDismiss,
  onOpenMobileModal,
}) => {
  const commitShort = updateInfo?.githubCommit?.shortSha;
  const commitMsg = updateInfo?.githubCommit?.message?.split('\n')[0];
  const newFeatures = updateInfo?.newFeaturesDetected || [];
  const firstNewFeature = newFeatures[0];
  const sourceLabel =
    updateInfo?.updateSource === 'firestore'
      ? 'Cloud Firestore Temps Réel'
      : updateInfo?.updateSource === 'both'
      ? 'AI Studio & GitHub'
      : updateInfo?.updateSource === 'github'
      ? 'GitHub Sync'
      : 'Serveur AI Studio';

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-white text-slate-800 p-3 px-4 shadow-xs border-b border-emerald-200/90 animate-fadeIn flex flex-col sm:flex-row items-center justify-between gap-2.5 z-40 relative">
      <div className="flex items-center space-x-2.5 text-xs">
        <div className="p-2 bg-white text-emerald-700 rounded-xl border border-emerald-200 shrink-0 shadow-2xs">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
        </div>
        <div>
          <div className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
            <span>Changement détecté — Mise à jour disponible</span>
            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-mono">
              v{updateInfo?.version || version}
            </span>
            <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-emerald-200">
              <Cloud className="w-3 h-3 text-emerald-600" />
              {sourceLabel}
            </span>
            {newFeatures.length > 0 && (
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-amber-200">
                <Layers className="w-3 h-3 text-amber-600" />
                +{newFeatures.length} nouvelle{newFeatures.length > 1 ? 's' : ''} fonctionnalité{newFeatures.length > 1 ? 's' : ''}
              </span>
            )}
            {commitShort && (
              <span className="text-[10px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-mono flex items-center gap-1 border border-teal-200">
                <GitBranch className="w-3 h-3 text-teal-600" />
                {commitShort}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
            {firstNewFeature
              ? `Nouveauté ajoutée : "${firstNewFeature.title}" — Cliquez pour mettre à jour votre application.`
              : commitMsg
              ? `GitHub : "${commitMsg}" — Vos données locales et Cloud sont protégées.`
              : updateInfo?.releaseNotes?.[0] ||
                'Des modifications ou nouvelles fonctionnalités ont été ajoutées dans AI Studio.'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
        <button
          onClick={onOpenMobileModal}
          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-[11px] font-semibold flex items-center space-x-1 border border-emerald-200 transition-colors shadow-2xs"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Voir les nouveautés</span>
        </button>

        <button
          onClick={() => onRefresh()}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Mettre à jour l'App</span>
        </button>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          title="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
