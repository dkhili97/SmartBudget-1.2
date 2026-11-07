import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Download,
  Sparkles,
  GitBranch,
  ShieldCheck,
  ExternalLink,
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
  onSaveGithubConfig: (config: Partial<GitHubUpdateConfig>) => void;
  onPublishReleaseUpdate?: (payload: PublishFeaturePayload) => Promise<boolean>;
}

export const ApkUpdateModal: React.FC<ApkUpdateModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  githubConfig,
  updateInfo,
  isCheckingUpdate = false,
  onCheckUpdate,
  onSaveGithubConfig,
}) => {
  const [isUpdatingNow, setIsUpdatingNow] = useState(false);
  const [apkInstallStatus, setApkInstallStatus] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState(githubConfig?.autoCheckOnStartup ?? true);

  if (!isOpen) return null;

  const hasUpdate = Boolean(updateInfo?.hasUpdate);
  const resolvedApkDownloadUrl = updateInfo?.apkDownloadUrl || '';
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

  const handleToggleAutoCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoCheck(val);
    onSaveGithubConfig({ autoCheckOnStartup: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-3xl shadow-xl p-5 sm:p-6 overflow-hidden flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <RefreshCw className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mise à jour logicielle</h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Version actuelle :</span>
                <span className="font-mono font-bold text-slate-700">v{currentVersion}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Update Detection Card */}
        <div className="space-y-4">
          {hasUpdate ? (
            /* Update Available State */
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-300 text-slate-800 space-y-4 shadow-2xs">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nouvelle version disponible</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 pt-1">
                    SmartBudget v{newVersion}
                  </h3>
                </div>
              </div>

              {/* Release Notes */}
              {updateInfo?.releaseNotes && updateInfo.releaseNotes.length > 0 && (
                <div className="p-3 bg-white/90 rounded-xl border border-emerald-200/80 text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Nouveautés de cette version :
                  </p>
                  <p className="line-clamp-4 whitespace-pre-line text-[11px]">
                    {updateInfo.releaseNotes[0]}
                  </p>
                </div>
              )}

              {/* Install Button */}
              <button
                onClick={handleDownloadAndInstall}
                disabled={isUpdatingNow}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-70"
              >
                {isUpdatingNow ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{apkInstallStatus || 'Installation en cours...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger &amp; Installer la mise à jour</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* App Is Up To Date State */
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Votre application est à jour
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  SmartBudget v{currentVersion} est la version la plus récente installée sur votre appareil.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onCheckUpdate()}
                  disabled={isCheckingUpdate}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isCheckingUpdate ? 'Recherche en cours...' : 'Rechercher des mises à jour'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Minimal Settings */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-700 font-medium">
              Vérifier automatiquement au démarrage
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoCheck}
                onChange={handleToggleAutoCheck}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* GitHub Repository Reference */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span>Dépôt GitHub :</span>
              <span className="font-mono text-slate-700 font-semibold">
                {githubConfig?.repoUrl || 'dkhili97/SmartBudget-1.2'}
              </span>
            </div>
            <a
              href={`https://github.com/${githubConfig?.repoUrl || 'dkhili97/SmartBudget-1.2'}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-semibold"
            >
              <span>Releases</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
