import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ExternalLink,
  X,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  Globe,
  RefreshCw,
  GitBranch,
  GitCommit,
  ShieldCheck,
  Download,
  AlertCircle,
  Clock,
  Settings2,
  Cloud,
  Layers,
  Send,
  FileCode2,
  Cpu,
  Radio,
} from 'lucide-react';
import { AppUpdateInfo, FeatureManifestItem, GitHubUpdateConfig } from '../types';
import {
  DEFAULT_MASTER_CLOUD_URL,
  INSTALLED_FEATURES_MANIFEST,
  detectRuntimeEnvironment,
} from '../lib/versionManifest';
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
  currentBuildHash,
  githubConfig,
  updateInfo,
  isCheckingUpdate = false,
  isFirestoreReleaseConnected = true,
  onCheckUpdate,
  onPerformUpdate,
  onSaveGithubConfig,
  onPublishReleaseUpdate,
}) => {
  const [activeSection, setActiveSection] = useState<'update' | 'publish' | 'install'>('update');
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Configuration state
  const [repoInput, setRepoInput] = useState(githubConfig?.repoUrl || '');
  const [branchInput, setBranchInput] = useState(githubConfig?.branch || 'main');
  const [masterUrlInput, setMasterUrlInput] = useState(
    githubConfig?.masterServerUrl || DEFAULT_MASTER_CLOUD_URL
  );
  const [apkUrlInput, setApkUrlInput] = useState(githubConfig?.apkDownloadUrl || '');
  const [autoCheck, setAutoCheck] = useState(githubConfig?.autoCheckOnStartup ?? true);
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [isUpdatingNow, setIsUpdatingNow] = useState(false);
  const [apkInstallStatus, setApkInstallStatus] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const handleInstallApkDirect = async (url: string) => {
    try {
      setIsUpdatingNow(true);
      setApkInstallStatus("Téléchargement de l'APK...");
      await triggerApkDownloadAndInstall(url, (msg) => setApkInstallStatus(msg));
    } catch (err: any) {
      alert("Erreur lors de l'installation : " + (err?.message || err));
    } finally {
      setIsUpdatingNow(false);
      setApkInstallStatus(null);
    }
  };

  // Publish new feature to APK state
  const [featTitle, setFeatTitle] = useState('');
  const [featDesc, setFeatDesc] = useState('');
  const [featCategory, setFeatCategory] = useState<'core' | 'ai' | 'sync' | 'analytics' | 'ux'>('ux');
  const [publishApkUrl, setPublishApkUrl] = useState(githubConfig?.apkDownloadUrl || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessToast, setPublishSuccessToast] = useState(false);

  const runtimeEnv = detectRuntimeEnvironment(githubConfig?.masterServerUrl);
  const directStandaloneUrl =
    typeof window !== 'undefined' ? window.location.origin : DEFAULT_MASTER_CLOUD_URL;
  const cloudRunUrl = githubConfig?.masterServerUrl || DEFAULT_MASTER_CLOUD_URL;

  useEffect(() => {
    setRepoInput(githubConfig?.repoUrl || '');
    setBranchInput(githubConfig?.branch || 'main');
    setMasterUrlInput(githubConfig?.masterServerUrl || DEFAULT_MASTER_CLOUD_URL);
    setApkUrlInput(githubConfig?.apkDownloadUrl || '');
    setPublishApkUrl(githubConfig?.apkDownloadUrl || '');
    setAutoCheck(githubConfig?.autoCheckOnStartup ?? true);
  }, [
    githubConfig?.repoUrl,
    githubConfig?.branch,
    githubConfig?.masterServerUrl,
    githubConfig?.apkDownloadUrl,
    githubConfig?.autoCheckOnStartup,
  ]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedRepo = repoInput.trim();
    const cleanedBranch = branchInput.trim() || 'main';
    const cleanedMaster = masterUrlInput.trim() || DEFAULT_MASTER_CLOUD_URL;
    const cleanedApk = apkUrlInput.trim();

    onSaveGithubConfig({
      repoUrl: cleanedRepo,
      branch: cleanedBranch,
      masterServerUrl: cleanedMaster,
      apkDownloadUrl: cleanedApk,
      autoCheckOnStartup: autoCheck,
    });
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 2500);
    await onCheckUpdate(cleanedRepo, cleanedBranch);
  };

  const handleRunCheck = async () => {
    const cleanedRepo = repoInput.trim();
    const cleanedBranch = branchInput.trim() || 'main';
    await onCheckUpdate(cleanedRepo, cleanedBranch);
  };

  const handleConfirmAndApplyUpdate = async (targetLiveUrl?: string) => {
    setIsUpdatingNow(true);
    await onPerformUpdate(targetLiveUrl);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onPublishReleaseUpdate || isPublishing) return;
    setIsPublishing(true);
    try {
      const ok = await onPublishReleaseUpdate({
        featureTitle: featTitle.trim() || 'Mise à jour fonctionnelle AI Studio',
        featureDescription:
          featDesc.trim() ||
          'Nouvelle fonctionnalité ou amélioration ajoutée depuis AI Studio.',
        featureCategory: featCategory,
        apkDownloadUrl: publishApkUrl.trim() || undefined,
      });
      if (ok) {
        setPublishSuccessToast(true);
        setFeatTitle('');
        setFeatDesc('');
        setTimeout(() => {
          setPublishSuccessToast(false);
          setActiveSection('update');
        }, 1800);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleInstallPwaNative = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleCopyDirect = () => {
    navigator.clipboard.writeText(directStandaloneUrl);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  const handleCopyCloud = () => {
    navigator.clipboard.writeText(cloudRunUrl);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2500);
  };

  const hasUpdate = Boolean(updateInfo?.hasUpdate);
  const ghCommit = updateInfo?.githubCommit;
  const newFeatures: FeatureManifestItem[] = updateInfo?.newFeaturesDetected || [];
  const allFeatures: FeatureManifestItem[] =
    updateInfo?.features && updateInfo.features.length > 0
      ? updateInfo.features
      : INSTALLED_FEATURES_MANIFEST;
  const modifiedModules = updateInfo?.modifiedModules || [];
  const resolvedApkDownloadUrl = updateInfo?.apkDownloadUrl || githubConfig?.apkDownloadUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-5 sm:p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <RefreshCw className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Système Intelligent de MAJ (APK & Antigravity)
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  v{currentVersion}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Détection temps réel des nouvelles fonctionnalités ajoutées dans AI Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Switcher (3 Tabs) */}
        <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-2xl mt-3.5 shrink-0 gap-1">
          <button
            onClick={() => setActiveSection('update')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'update'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Détection & MAJ</span>
            {hasUpdate && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            )}
          </button>

          <button
            onClick={() => setActiveSection('publish')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'publish'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Publier vers APK</span>
          </button>

          <button
            onClick={() => setActiveSection('install')}
            className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'install'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Antigravity & Git</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
          {activeSection === 'update' && (
            <>
              {/* Environment & Multi-Channel Telemetry Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">{runtimeEnv.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>
                      {isFirestoreReleaseConnected
                        ? 'Canal Cloud Firestore : Actif'
                        : 'Canal Cloud : Veille'}
                    </span>
                  </span>
                  {updateInfo?.totalFilesScanned && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-mono">
                      {updateInfo.totalFilesScanned} fichiers suivis
                    </span>
                  )}
                </div>
              </div>

              {/* Current Status Hero Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  hasUpdate
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-white text-slate-800 border-emerald-300 shadow-sm'
                    : 'bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 text-slate-800 border-emerald-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        hasUpdate
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {hasUpdate ? (
                        <>
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>Changements Détectés dans AI Studio</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>APK & Code Synchronisés</span>
                        </>
                      )}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 pt-1">
                      {hasUpdate
                        ? `Mise à jour v${updateInfo?.version || currentVersion} disponible pour votre application`
                        : `Votre application v${currentVersion} dispose de toutes les dernières fonctionnalités`}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Signature Code #{updateInfo?.buildHash || currentBuildHash || 'local'}</span>
                      {githubConfig?.lastInstalledBuildHash && (
                        <span>
                          • Installé: #{githubConfig.lastInstalledBuildHash}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Check Update Button */}
                  <button
                    onClick={handleRunCheck}
                    disabled={isCheckingUpdate || isUpdatingNow}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Scan...' : 'Vérifier MAJ'}</span>
                  </button>
                </div>

                {githubConfig?.lastCheckedAt && (
                  <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>
                      Dernier scan multi-canaux (Firestore + Serveur AI Studio + GitHub) :{' '}
                      {new Date(githubConfig.lastCheckedAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                )}

                {/* Differential New Features Detected Box */}
                {newFeatures.length > 0 && (
                  <div className="mt-3.5 p-3 rounded-xl bg-white/90 border border-emerald-200 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Nouvelles Fonctionnalités Détectées ({newFeatures.length})
                        </span>
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                        NOUVEAU DANS AI STUDIO
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {newFeatures.map((nf) => (
                        <div
                          key={nf.id}
                          className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200/70 text-xs"
                        >
                          <div className="font-bold text-slate-900 flex items-center justify-between">
                            <span>{nf.title}</span>
                            <span className="text-[10px] font-mono text-emerald-700">
                              v{nf.addedInVersion}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{nf.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub Latest Commit Details if fetched */}
                {ghCommit && (
                  <div className="mt-3 p-3 rounded-xl bg-white/90 border border-emerald-200/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <GitCommit className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Dernier Commit GitHub ({ghCommit.repoFullName}@{ghCommit.branch})</span>
                      </span>
                      <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                        {ghCommit.shortSha}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {ghCommit.message}
                    </p>
                  </div>
                )}

                {/* Update Action Callout when update is detected */}
                {hasUpdate && (
                  <div className="mt-3.5 pt-3 border-t border-emerald-200/70 space-y-2.5">
                    <div className="text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-emerald-900">
                        Journal des changements détectés :
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                        {(updateInfo?.releaseNotes || []).slice(0, 4).map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleConfirmAndApplyUpdate()}
                        disabled={isUpdatingNow}
                        className="w-full py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>
                          {isUpdatingNow
                            ? 'Sauvegarde & MAJ...'
                            : 'Installer & Actualiser (OTA)'}
                        </span>
                      </button>

                      {resolvedApkDownloadUrl ? (
                        <button
                          onClick={() => handleInstallApkDirect(resolvedApkDownloadUrl)}
                          disabled={isUpdatingNow}
                          className="w-full py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                        >
                          <Smartphone className="w-4 h-4 shrink-0" />
                          <span>
                            {apkInstallStatus
                              ? apkInstallStatus
                              : "Télécharger & Installer l'APK (Automatique)"}
                          </span>
                        </button>
                      ) : runtimeEnv.isApkOrHybrid ? (
                        <button
                          onClick={() => handleConfirmAndApplyUpdate(cloudRunUrl)}
                          disabled={isUpdatingNow}
                          className="w-full py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                        >
                          <Cloud className="w-4 h-4 shrink-0" />
                          <span>Actualiser le cache de l'App</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setActiveSection('publish')}
                          className="w-full py-3 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Send className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          <span>Diffuser vers les APK</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modified Source Modules & Active Feature Registry */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Registre des Fonctionnalités & Modules Suivis ({allFeatures.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Synchronisé avec l'APK
                  </span>
                </div>

                {modifiedModules.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                      Derniers modules modifiés dans AI Studio :
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {modifiedModules.map((mod, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {allFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{feat.title}</span>
                          {feat.isNew && (
                            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              NOUVEAU
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{feat.description}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        v{feat.addedInVersion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Guarantee Box */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-950 space-y-0.5">
                  <p className="font-bold">Protection Intégrale des Données sur l'APK</p>
                  <p className="text-emerald-800/90 leading-relaxed">
                    Lorsqu'une mise à jour est appliquée sur votre téléphone, vos projets, comptes et transactions sont automatiquement sauvegardés en local et fusionnés sur Firebase Firestore avant l'actualisation.
                  </p>
                </div>
              </div>
            </>
          )}

          {activeSection === 'publish' && (
            <form
              onSubmit={handlePublishSubmit}
              className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Notifier l'APK d'un changement fait ici dans AI Studio
                  </h3>
                </div>
                {publishSuccessToast && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Diffusé vers l'APK !
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Lorsque vous ajoutez une fonctionnalité ou modifiez le code ici dans <strong>AI Studio</strong>, utilisez ce panneau pour publier officiellement la nouvelle version sur le <strong>Serveur Maître</strong> et sur <strong>Firebase Firestore (`/appReleases/latest`)</strong>. Votre téléphone exécutant l'APK exporté via Antigravity détectera immédiatement la nouveauté et demandera la mise à jour.
              </p>

              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Titre de la nouvelle fonctionnalité / modification
                  </label>
                  <input
                    type="text"
                    required
                    value={featTitle}
                    onChange={(e) => setFeatTitle(e.target.value)}
                    placeholder="ex: Ajout du Calculateur d'Épargne Automatique"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Description détaillée (affichée sur le téléphone lors de la demande de MAJ)
                  </label>
                  <textarea
                    rows={2}
                    value={featDesc}
                    onChange={(e) => setFeatDesc(e.target.value)}
                    placeholder="Décrivez ce qui a changé pour informer l'utilisateur sur l'APK..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Catégorie de fonctionnalité
                    </label>
                    <select
                      value={featCategory}
                      onChange={(e) => setFeatCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ux">Interface & Expérience (UX)</option>
                      <option value="core">Gestion Budgétaire (Core)</option>
                      <option value="ai">Intelligence Artificielle (IA)</option>
                      <option value="sync">Synchronisation & APK</option>
                      <option value="analytics">Analytique & Graphiques</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Lien direct du nouvel APK (Optionnel)
                    </label>
                    <input
                      type="url"
                      value={publishApkUrl}
                      onChange={(e) => setPublishApkUrl(e.target.value)}
                      placeholder="https://.../smartbudget-latest.apk"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPublishing}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? 'Diffusion en cours sur Firestore & Serveur...'
                    : 'Publier la Nouvelle Version & Notifier les APK'}
                </span>
              </button>
            </form>
          )}

          {activeSection === 'install' && (
            <>
              {/* How Antigravity APK Sync Works */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white text-slate-800 rounded-2xl space-y-2.5 border border-emerald-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                    Fonctionnement de l'Export vers Antigravity (APK)
                  </h3>
                </div>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700 leading-relaxed">
                  <li>
                    <strong>Empreinte Embarquée</strong> : Lorsque vous exportez ce projet vers <strong>Antigravity</strong> pour créer l'APK, la version actuelle (<code>v{currentVersion}</code>) et la liste des fonctionnalités sont intégrées dans l'APK.
                  </li>
                  <li>
                    <strong>Détection Automatique à Distance</strong> : Sur votre téléphone, l'APK écoute en temps réel <strong>Firebase Firestore</strong> (<code>/appReleases/latest</code>) et interroge le <strong>Serveur Maître AI Studio</strong> (via CORS) ainsi que <strong>GitHub</strong>.
                  </li>
                  <li>
                    <strong>Invitation de Mise à Jour</strong> : Dès que vous modifiez le code ou ajoutez une fonctionnalité ici dans AI Studio, votre APK détecte le changement et vous propose d'actualiser l'application.
                  </li>
                </ol>
              </div>

              {/* Remote Master Server & GitHub Configuration Form */}
              <form
                onSubmit={handleSaveConfig}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Paramètres Serveur Maître AI Studio & GitHub
                    </h4>
                  </div>
                  {configSavedToast && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enregistré
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    URL du Serveur Maître AI Studio (Utilisée par l'APK Antigravity)
                  </label>
                  <input
                    type="url"
                    value={masterUrlInput}
                    onChange={(e) => setMasterUrlInput(e.target.value)}
                    placeholder={DEFAULT_MASTER_CLOUD_URL}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Dépôt GitHub (owner/repo ou URL)
                    </label>
                    <input
                      type="text"
                      value={repoInput}
                      onChange={(e) => setRepoInput(e.target.value)}
                      placeholder="ex: karim-dkhili/smartbudget-ai"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Branche
                    </label>
                    <input
                      type="text"
                      value={branchInput}
                      onChange={(e) => setBranchInput(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between pt-1 cursor-pointer">
                  <span className="text-xs font-medium text-slate-700">
                    Vérifier automatiquement les changements à l'ouverture de l'APK
                  </span>
                  <input
                    type="checkbox"
                    checked={autoCheck}
                    onChange={(e) => setAutoCheck(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isCheckingUpdate}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-white" />
                    <span>Enregistrer & Tester la Connexion</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmAndApplyUpdate()}
                    disabled={isUpdatingNow}
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Forcer l'actualisation</span>
                  </button>
                </div>
              </form>

              {/* Native PWA Prompt if supported */}
              {deferredPrompt && (
                <div className="p-4 bg-emerald-50 text-slate-800 rounded-2xl space-y-2 border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-900">
                    Installation Rapide PWA disponible sur cet appareil :
                  </p>
                  <button
                    onClick={handleInstallPwaNative}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer l'Application Directement</span>
                  </button>
                </div>
              )}

              {/* Copy Links Section */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>URLs de Synchronisation</span>
                </p>

                <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex-1 truncate">
                    <span className="block text-[9px] font-bold text-teal-700 uppercase">
                      Serveur Maître Cloud AI Studio (Source de vérité APK)
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 truncate block">
                      {cloudRunUrl}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCloud}
                    className="py-1.5 px-2.5 bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold text-[11px] rounded-lg flex items-center space-x-1 shrink-0 transition-colors"
                  >
                    {copiedOrigin ? (
                      <Check className="w-3.5 h-3.5 text-teal-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedOrigin ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors shrink-0"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};
