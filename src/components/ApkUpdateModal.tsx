import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';
import { AppUpdateInfo, GitHubUpdateConfig } from '../types';
import { triggerApkDownloadAndInstall } from '../lib/apkUpdater';

export interface PublishFeaturePayload {
  featureTitle: string;
  featureDescription: string;
  featureCategory: 'core' | 'ai' | 'sync' | 'analytics' | 'ux';
  apkDownloadUrl?: string;
  note?: string;
}

interface ApkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  currentBuildHash?: string;
  githubConfig?: GitHubUpdateConfig;
  updateInfo?: AppUpdateInfo | null;
  isCheckingUpdate?: boolean;
  isFirestoreReleaseConnected?: boolean;
  onCheckUpdate: (customRepo?: string, customBranch?: string) => Promise<AppUpdateInfo | null>;
  onPerformUpdate: (targetLiveUrl?: string) => Promise<void>;
  onSaveGithubConfig?: (config: Partial<GitHubUpdateConfig>) => void;
  onPublishReleaseUpdate?: (payload: PublishFeaturePayload) => Promise<boolean>;
}

export const ApkUpdateModal: React.FC<ApkUpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  updateInfo,
  isCheckingUpdate = false,
  onCheckUpdate,
}) => {
  const [isUpdatingNow, setIsUpdatingNow] = useState(false);
  const [apkInstallStatus, setApkInstallStatus] = useState<string | null>(null);

  // Automatically check for update when opening if not already checked
  useEffect(() => {
    if (isOpen && !updateInfo && !isCheckingUpdate) {
      onCheckUpdate();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasUpdate = Boolean(updateInfo?.hasUpdate);
  const resolvedApkDownloadUrl =
    updateInfo?.apkDownloadUrl ||
    'https://github.com/dkhili97/SmartBudget-1.2/releases/latest/download/SmartBudget.apk';
  const newVersion = updateInfo?.version || currentVersion;

  const handleDownloadAndInstall = async () => {
    if (!resolvedApkDownloadUrl) {
      alert("L'URL de téléchargement de l'APK est indisponible.");
      return;
    }
    try {
      setIsUpdatingNow(true);
      setApkInstallStatus("Téléchargement de l'APK SmartBudget...");
      await triggerApkDownloadAndInstall(resolvedApkDownloadUrl, (status) => {
        setApkInstallStatus(status);
      });
    } catch (err: any) {
      alert("Erreur lors du téléchargement : " + (err?.message || err));
    } finally {
      setIsUpdatingNow(false);
      setApkInstallStatus(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-5 overflow-hidden flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Mise à jour logicielle</h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Version actuelle : <span className="font-mono font-bold text-slate-700">v{currentVersion}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Automatic Detection View ONLY */}
        <div className="space-y-3">
          {isCheckingUpdate ? (
            /* Loading State */
            <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs font-semibold text-slate-600">
                Recherche automatique de mise à jour...
              </p>
            </div>
          ) : hasUpdate ? (
            /* Update Available State */
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-300 text-slate-800 space-y-3 shadow-2xs">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Nouvelle version disponible</span>
              </div>
              
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  SmartBudget v{newVersion}
                </h3>
              </div>

              {/* Release Notes */}
              {updateInfo?.releaseNotes && updateInfo.releaseNotes.length > 0 && (
                <div className="p-3 bg-white/95 rounded-xl border border-emerald-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Nouveautés :
                  </p>
                  <p className="line-clamp-3 whitespace-pre-line">
                    {updateInfo.releaseNotes[0]}
                  </p>
                </div>
              )}

              {/* 1-Tap Install Button */}
              <button
                onClick={handleDownloadAndInstall}
                disabled={isUpdatingNow}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-70"
              >
                {isUpdatingNow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{apkInstallStatus || 'Téléchargement...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger &amp; Installer</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* App Is Up To Date State */
            <div className="py-6 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-11 h-11 mx-auto rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900">
                  Votre application est à jour
                </h3>
                <p className="text-[11px] text-slate-500">
                  SmartBudget v{currentVersion} est la version la plus récente installée sur cet appareil.
                </p>
              </div>

              <div className="pt-1 space-y-2">
                <button
                  onClick={() => onCheckUpdate()}
                  disabled={isCheckingUpdate}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vérifier à nouveau</span>
                </button>

                <button
                  onClick={handleDownloadAndInstall}
                  disabled={isUpdatingNow}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  {isUpdatingNow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{apkInstallStatus || 'Téléchargement...'}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Télécharger &amp; Réinstaller l'APK</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
