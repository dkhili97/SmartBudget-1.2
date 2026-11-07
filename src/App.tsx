import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import { BudgetState, CategoryType, StrategyType, AIAuditResult, CustomRatios, UserAccount, SmartReminderConfig, AdvisorLog, AuditLog, ExpensePreset, Transaction, BudgetItem, MonthlyReportArchive, AppUpdateInfo, GitHubUpdateConfig } from './types';
import { loadBudgetState, saveBudgetState, resetBudgetState, checkAndPerform12hBackup, getAutoBackups, getUnifiedProjectList, performCleanAppUpdate, createCleanBudgetState } from './lib/storage';
import { auth, onAuthStateChanged, saveUserBudgetToFirestore, loadUserBudgetFromFirestore, subscribeToUserBudget, publishReleaseManifestToFirestore, subscribeToAppReleaseManifest } from './lib/firebase';
import { INSTALLED_APP_VERSION, INSTALLED_FEATURES_MANIFEST, computeFeatureDiff, detectRuntimeEnvironment, fetchWithMasterFallback } from './lib/versionManifest';
import { checkGitHubReleases, triggerApkDownloadAndInstall } from './lib/apkUpdater';
import { MobileHeader } from './components/MobileHeader';
import { Navigation, TabType } from './components/Navigation';
import { TabPlanning } from './components/TabPlanning';
import { TabTracking } from './components/TabTracking';
import { TabAnalytics } from './components/TabAnalytics';
import { TabGoals } from './components/TabGoals';
import { TabAdvisor } from './components/TabAdvisor';
import { TabAudit } from './components/TabAudit';
import { TabActivities } from './components/TabActivities';
import { QuickAddModal } from './components/QuickAddModal';
import { ExportModal } from './components/ExportModal';
import { ApkUpdateModal, PublishFeaturePayload } from './components/ApkUpdateModal';
import { AuthModal } from './components/AuthModal';
import { WalletTransferModal } from './components/WalletTransferModal';
import { NewPeriodModal } from './components/NewPeriodModal';
import { PosteRolloverModal } from './components/PosteRolloverModal';
import { BackupManagerModal } from './components/BackupManagerModal';
import { DashboardHeader } from './components/DashboardHeader';
import { SmartReminderBanner } from './components/SmartReminderBanner';
import { UpdateNotificationBanner } from './components/UpdateNotificationBanner';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { DocumentationModal } from './components/DocumentationModal';
import { OnboardingGuideModal } from './components/OnboardingGuideModal';
import { AnimatedSplashScreen } from './components/AnimatedSplashScreen';

export default function App() {
  const [budgetData, setBudgetData] = useState<BudgetState>(() => loadBudgetState());
  const [activeTab, setActiveTab] = useState<TabType>('plan');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddCategory, setQuickAddCategory] = useState<CategoryType | undefined>();
  const [quickAddItemId, setQuickAddItemId] = useState<string | undefined>();
  const [quickAddInitialType, setQuickAddInitialType] = useState<'expense' | 'income'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNewPeriodOpen, setIsNewPeriodOpen] = useState(false);
  const [isPosteRolloverOpen, setIsPosteRolloverOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isProjectsManagerOpen, setIsProjectsManagerOpen] = useState(false);
  const [isDocumentationOpen, setIsDocumentationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('smartbudget_onboarding_done');
  });
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [auditResult, setAuditResult] = useState<AIAuditResult | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Version and Intelligent APK Update state
  const [appVersion, setAppVersion] = useState<string>(INSTALLED_APP_VERSION);
  const [currentBuildHash, setCurrentBuildHash] = useState<string>('');
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [dismissedBanner, setDismissedBanner] = useState<boolean>(false);
  const [isFirestoreReleaseConnected, setIsFirestoreReleaseConnected] = useState<boolean>(false);

  // Flag to avoid recursive save during initial cloud load
  const isCloudLoading = useRef(false);

  // Firebase Auth listener and automatic Real-time Cloud Sync
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        isCloudLoading.current = true;
        // Subscribe to real-time changes in Firestore
        unsubscribeSnapshot = subscribeToUserBudget(
          user.uid,
          (cloudState) => {
            isCloudLoading.current = true;
            if (cloudState) {
              setBudgetData((prev) => {
                // 1. Merge transactions by ID so no transaction is ever lost
                const cloudTxs = cloudState.transactions || [];
                const localTxs = prev.transactions || [];
                const txMap = new Map<string, Transaction>();
                cloudTxs.forEach((t) => txMap.set(t.id, t));
                localTxs.forEach((t) => {
                  if (!txMap.has(t.id)) {
                    txMap.set(t.id, t);
                  }
                });
                const mergedTransactions = Array.from(txMap.values());

                // 2. Merge monthlyReports (all saved and archived projects) by periodMonth
                const cloudReports = cloudState.monthlyReports || [];
                const localReports = prev.monthlyReports || [];
                const reportMap = new Map<string, MonthlyReportArchive>();

                localReports.forEach((r) => reportMap.set(r.periodMonth, r));
                cloudReports.forEach((r) => {
                  const existing = reportMap.get(r.periodMonth);
                  if (!existing || (r.itemsSnapshot && r.itemsSnapshot.length >= (existing.itemsSnapshot?.length || 0))) {
                    reportMap.set(r.periodMonth, r);
                  }
                });
                const mergedReports = Array.from(reportMap.values());

                // 3. Determine active period and data based on timestamp
                const localTime = new Date(prev.lastUpdated || 0).getTime();
                const cloudTime = new Date(cloudState.lastUpdated || 0).getTime();
                const isLocalNewer = localTime > cloudTime;

                const selectedPeriodMonth = isLocalNewer
                  ? (prev.selectedPeriodMonth || cloudState.selectedPeriodMonth || '2026-08')
                  : (cloudState.selectedPeriodMonth || prev.selectedPeriodMonth || '2026-08');

                const income = isLocalNewer ? prev.income : (cloudState.income || prev.income);
                const strategy = isLocalNewer ? prev.strategy : (cloudState.strategy || prev.strategy);
                const items = isLocalNewer ? prev.items : (cloudState.items || prev.items);

                const mergedState: BudgetState = {
                  ...cloudState,
                  income,
                  strategy,
                  selectedPeriodMonth,
                  items,
                  transactions: mergedTransactions,
                  monthlyReports: mergedReports,
                  lastUpdated: isLocalNewer ? prev.lastUpdated : cloudState.lastUpdated,
                  userAccount: {
                    ...cloudState.userAccount,
                    email: user.email || cloudState.userAccount?.email || 'karim.dkhili@gmail.com',
                    name: user.displayName || cloudState.userAccount?.name || 'Karim Dkhili',
                    isLoggedIn: true,
                    syncMode: 'cloud',
                    lastSyncedAt: new Date().toISOString(),
                  },
                };

                // If local had projects or updates not yet on cloud, push immediately
                if (isLocalNewer || mergedReports.length > cloudReports.length || mergedTransactions.length > cloudTxs.length) {
                  saveUserBudgetToFirestore(user.uid, mergedState).catch((err) =>
                    console.error('Auto-pushing merged projects to Firestore failed:', err)
                  );
                }

                return mergedState;
              });
            } else {
              // Initial upload if document doesn't exist in Firestore
              setBudgetData((prev) => {
                const updatedAccount: UserAccount = {
                  ...prev.userAccount,
                  email: user.email || prev.userAccount?.email || 'karim.dkhili@gmail.com',
                  name: user.displayName || prev.userAccount?.name || 'Karim Dkhili',
                  isLoggedIn: true,
                  syncMode: 'cloud',
                  lastSyncedAt: new Date().toISOString(),
                };
                const newBudget = { ...prev, userAccount: updatedAccount };
                saveUserBudgetToFirestore(user.uid, newBudget);
                return newBudget;
              });
            }

            setTimeout(() => {
              isCloudLoading.current = false;
            }, 300);
          },
          (err) => {
            console.error('Real-time sync error:', err);
            isCloudLoading.current = false;
          }
        );
      } else {
        setBudgetData((prev) => ({
          ...prev,
          userAccount: {
            ...prev.userAccount,
            isLoggedIn: false,
            syncMode: 'local',
          },
        }));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Sync state changes with LocalStorage and Firebase Firestore
  useEffect(() => {
    const nowIso = new Date().toISOString();
    const updatedData: BudgetState = {
      ...budgetData,
      reminderConfig: {
        enabled: true,
        inactivityThresholdHours: 18,
        dailyCheckinTime: '20:00',
        lastAppOpen: nowIso,
        lastExpenseLogged: budgetData.reminderConfig?.lastExpenseLogged || nowIso,
        consecutiveStreakDays: budgetData.reminderConfig?.consecutiveStreakDays || 1,
        ...budgetData.reminderConfig,
        lastAppOpenDate: nowIso.substring(0, 10),
      },
    };
    saveBudgetState(updatedData);

    // Perform 12h backup check
    checkAndPerform12hBackup(updatedData, (msg) => {
      setAppliedNotice(msg);
      setTimeout(() => setAppliedNotice(null), 5000);
    });

    // Auto-save to Cloud (Firestore) whenever any change happens and user is connected
    if (!isCloudLoading.current && auth.currentUser) {
      saveUserBudgetToFirestore(auth.currentUser.uid, updatedData).catch((err) =>
        console.error('Cloud auto-sync failed:', err)
      );
    }
  }, [budgetData]);

  // Periodic 12-hour backup timer check (runs every 5 minutes in background)
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndPerform12hBackup(budgetData, (msg) => {
        setAppliedNotice(msg);
        setTimeout(() => setAppliedNotice(null), 5000);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [budgetData]);

  const handleSyncNow = async () => {
    if (auth.currentUser) {
      await saveUserBudgetToFirestore(auth.currentUser.uid, budgetData);
    } else {
      saveBudgetState(budgetData);
    }
  };

  // Comprehensive Multi-Channel APK Update Checker (AI Studio Master Server + Firestore + GitHub)
  const handleCheckForUpdates = async (
    customRepo?: string,
    customBranch?: string,
    openModalOnCheck = false
  ): Promise<AppUpdateInfo | null> => {
    setIsCheckingUpdate(true);
    if (openModalOnCheck) {
      setIsApkModalOpen(true);
    }

    const ghConf = budgetData.githubUpdateConfig;
    const repoToUse = customRepo !== undefined ? customRepo : (ghConf?.repoUrl || 'dkhili97/SmartBudget-1.2');
    const branchToUse = customBranch !== undefined ? customBranch : (ghConf?.branch || 'main');
    const baselineFeatureIds =
      ghConf?.installedFeatureIds && ghConf.installedFeatureIds.length > 0
        ? ghConf.installedFeatureIds
        : INSTALLED_FEATURES_MANIFEST.map((f) => f.id);

    // 1. Direct GitHub Releases Check (Primary check for SmartBudget APK updates)
    try {
      const release = await checkGitHubReleases(ghConf?.lastInstalledVersion || appVersion, repoToUse);
      if (release) {
        const ghUpdateData: AppUpdateInfo = {
          hasUpdate: release.hasUpdate,
          updateSource: 'github',
          version: release.version,
          buildHash: release.tagName,
          releaseNotes: [release.body],
          apkDownloadUrl: release.apkDownloadUrl,
          liveWebUrl: release.htmlUrl,
          checkedAt: new Date().toISOString(),
        };
        setUpdateInfo(ghUpdateData);
        if (release.version) setAppVersion(release.version);
        if (release.tagName) setCurrentBuildHash(release.tagName);

        if (release.hasUpdate) {
          setHasUpdateAvailable(true);
          setDismissedBanner(false);
          setAppliedNotice(`🚀 Nouvelle version SmartBudget disponible (${release.tagName}) !`);
          setTimeout(() => setAppliedNotice(null), 5000);
        } else if (openModalOnCheck) {
          setAppliedNotice('✅ Votre application SmartBudget est à jour avec la dernière version GitHub.');
          setTimeout(() => setAppliedNotice(null), 3500);
        }
        return ghUpdateData;
      }
    } catch (ghErr) {
      console.warn('GitHub release check note:', ghErr);
    }

    try {
      const res = await fetchWithMasterFallback(
        '/api/app/check-github-update',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoUrl: repoToUse,
            branch: branchToUse,
            installedVersion: ghConf?.lastInstalledVersion || appVersion,
            installedBuildHash: ghConf?.lastInstalledBuildHash || currentBuildHash,
            installedCommitSha: ghConf?.lastInstalledCommitSha || '',
            installedFeatureIds: baselineFeatureIds,
          }),
        },
        ghConf?.masterServerUrl
      );

      if (res.ok) {
        const data: AppUpdateInfo = await res.json();
        setUpdateInfo(data);
        if (data.version) setAppVersion(data.version);
        if (data.buildHash) setCurrentBuildHash(data.buildHash);

        // If running inside AI Studio Master Web environment and signed in, auto-sync the release manifest to Firestore
        // so any exported Antigravity APK receives the latest codebase signature and features in real time!
        const runtimeEnv = detectRuntimeEnvironment(ghConf?.masterServerUrl);
        if (!runtimeEnv.isApkOrHybrid && auth.currentUser && data.buildHash) {
          publishReleaseManifestToFirestore({
            version: data.version || INSTALLED_APP_VERSION,
            buildNumber: data.buildNumber || 150,
            buildHash: data.buildHash,
            releaseNotes: data.releaseNotes || [],
            features: data.features || INSTALLED_FEATURES_MANIFEST,
            modifiedModules: data.modifiedModules || [],
            totalFilesScanned: data.totalFilesScanned || 0,
            apkDownloadUrl: data.apkDownloadUrl || ghConf?.apkDownloadUrl || '',
            liveWebUrl: data.liveWebUrl || runtimeEnv.masterServerUrl,
            updatedAt: new Date().toISOString(),
          }).catch(() => {});
        }

        // First-time baseline registration so we don't false-alarm before any change happens
        if (!ghConf?.lastInstalledBuildHash && data.buildHash) {
          setBudgetData((prev) => ({
            ...prev,
            githubUpdateConfig: {
              repoUrl: repoToUse,
              branch: branchToUse,
              autoCheckOnStartup: prev.githubUpdateConfig?.autoCheckOnStartup ?? true,
              ...prev.githubUpdateConfig,
              lastInstalledVersion: data.version,
              lastInstalledBuildHash: data.buildHash,
              installedFeatureIds: (data.features || INSTALLED_FEATURES_MANIFEST).map((f) => f.id),
              ...(data.githubCommit?.sha && !prev.githubUpdateConfig?.lastInstalledCommitSha
                ? { lastInstalledCommitSha: data.githubCommit.sha, lastInstalledCommitMsg: data.githubCommit.message }
                : {}),
              lastCheckedAt: data.checkedAt,
            },
          }));
        } else {
          setBudgetData((prev) => ({
            ...prev,
            githubUpdateConfig: {
              repoUrl: repoToUse,
              branch: branchToUse,
              autoCheckOnStartup: prev.githubUpdateConfig?.autoCheckOnStartup ?? true,
              ...prev.githubUpdateConfig,
              lastCheckedAt: data.checkedAt,
            },
          }));
        }

        if (data.hasUpdate) {
          setHasUpdateAvailable(true);
          setDismissedBanner(false);
          const newFeatCount = data.newFeaturesDetected?.length || 0;
          setAppliedNotice(
            `🚀 Changement détecté (v${data.version}${
              newFeatCount > 0 ? ` • +${newFeatCount} nouvelle(s) fonctionnalité(s)` : ''
            }) !`
          );
          setTimeout(() => setAppliedNotice(null), 5000);
        } else if (openModalOnCheck) {
          setAppliedNotice('✅ Votre application est à jour avec la dernière version d\'AI Studio.');
          setTimeout(() => setAppliedNotice(null), 3500);
        }

        return data;
      }
    } catch (err) {
      console.warn('Server update check failed, attempting direct GitHub client fallback:', err);
      // Direct client-side GitHub check fallback for local phone / offline server mode
      if (repoToUse) {
        const ghMatch = repoToUse.match(/(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/|$)/i);
        if (ghMatch) {
          const [, owner, repo] = ghMatch;
          try {
            const ghRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(branchToUse || 'main')}`
            );
            if (ghRes.ok) {
              const commitData = await ghRes.json();
              const remoteSha = commitData.sha || '';
              const hasNewSha = Boolean(
                remoteSha && ghConf?.lastInstalledCommitSha && remoteSha !== ghConf.lastInstalledCommitSha
              );
              const fallbackInfo: AppUpdateInfo = {
                hasUpdate: hasNewSha,
                updateSource: hasNewSha ? 'github' : 'none',
                version: appVersion,
                buildHash: currentBuildHash || 'local',
                releaseNotes: [
                  `GitHub [${owner}/${repo}@${branchToUse}] (${remoteSha.substring(0, 7)}) : ${
                    commitData.commit?.message || 'Commit GitHub'
                  }`,
                ],
                githubCommit: {
                  sha: remoteSha,
                  shortSha: remoteSha.substring(0, 7),
                  message: commitData.commit?.message || 'Mise à jour GitHub',
                  author: commitData.commit?.author?.name || owner,
                  date: commitData.commit?.author?.date || new Date().toISOString(),
                  url: commitData.html_url || `https://github.com/${owner}/${repo}`,
                  repoFullName: `${owner}/${repo}`,
                  branch: branchToUse || 'main',
                },
                checkedAt: new Date().toISOString(),
              };
              setUpdateInfo(fallbackInfo);
              if (hasNewSha) {
                setHasUpdateAvailable(true);
                setDismissedBanner(false);
              }
              return fallbackInfo;
            }
          } catch {
            // Ignore offline fallback error
          }
        }
      }
    } finally {
      setIsCheckingUpdate(false);
    }
    return null;
  };

  // Real-time Firebase Firestore Release Manifest Listener (Channel 1 for Antigravity APK)
  useEffect(() => {
    const unsubscribeRelease = subscribeToAppReleaseManifest(
      (cloudRelease) => {
        setIsFirestoreReleaseConnected(true);
        if (!cloudRelease || !cloudRelease.buildHash) return;

        setBudgetData((prev) => {
          const ghConf = prev.githubUpdateConfig;
          const installedHash = ghConf?.lastInstalledBuildHash;
          const installedVer = ghConf?.lastInstalledVersion || INSTALLED_APP_VERSION;
          const newFeats = computeFeatureDiff(
            cloudRelease.features || [],
            ghConf?.installedFeatureIds
          );

          const hashDiffers = Boolean(installedHash && cloudRelease.buildHash !== installedHash);
          const versionDiffers = Boolean(cloudRelease.version && cloudRelease.version !== installedVer);
          const hasCloudUpdate = hashDiffers || versionDiffers || newFeats.length > 0;

          if (hasCloudUpdate) {
            setAppVersion(cloudRelease.version || INSTALLED_APP_VERSION);
            setCurrentBuildHash(cloudRelease.buildHash);
            setUpdateInfo((prevInfo) => ({
              ...prevInfo,
              hasUpdate: true,
              updateSource: 'firestore',
              version: cloudRelease.version,
              buildNumber: cloudRelease.buildNumber,
              buildHash: cloudRelease.buildHash,
              releaseNotes: cloudRelease.releaseNotes || [],
              features: cloudRelease.features || INSTALLED_FEATURES_MANIFEST,
              newFeaturesDetected: newFeats,
              modifiedModules: cloudRelease.modifiedModules || [],
              totalFilesScanned: cloudRelease.totalFilesScanned,
              apkDownloadUrl: cloudRelease.apkDownloadUrl,
              liveWebUrl: cloudRelease.liveWebUrl,
              checkedAt: cloudRelease.updatedAt || new Date().toISOString(),
            }));
            setHasUpdateAvailable(true);
            setDismissedBanner(false);
          }
          return prev;
        });
      },
      () => {
        setIsFirestoreReleaseConnected(false);
      }
    );

    return () => {
      unsubscribeRelease();
    };
  }, []);

  // Startup & periodic version check
  useEffect(() => {
    handleCheckForUpdates(undefined, undefined, false);
    const interval = setInterval(() => {
      handleCheckForUpdates(undefined, undefined, false);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveGithubConfig = (newConf: Partial<GitHubUpdateConfig>) => {
    setBudgetData((prev) => ({
      ...prev,
      githubUpdateConfig: {
        repoUrl: prev.githubUpdateConfig?.repoUrl || '',
        branch: prev.githubUpdateConfig?.branch || 'main',
        autoCheckOnStartup: prev.githubUpdateConfig?.autoCheckOnStartup ?? true,
        ...prev.githubUpdateConfig,
        ...newConf,
      },
    }));
  };

  // Publish a new feature / release from AI Studio to notify all exported APK instances
  const handlePublishReleaseUpdate = async (payload: PublishFeaturePayload): Promise<boolean> => {
    try {
      const res = await fetchWithMasterFallback(
        '/api/app/trigger-update',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        budgetData.githubUpdateConfig?.masterServerUrl
      );

      if (res.ok) {
        const result = await res.json();
        const vData = result?.versionData;
        if (vData) {
          await publishReleaseManifestToFirestore({
            version: vData.version,
            buildNumber: vData.buildNumber,
            buildHash: vData.buildHash,
            releaseNotes: vData.releaseNotes || [],
            features: vData.features || INSTALLED_FEATURES_MANIFEST,
            modifiedModules: vData.modifiedModules || [],
            totalFilesScanned: vData.totalFilesScanned || 0,
            apkDownloadUrl: payload.apkDownloadUrl || vData.apkDownloadUrl || '',
            liveWebUrl: vData.liveWebUrl || '',
            updatedAt: new Date().toISOString(),
          });
        }
        await handleCheckForUpdates(undefined, undefined, false);
        setHasUpdateAvailable(true);
        setDismissedBanner(false);
        setAppliedNotice(
          `📡 Mise à jour v${vData?.version || ''} diffusée vers tous les APK et Firestore !`
        );
        setTimeout(() => setAppliedNotice(null), 5000);
        return true;
      }
    } catch (err) {
      console.error('Error publishing release update:', err);
    }
    return false;
  };

  const handlePerformAppUpdate = async (targetLiveUrl?: string) => {
    setHasUpdateAvailable(false);
    if (auth.currentUser) {
      try {
        await saveUserBudgetToFirestore(auth.currentUser.uid, budgetData);
      } catch (e) {
        console.warn('Pre-update cloud sync warning:', e);
      }
    }

    // Si une URL de téléchargement APK est disponible, lancer le téléchargement & installation native
    if (updateInfo?.apkDownloadUrl) {
      try {
        setAppliedNotice("Téléchargement et installation de l'APK SmartBudget...");
        const result = await triggerApkDownloadAndInstall(updateInfo.apkDownloadUrl, (msg) => {
          setAppliedNotice(msg);
        });
        if (result.success) return;
      } catch (err: any) {
        console.warn('APK auto install failed, falling back to clean reload:', err);
      }
    }

    const validLiveUrl =
      typeof targetLiveUrl === 'string' && /^https?:\/\//i.test(targetLiveUrl.trim())
        ? targetLiveUrl.trim()
        : undefined;
    const allFeatureIds = (updateInfo?.features || INSTALLED_FEATURES_MANIFEST).map((f) => f.id);
    await performCleanAppUpdate(budgetData, {
      version: updateInfo?.version || appVersion,
      buildHash: updateInfo?.buildHash || currentBuildHash,
      commitSha: updateInfo?.githubCommit?.sha,
      commitMsg: updateInfo?.githubCommit?.message,
      installedFeatureIds: allFeatureIds,
      targetLiveUrl: validLiveUrl,
    });
  };

  // Handlers
  const handleUpdateIncome = (income: number) => {
    setBudgetData((prev) => {
      const log = {
        id: `strat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'income' as const,
        title: 'Mise à jour du revenu',
        details: `Revenu ajusté à ${income} ${prev.currency}`,
        oldVal: `${prev.income} ${prev.currency}`,
        newVal: `${income} ${prev.currency}`,
      };
      return {
        ...prev,
        income,
        strategyLogs: [log, ...(prev.strategyLogs || [])],
      };
    });
  };

  const handleUpdateCurrency = (currency: string) => {
    setBudgetData((prev) => ({ ...prev, currency }));
  };

  const handleUpdateStrategy = (strategy: StrategyType) => {
    setBudgetData((prev) => {
      const log = {
        id: `strat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'strategy' as const,
        title: 'Changement de stratégie d\'allocation',
        details: `Adoption de la stratégie ${strategy.toUpperCase()}`,
        oldVal: prev.strategy,
        newVal: strategy,
      };
      return {
        ...prev,
        strategy,
        strategyLogs: [log, ...(prev.strategyLogs || [])],
      };
    });
  };

  const handleUpdateCustomRatios = (customRatios: CustomRatios) => {
    setBudgetData((prev) => {
      const log = {
        id: `strat-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'ratio' as const,
        title: 'Ajustement personnalisé des ratios',
        details: `Ratios configurés à ${customRatios.needs}% Besoins, ${customRatios.wants}% Envies, ${customRatios.savings}% Épargne`,
        oldVal: `${prev.customRatios.needs}/${prev.customRatios.wants}/${prev.customRatios.savings}`,
        newVal: `${customRatios.needs}/${customRatios.wants}/${customRatios.savings}`,
      };
      return {
        ...prev,
        strategy: 'custom',
        customRatios,
        strategyLogs: [log, ...(prev.strategyLogs || [])],
      };
    });
    setAppliedNotice('Ajustement des ratios budgétaires appliqué avec succès !');
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  const handleApplyItemBudget = (itemId: string, newBudget: number) => {
    setBudgetData((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === itemId ? { ...i, budget: newBudget } : i)),
      };
    });
    setAppliedNotice('Budget du poste réajusté avec succès !');
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  const handleAddItem = (
    category: CategoryType,
    name: string,
    budget: number,
    options?: { isFixedCharge?: boolean; dueDateDay?: number; excludeFromAnalytics?: boolean }
  ) => {
    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      name,
      budget,
      category,
      isFixedCharge: options?.isFixedCharge || false,
      dueDateDay: options?.dueDateDay || 5,
      isPaidThisMonth: false,
      excludeFromAnalytics: options?.excludeFromAnalytics || false,
    };
    setBudgetData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleUpdateItem = (
    itemId: string,
    name: string,
    budget: number,
    options?: { isFixedCharge?: boolean; dueDateDay?: number; isPaidThisMonth?: boolean; excludeFromAnalytics?: boolean }
  ) => {
    setBudgetData((prev) => ({
      ...prev,
      items: prev.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              name,
              budget,
              ...(options?.isFixedCharge !== undefined && { isFixedCharge: options.isFixedCharge }),
              ...(options?.dueDateDay !== undefined && { dueDateDay: options.dueDateDay }),
              ...(options?.isPaidThisMonth !== undefined && { isPaidThisMonth: options.isPaidThisMonth }),
              ...(options?.excludeFromAnalytics !== undefined && { excludeFromAnalytics: options.excludeFromAnalytics }),
            }
          : i
      ),
    }));
  };

  const handleDeleteItem = (itemId: string) => {
    setBudgetData((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== itemId),
      transactions: prev.transactions.filter((t) => t.itemId !== itemId),
    }));
  };

  const handleAddTransaction = (tx: {
    type?: 'expense' | 'income';
    desc: string;
    amount: number;
    category: CategoryType;
    itemId: string;
    date: string;
    time: string;
    notes?: string;
    addToGlobalIncome?: boolean;
  }) => {
    const newTx = {
      id: `tx-${Date.now()}`,
      ...tx,
    };
    const today = new Date().toISOString().substring(0, 10);

    setBudgetData((prev) => {
      let updatedIncome = prev.income;
      let newLogs = prev.strategyLogs || [];

      if (tx.type === 'income') {
        if (tx.addToGlobalIncome) {
          updatedIncome = prev.income + tx.amount;
        }
        const log = {
          id: `strat-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'income' as const,
          title: 'Entrée d\'argent / Revenu imprévu',
          details: `Ajout de +${tx.amount} ${prev.currency} (${tx.desc})${tx.addToGlobalIncome ? ' au revenu mensuel global' : ''}`,
          oldVal: `${prev.income} ${prev.currency}`,
          newVal: `${updatedIncome} ${prev.currency}`,
        };
        newLogs = [log, ...newLogs];
      }

      return {
        ...prev,
        income: updatedIncome,
        transactions: [newTx, ...prev.transactions],
        strategyLogs: newLogs,
        reminderConfig: {
          enabled: true,
          inactivityThresholdHours: 18,
          dailyCheckinTime: '20:00',
          consecutiveStreakDays: (prev.reminderConfig?.consecutiveStreakDays || 1),
          ...prev.reminderConfig,
          lastExpenseLogged: new Date().toISOString(),
          lastAppOpen: new Date().toISOString(),
          lastExpenseLoggedDate: today,
          lastAppOpenDate: today,
        },
      };
    });

    if (tx.type === 'income') {
      setAppliedNotice(`Revenu imprévu de +${tx.amount} ${budgetData.currency} enregistré avec succès !`);
      setTimeout(() => setAppliedNotice(null), 4000);
    }
  };

  const handleUpdateTransaction = (
    txId: string,
    updatedTx: {
      type?: 'expense' | 'income';
      desc: string;
      amount: number;
      category: CategoryType;
      itemId: string;
      date: string;
      time: string;
      notes?: string;
      addToGlobalIncome?: boolean;
    }
  ) => {
    setBudgetData((prev) => {
      const oldTx = prev.transactions.find((t) => t.id === txId);
      let updatedIncome = prev.income;
      if (oldTx && oldTx.type === 'income' && oldTx.addToGlobalIncome) {
        updatedIncome = Math.max(0, updatedIncome - oldTx.amount);
      }
      if (updatedTx.type === 'income' && updatedTx.addToGlobalIncome) {
        updatedIncome += updatedTx.amount;
      }

      return {
        ...prev,
        income: updatedIncome,
        transactions: prev.transactions.map((t) =>
          t.id === txId
            ? {
                ...t,
                type: updatedTx.type || 'expense',
                desc: updatedTx.desc,
                amount: updatedTx.amount,
                category: updatedTx.category,
                itemId: updatedTx.itemId,
                date: updatedTx.date,
                time: updatedTx.time,
                notes: updatedTx.notes,
                addToGlobalIncome: updatedTx.addToGlobalIncome,
              }
            : t
        ),
      };
    });
    setAppliedNotice(`L'opération "${updatedTx.desc}" a été modifiée avec succès !`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const handleDeleteTransaction = (txId: string) => {
    setBudgetData((prev) => {
      const targetTx = prev.transactions.find((t) => t.id === txId);
      let updatedIncome = prev.income;
      if (targetTx && targetTx.type === 'income' && targetTx.addToGlobalIncome) {
        updatedIncome = Math.max(0, prev.income - targetTx.amount);
      }
      return {
        ...prev,
        income: updatedIncome,
        transactions: prev.transactions.filter((t) => t.id !== txId),
      };
    });
  };

  const handleMarkNoExpenseToday = () => {
    const nowIso = new Date().toISOString();
    const today = nowIso.substring(0, 10);
    setBudgetData((prev) => ({
      ...prev,
      reminderConfig: {
        enabled: true,
        inactivityThresholdHours: 18,
        dailyCheckinTime: '20:00',
        lastAppOpen: nowIso,
        ...prev.reminderConfig,
        lastExpenseLogged: nowIso,
        lastExpenseLoggedDate: today,
        lastNoExpenseLoggedDate: today,
        consecutiveStreakDays: (prev.reminderConfig?.consecutiveStreakDays || 1) + 1,
      },
    }));
    setAppliedNotice('✅ Journée sans dépense validée ! +1 jour de série.');
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const handleUpdateReminderConfig = (newConfig: Partial<SmartReminderConfig>) => {
    setBudgetData((prev) => ({
      ...prev,
      reminderConfig: {
        enabled: true,
        inactivityThresholdHours: 18,
        dailyCheckinTime: '20:00',
        lastAppOpen: new Date().toISOString(),
        lastExpenseLogged: new Date().toISOString(),
        consecutiveStreakDays: 1,
        ...prev.reminderConfig,
        ...newConfig,
      },
    }));
  };

  const handleAddExpensePreset = (preset: ExpensePreset) => {
    setBudgetData((prev) => {
      const existingPresets = prev.expensePresets || [];
      const existingIndex = existingPresets.findIndex(
        (p) => p.title.trim().toLowerCase() === preset.title.trim().toLowerCase()
      );
      let updatedPresets: ExpensePreset[];
      if (existingIndex >= 0) {
        updatedPresets = [...existingPresets];
        updatedPresets[existingIndex] = { ...updatedPresets[existingIndex], ...preset };
      } else {
        updatedPresets = [...existingPresets, preset];
      }
      return {
        ...prev,
        expensePresets: updatedPresets,
      };
    });
    setAppliedNotice(`⭐ Modèle type "${preset.title}" (${preset.amount} ${budgetData.currency}) enregistré avec succès !`);
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const handleDeleteExpensePreset = (presetId: string) => {
    setBudgetData((prev) => ({
      ...prev,
      expensePresets: (prev.expensePresets || []).filter((p) => p.id !== presetId),
    }));
  };

  const handleUpdateUserAccount = (account: UserAccount) => {
    setBudgetData((prev) => ({
      ...prev,
      userAccount: account,
    }));
  };

  const handleLogAdvisorInteraction = (userPrompt: string, aiResponse: string, proposalsCount: number) => {
    const newLog: AdvisorLog = {
      id: `adv-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userPrompt,
      aiResponse,
      proposalsCount,
    };
    setBudgetData((prev) => ({
      ...prev,
      advisorLogs: [newLog, ...(prev.advisorLogs || [])],
    }));
  };

  const handleLogAuditRun = (audit: AIAuditResult) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: audit.generatedAt || new Date().toISOString(),
      health: audit.overallHealth,
      score: audit.healthScore,
      burnRateDaily: audit.burnRateDaily,
      summary: audit.summary,
      findingsCount: (audit.keyFindings || []).length,
    };
    setBudgetData((prev) => ({
      ...prev,
      auditLogs: [newLog, ...(prev.auditLogs || [])],
    }));
  };

  const handleUpdateGoals = (updatedGoals: any[], logEntry?: any) => {
    setBudgetData((prev) => {
      const logs = logEntry ? [logEntry, ...(prev.strategyLogs || [])] : prev.strategyLogs || [];
      return {
        ...prev,
        goals: updatedGoals,
        strategyLogs: logs,
      };
    });
  };

  const handleAddContributionFromGoal = (goalTitle: string, amount: number) => {
    handleAddTransaction({
      desc: `Versement Objectif: ${goalTitle}`,
      amount,
      category: 'savings',
      itemId: 'item-projets',
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: 'Versement direct vers la rubrique Objectifs',
    });
  };

  const handleExecuteTransfer = (fromId: string, toId: string, amount: number, note: string) => {
    setBudgetData((prev) => {
      let fromName = 'Source';
      let toName = 'Destination';

      let updatedWallets = prev.wallets || [];
      let updatedItems = prev.items || [];
      let updatedGoals = prev.goals || [];

      // Deduct from Source (allowing negative balance/allocation bypass)
      if (fromId.startsWith('wallet-')) {
        const w = updatedWallets.find((x) => x.id === fromId);
        if (w) fromName = w.name;
        updatedWallets = updatedWallets.map((w) => (w.id === fromId ? { ...w, balance: w.balance - amount } : w));
      } else if (fromId.startsWith('item-')) {
        const item = updatedItems.find((x) => x.id === fromId);
        if (item) fromName = `${item.name} (${item.category.toUpperCase()})`;
        updatedItems = updatedItems.map((item) => (item.id === fromId ? { ...item, budget: item.budget - amount } : item));
      } else if (fromId.startsWith('goal-')) {
        const g = updatedGoals.find((x) => x.id === fromId);
        if (g) fromName = `Objectif: ${g.title}`;
        updatedGoals = updatedGoals.map((g) => (g.id === fromId ? { ...g, currentAmount: g.currentAmount - amount } : g));
      }

      // Add to Destination
      if (toId.startsWith('wallet-')) {
        const w = updatedWallets.find((x) => x.id === toId);
        if (w) toName = w.name;
        updatedWallets = updatedWallets.map((w) => (w.id === toId ? { ...w, balance: w.balance + amount } : w));
      } else if (toId.startsWith('item-')) {
        const item = updatedItems.find((x) => x.id === toId);
        if (item) toName = `${item.name} (${item.category.toUpperCase()})`;
        updatedItems = updatedItems.map((item) => (item.id === toId ? { ...item, budget: item.budget + amount } : item));
      } else if (toId.startsWith('goal-')) {
        const g = updatedGoals.find((x) => x.id === toId);
        if (g) toName = `Objectif: ${g.title}`;
        updatedGoals = updatedGoals.map((g) => (g.id === toId ? { ...g, currentAmount: g.currentAmount + amount } : g));
      }

      const newTransfer = {
        id: `tr-${Date.now()}`,
        fromWalletId: fromId,
        fromWalletName: fromName,
        toWalletId: toId,
        toWalletName: toName,
        amount,
        note,
        timestamp: new Date().toISOString(),
      };

      const logEntry = {
        id: `tr-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item' as const,
        title: `Transfert Inter-Cibles : ${fromName} ➔ ${toName}`,
        details: `Montant: ${amount} ${prev.currency} | Motif: "${note}"`,
        newVal: `${amount} ${prev.currency}`,
      };

      return {
        ...prev,
        wallets: updatedWallets,
        items: updatedItems,
        goals: updatedGoals,
        transfers: [newTransfer, ...(prev.transfers || [])],
        strategyLogs: [logEntry, ...(prev.strategyLogs || [])],
      };
    });
  };

  const handleAddWallet = (
    name: string,
    type: any,
    initialBalance: number,
    icon: string,
    excludeFromAnalytics?: boolean
  ) => {
    setBudgetData((prev) => {
      const newWallet = {
        id: `wallet-${Date.now()}`,
        name,
        type,
        balance: initialBalance,
        icon,
        excludeFromAnalytics: excludeFromAnalytics || false,
      };
      const logEntry = {
        id: `w-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item' as const,
        title: `Nouveau Portefeuille Créé : ${name}`,
        details: `Type: ${type} | Solde initial: ${initialBalance} ${prev.currency}${
          excludeFromAnalytics ? ' | [Caisse Noire - Exclu de l\'audit]' : ''
        }`,
        newVal: `${initialBalance} ${prev.currency}`,
      };
      return {
        ...prev,
        wallets: [...(prev.wallets || []), newWallet],
        strategyLogs: [logEntry, ...(prev.strategyLogs || [])],
      };
    });
  };

  const handleToggleWalletExcludeAnalytics = (walletId: string) => {
    setBudgetData((prev) => ({
      ...prev,
      wallets: (prev.wallets || []).map((w) =>
        w.id === walletId ? { ...w, excludeFromAnalytics: !w.excludeFromAnalytics } : w
      ),
    }));
  };

  const handlePayFixedBill = (item: BudgetItem) => {
    handleAddTransaction({
      type: 'expense',
      desc: `Facture Fixe : ${item.name}`,
      amount: item.budget,
      category: item.category,
      itemId: item.id,
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toTimeString().substring(0, 5),
      notes: `Paiement charge fixe (Jour ${item.dueDateDay || 5})`,
    });
    handleUpdateItem(item.id, item.name, item.budget, {
      isFixedCharge: true,
      dueDateDay: item.dueDateDay,
      isPaidThisMonth: true,
      excludeFromAnalytics: item.excludeFromAnalytics,
    });
    setAppliedNotice(`Facture "${item.name}" de ${item.budget} ${budgetData.currency} enregistrée comme payée !`);
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  const handleDeleteWallet = (walletId: string) => {
    setBudgetData((prev) => ({
      ...prev,
      wallets: (prev.wallets || []).filter((w) => w.id !== walletId),
    }));
  };

  const handleDeletePeriodArchive = (reportId: string) => {
    setBudgetData((prev) => ({
      ...prev,
      monthlyReports: (prev.monthlyReports || []).filter((r) => r.id !== reportId),
    }));
    setAppliedNotice('🗑️ Archive du projet supprimée avec succès.');
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const handleCreateNewPeriod = (
    periodMonth: string,
    recordDate: string,
    income: number,
    strategy: StrategyType,
    mode: 'blank' | 'copy',
    rolloverAmount?: number,
    itemRollovers?: { sourceItemName: string; targetItemName: string; amount: number }[]
  ) => {
    setBudgetData((prev) => {
      // 1. Snapshot and archive current active month completely
      const currentNeedsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'needs' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const currentWantsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'wants' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const currentSavingsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'savings' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const totalSpent = currentNeedsSpent + currentWantsSpent + currentSavingsSpent;

      const currentArchive: MonthlyReportArchive = {
        id: `rep-${prev.selectedPeriodMonth || '2026-08'}-${Date.now()}`,
        periodMonth: prev.selectedPeriodMonth || '2026-08',
        recordDate: recordDate || new Date().toLocaleDateString('fr-FR'),
        allocatedBudget: prev.income,
        strategy: prev.strategy,
        customRatios: prev.customRatios,
        currency: prev.currency,
        totalNeedsSpent: currentNeedsSpent,
        totalWantsSpent: currentWantsSpent,
        totalSavingsAllocated: currentSavingsSpent,
        totalSpent,
        remainingBalance: prev.income - totalSpent,
        itemsSnapshot: JSON.parse(JSON.stringify(prev.items || [])),
        transactionsSnapshot: JSON.parse(JSON.stringify(prev.transactions || [])),
        notes: `Horodatage ${recordDate} : Budget archivé lors du lancement du projet ${periodMonth}`,
      };

      // 2. Prepare new items for the new project
      let newItems: BudgetItem[] = [];
      if (mode === 'copy') {
        // Fresh clones with reset payment and carriedOver states
        newItems = prev.items.map((it) => ({
          ...it,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          isPaidThisMonth: false,
          carriedOverBudget: 0,
          carriedOverSource: undefined,
        }));
      } else {
        newItems = [
          { id: `item-loyer-${Date.now()}`, name: 'Loyer & Logement', budget: Math.round(income * 0.3), category: 'needs' as const },
          { id: `item-courses-${Date.now()}`, name: 'Alimentation & Courses', budget: Math.round(income * 0.2), category: 'needs' as const },
          { id: `item-sorties-${Date.now()}`, name: 'Restaurants & Sorties', budget: Math.round(income * 0.2), category: 'wants' as const },
          { id: `item-epargne-${Date.now()}`, name: 'Fonds de Secours / Épargne', budget: Math.round(income * 0.2), category: 'savings' as const },
        ];
      }

      // 3. Apply item-level rollovers from previous month (Reste d'ancien budget)
      let totalItemRolloversAmount = 0;
      if (itemRollovers && itemRollovers.length > 0) {
        itemRollovers.forEach((ro) => {
          totalItemRolloversAmount += ro.amount;
          const target = newItems.find(
            (it) => it.name.trim().toLowerCase() === ro.targetItemName.trim().toLowerCase()
          );
          if (target) {
            target.carriedOverBudget = (target.carriedOverBudget || 0) + ro.amount;
            target.carriedOverSource = `Reste ${ro.sourceItemName} (${prev.selectedPeriodMonth || 'Ancien Projet'})`;
          } else {
            newItems.push({
              id: `item-ro-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: ro.targetItemName,
              budget: 0,
              carriedOverBudget: ro.amount,
              carriedOverSource: `Reste ${ro.sourceItemName} (${prev.selectedPeriodMonth || 'Ancien Projet'})`,
              category: 'needs',
            });
          }
        });
      }

      // 4. Global cash rollover (if enabled)
      const rollVal = rolloverAmount && rolloverAmount > 0 ? rolloverAmount : 0;
      const totalEffectiveIncome = income + rollVal + totalItemRolloversAmount;

      const newTransactions: any[] = [];
      if (rollVal > 0) {
        newTransactions.push({
          id: `tx-rollover-${Date.now()}`,
          type: 'income' as const,
          desc: `Report Global de Solde (${prev.selectedPeriodMonth || 'Mois Précédent'})`,
          date: recordDate || new Date().toLocaleDateString('fr-FR'),
          time: new Date().toTimeString().substring(0, 5),
          amount: rollVal,
          category: 'savings' as const,
          itemId: '',
          notes: 'Report global validé manuellement par l’utilisateur'
        });
      }

      const logEntry = {
        id: `p-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'strategy' as const,
        title: `Nouveau Projet Mensuel : ${periodMonth}`,
        details: `Revenu: ${income} ${prev.currency}${rollVal > 0 ? ` + Report global: ${rollVal} ${prev.currency}` : ''}${totalItemRolloversAmount > 0 ? ` + Reports postes: ${totalItemRolloversAmount} ${prev.currency}` : ''} | Stratégie: ${strategy}`,
        newVal: `${totalEffectiveIncome} ${prev.currency}`,
      };

      const updatedReports = [
        currentArchive,
        ...(prev.monthlyReports || []).filter((r) => r.periodMonth !== currentArchive.periodMonth && r.periodMonth !== periodMonth),
      ];

      const newState: BudgetState = {
        ...prev,
        income: totalEffectiveIncome,
        strategy,
        selectedPeriodMonth: periodMonth,
        items: newItems,
        transactions: newTransactions,
        monthlyReports: updatedReports,
        strategyLogs: [logEntry, ...(prev.strategyLogs || [])],
        lastUpdated: new Date().toISOString(),
      };

      // Persist immediately to localStorage and create emergency snapshot
      saveBudgetState(newState, true);

      // Persist immediately to Firestore
      if (auth.currentUser) {
        saveUserBudgetToFirestore(auth.currentUser.uid, newState).catch((err) =>
          console.error('Error saving new project to Firestore:', err)
        );
      }

      return newState;
    });

    setAppliedNotice(`✅ Nouveau Projet "${periodMonth}" validé et créé avec succès ! Données précédentes archivées.`);
    setTimeout(() => setAppliedNotice(null), 5000);
  };

  const handleSwitchToPeriod = (targetPeriodMonth: string) => {
    setBudgetData((prev) => {
      if (prev.selectedPeriodMonth === targetPeriodMonth) return prev;

      // 1. Snapshot current month before switching
      const currentNeedsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'needs' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const currentWantsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'wants' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const currentSavingsSpent = (prev.transactions || [])
        .filter((t) => t.category === 'savings' && t.type !== 'income')
        .reduce((a, c) => a + c.amount, 0);
      const totalSpent = currentNeedsSpent + currentWantsSpent + currentSavingsSpent;

      const currentArchive: MonthlyReportArchive = {
        id: `rep-${prev.selectedPeriodMonth || 'archive'}-${Date.now()}`,
        periodMonth: prev.selectedPeriodMonth || '2026-08',
        recordDate: new Date().toLocaleDateString('fr-FR'),
        allocatedBudget: prev.income,
        strategy: prev.strategy,
        customRatios: prev.customRatios,
        currency: prev.currency,
        totalNeedsSpent: currentNeedsSpent,
        totalWantsSpent: currentWantsSpent,
        totalSavingsAllocated: currentSavingsSpent,
        totalSpent,
        remainingBalance: prev.income - totalSpent,
        itemsSnapshot: JSON.parse(JSON.stringify(prev.items || [])),
        transactionsSnapshot: JSON.parse(JSON.stringify(prev.transactions || [])),
        notes: `Sauvegardé automatiquement lors de la bascule vers le projet ${targetPeriodMonth}`,
      };

      // 2. Find target archive in monthlyReports or fallback to autoBackups
      let targetArchive = (prev.monthlyReports || []).find((r) => r.periodMonth === targetPeriodMonth);

      if (!targetArchive) {
        // Search autoBackups for recovery
        const backups = getAutoBackups();
        for (const bk of backups) {
          const matched = (bk.data.monthlyReports || []).find((r) => r.periodMonth === targetPeriodMonth);
          if (matched) {
            targetArchive = matched;
            break;
          }
          if (bk.data.selectedPeriodMonth === targetPeriodMonth) {
            targetArchive = {
              id: `rep-${targetPeriodMonth}-recovered`,
              periodMonth: targetPeriodMonth,
              recordDate: bk.timestamp.substring(0, 10),
              allocatedBudget: bk.data.income,
              strategy: bk.data.strategy,
              currency: bk.data.currency,
              totalNeedsSpent: 0,
              totalWantsSpent: 0,
              totalSavingsAllocated: 0,
              totalSpent: 0,
              remainingBalance: bk.data.income,
              itemsSnapshot: bk.data.items,
              transactionsSnapshot: bk.data.transactions,
              notes: 'Restauré depuis une sauvegarde automatique',
            };
            break;
          }
        }
      }

      if (!targetArchive) {
        const simpleSwitch: BudgetState = {
          ...prev,
          selectedPeriodMonth: targetPeriodMonth,
          monthlyReports: [currentArchive, ...(prev.monthlyReports || []).filter((r) => r.periodMonth !== currentArchive.periodMonth)],
          lastUpdated: new Date().toISOString(),
        };
        saveBudgetState(simpleSwitch, true);
        if (auth.currentUser) {
          saveUserBudgetToFirestore(auth.currentUser.uid, simpleSwitch);
        }
        return simpleSwitch;
      }

      // 3. Load target archive data into active state
      const updatedReports = [
        currentArchive,
        ...(prev.monthlyReports || []).filter((r) => r.periodMonth !== currentArchive.periodMonth && r.periodMonth !== targetPeriodMonth),
      ];

      const switchedState: BudgetState = {
        ...prev,
        selectedPeriodMonth: targetArchive.periodMonth,
        income: targetArchive.allocatedBudget,
        strategy: targetArchive.strategy,
        customRatios: targetArchive.customRatios || prev.customRatios,
        items: targetArchive.itemsSnapshot || [],
        transactions: targetArchive.transactionsSnapshot || [],
        monthlyReports: updatedReports,
        lastUpdated: new Date().toISOString(),
      };

      // Persist immediately
      saveBudgetState(switchedState, true);
      if (auth.currentUser) {
        saveUserBudgetToFirestore(auth.currentUser.uid, switchedState).catch((err) =>
          console.error('Error switching project in Firestore:', err)
        );
      }

      return switchedState;
    });

    setAppliedNotice(`📂 Projet ${targetPeriodMonth} chargé ! Vos données précédentes ont été sauvegardées.`);
    setTimeout(() => setAppliedNotice(null), 4000);
  };

  const handleApplyPosteRollover = (
    sourcePeriod: string,
    sourceItemName: string,
    targetItemId: string,
    amount: number
  ) => {
    setBudgetData((prev) => {
      const targetItem = prev.items.find((i) => i.id === targetItemId);
      if (!targetItem) return prev;

      const updatedItems = prev.items.map((i) =>
        i.id === targetItemId
          ? {
              ...i,
              carriedOverBudget: (i.carriedOverBudget || 0) + amount,
              carriedOverSource: `Report ${sourceItemName} (${sourcePeriod})`,
            }
          : i
      );

      const logEntry = {
        id: `ro-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item' as const,
        title: `Report Reste de Poste : ${sourceItemName} ➔ ${targetItem.name}`,
        details: `Montant reporté : +${amount} ${prev.currency} depuis le projet ${sourcePeriod}. Identifié comme reste d'ancien budget.`,
        newVal: `+${amount} ${prev.currency}`,
      };

      return {
        ...prev,
        income: prev.income + amount,
        items: updatedItems,
        strategyLogs: [logEntry, ...(prev.strategyLogs || [])],
        lastUpdated: new Date().toISOString(),
      };
    });

    setAppliedNotice(`✅ +${amount} ${budgetData.currency} reportés depuis "${sourceItemName}" comme reste d'ancien budget !`);
    setTimeout(() => setAppliedNotice(null), 5000);
  };

  const handleClearItemRollover = (itemId: string) => {
    setBudgetData((prev) => {
      const targetItem = prev.items.find((i) => i.id === itemId);
      const carriedAmount = targetItem?.carriedOverBudget || 0;
      return {
        ...prev,
        income: Math.max(0, prev.income - carriedAmount),
        items: prev.items.map((i) =>
          i.id === itemId
            ? { ...i, carriedOverBudget: 0, carriedOverSource: undefined }
            : i
        ),
      };
    });
    setAppliedNotice(`Reste reporté réinitialisé pour ce poste.`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const handleReset = () => {
    const reset = resetBudgetState();
    setBudgetData(reset);
    setAuditResult(null);
    setAppliedNotice('🔄 Données réinitialisées aux valeurs par défaut.');
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const handleCompleteOnboarding = (config: {
    currency: string;
    income: number;
    startClean: boolean;
  }) => {
    localStorage.setItem('smartbudget_onboarding_done', 'true');
    if (config.startClean) {
      const clean = createCleanBudgetState(config.currency, config.income);
      setBudgetData(clean);
      setAuditResult(null);
      setAppliedNotice('✨ Votre budget vierge a été configuré avec succès !');
    } else {
      setBudgetData((prev) => ({
        ...prev,
        currency: config.currency,
        income: config.income,
      }));
      setAppliedNotice('✨ Démo SmartBudget chargée !');
    }
    setTimeout(() => setAppliedNotice(null), 3500);
  };

  const handleOpenQuickAdd = (category?: CategoryType, itemId?: string, initialType: 'expense' | 'income' = 'expense') => {
    setEditingTransaction(null);
    setQuickAddCategory(category);
    setQuickAddItemId(itemId);
    setQuickAddInitialType(initialType);
    setIsQuickAddOpen(true);
  };

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setQuickAddCategory(tx.category);
    setQuickAddItemId(tx.itemId);
    setQuickAddInitialType(tx.type || 'expense');
    setIsQuickAddOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Animated Splash & Load Screen */}
      {showSplash && <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Top Banner for Live Update Notifications */}
      {hasUpdateAvailable && !dismissedBanner && (
        <UpdateNotificationBanner
          version={appVersion}
          updateInfo={updateInfo}
          onRefresh={() => handlePerformAppUpdate()}
          onDismiss={() => setDismissedBanner(true)}
          onOpenMobileModal={() => setIsApkModalOpen(true)}
        />
      )}

      {/* Responsive Container or Mobile Frame Preview */}
      <div
        className={
          isMobileFrame
            ? 'max-w-md mx-auto my-0 sm:my-6 w-full shadow-2xl rounded-none sm:rounded-[40px] overflow-hidden border-0 sm:border-[8px] border-emerald-950 bg-slate-50 min-h-screen sm:min-h-[844px] flex flex-col relative'
            : 'w-full max-w-5xl mx-auto min-h-screen flex flex-col relative bg-slate-50'
        }
      >
        {/* Header */}
        <MobileHeader
          budgetData={budgetData}
          onCurrencyChange={handleUpdateCurrency}
          onReset={handleReset}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenMobileModal={() => setIsApkModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenProjectsManager={() => setIsProjectsManagerOpen(true)}
          onOpenWalletTransfer={() => setIsWalletModalOpen(true)}
          onOpenBackupManager={() => setIsBackupModalOpen(true)}
          onOpenDocumentation={() => setIsDocumentationOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onQuickCheckUpdate={() => handleCheckForUpdates(undefined, undefined, true)}
          isCheckingUpdate={isCheckingUpdate}
          hasUpdateAvailable={hasUpdateAvailable}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame((prev) => !prev)}
        />

        {/* Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 overflow-y-auto space-y-4">
          {/* Dashboard Header with Budget Date selector and New Budget Project button */}
          <DashboardHeader
            budgetData={budgetData}
            onSelectPeriodMonth={handleSwitchToPeriod}
            onOpenNewPeriodModal={() => setIsNewPeriodOpen(true)}
            onOpenPosteRolloverModal={() => setIsPosteRolloverOpen(true)}
            onOpenProjectsManager={() => setIsProjectsManagerOpen(true)}
            onUpdateIncome={handleUpdateIncome}
            onDeletePeriodArchive={handleDeletePeriodArchive}
          />

          {/* Smart Reminder Banner */}
          <SmartReminderBanner
            budgetData={budgetData}
            onOpenQuickAdd={() => handleOpenQuickAdd()}
            onMarkNoExpenseToday={handleMarkNoExpenseToday}
            onUpdateConfig={handleUpdateReminderConfig}
          />

          {/* Toast / Notification when AI adjustment is applied */}
          {appliedNotice && (
            <div className="p-3.5 bg-emerald-700 text-white font-semibold text-xs rounded-2xl shadow-lg flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{appliedNotice}</span>
            </div>
          )}

          {activeTab === 'plan' && (
            <TabPlanning
              budgetData={budgetData}
              onUpdateIncome={handleUpdateIncome}
              onUpdateStrategy={handleUpdateStrategy}
              onUpdateCustomRatios={handleUpdateCustomRatios}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onPayFixedBill={handlePayFixedBill}
              onOpenPosteRolloverModal={() => setIsPosteRolloverOpen(true)}
            />
          )}

          {activeTab === 'track' && (
            <TabTracking
              budgetData={budgetData}
              onOpenQuickAdd={handleOpenQuickAdd}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
              onEditTransaction={handleOpenEditTransaction}
            />
          )}

          {activeTab === 'goals' && (
            <TabGoals
              budgetData={budgetData}
              onUpdateGoals={handleUpdateGoals}
              onAddContributionTransaction={handleAddContributionFromGoal}
            />
          )}

          {activeTab === 'analytics' && <TabAnalytics budgetData={budgetData} />}

          {activeTab === 'activities' && (
            <TabActivities
              budgetData={budgetData}
              onOpenExport={() => setIsExportOpen(true)}
              onEditTransaction={handleOpenEditTransaction}
              onSwitchToPeriod={handleSwitchToPeriod}
              onOpenNewPeriodModal={() => setIsNewPeriodOpen(true)}
            />
          )}

          {(activeTab === 'advisor' || activeTab === 'audit') && (
            <TabAdvisor
              budgetData={budgetData}
              auditResult={auditResult}
              onSetAuditResult={setAuditResult}
              onApplyCustomRatios={handleUpdateCustomRatios}
              onApplyItemBudget={handleApplyItemBudget}
              onExecuteTransfer={handleExecuteTransfer}
              onLogAdvisorInteraction={handleLogAdvisorInteraction}
            />
          )}
        </main>

        {/* Floating Quick Add Button (FAB) */}
        <button
          onClick={() => handleOpenQuickAdd()}
          className="fixed bottom-20 right-4 sm:right-8 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg shadow-emerald-900/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-emerald-500"
          title="Ajouter une dépense rapide"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Bottom Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          auditHealthScore={auditResult?.healthScore}
        />
      </div>

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingTransaction(null);
        }}
        budgetData={budgetData}
        preselectedCategory={quickAddCategory}
        preselectedItemId={quickAddItemId}
        initialType={quickAddInitialType}
        editingTransaction={editingTransaction}
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onAddPreset={handleAddExpensePreset}
        onDeletePreset={handleDeleteExpensePreset}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        budgetData={budgetData}
        onImportData={(imported) => {
          setBudgetData(imported);
          setAuditResult(null);
        }}
        onOpenMobileModal={() => setIsApkModalOpen(true)}
      />

      <ApkUpdateModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        currentVersion={appVersion}
        currentBuildHash={currentBuildHash}
        githubConfig={budgetData.githubUpdateConfig}
        updateInfo={updateInfo}
        isCheckingUpdate={isCheckingUpdate}
        isFirestoreReleaseConnected={isFirestoreReleaseConnected}
        onCheckUpdate={(repo, branch) => handleCheckForUpdates(repo, branch, false)}
        onPerformUpdate={(targetLiveUrl) => handlePerformAppUpdate(targetLiveUrl)}
        onSaveGithubConfig={handleSaveGithubConfig}
        onPublishReleaseUpdate={handlePublishReleaseUpdate}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userAccount={budgetData.userAccount}
        onUpdateAccount={handleUpdateUserAccount}
        onSyncNow={handleSyncNow}
      />

      <WalletTransferModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        budgetData={budgetData}
        onExecuteTransfer={handleExecuteTransfer}
        onAddWallet={handleAddWallet}
        onToggleWalletExcludeAnalytics={handleToggleWalletExcludeAnalytics}
        onDeleteWallet={handleDeleteWallet}
      />

      <NewPeriodModal
        isOpen={isNewPeriodOpen}
        onClose={() => setIsNewPeriodOpen(false)}
        budgetData={budgetData}
        onCreateNewPeriod={handleCreateNewPeriod}
        onSwitchToPeriod={handleSwitchToPeriod}
        onDeletePeriodArchive={handleDeletePeriodArchive}
      />

      <PosteRolloverModal
        isOpen={isPosteRolloverOpen}
        onClose={() => setIsPosteRolloverOpen(false)}
        budgetData={budgetData}
        onApplyPosteRollover={handleApplyPosteRollover}
        onClearItemRollover={handleClearItemRollover}
      />

      <ProjectsManagerModal
        isOpen={isProjectsManagerOpen}
        onClose={() => setIsProjectsManagerOpen(false)}
        budgetData={budgetData}
        onSwitchToPeriod={handleSwitchToPeriod}
        onOpenNewPeriodModal={() => setIsNewPeriodOpen(true)}
        onDeletePeriodArchive={handleDeletePeriodArchive}
      />

      <BackupManagerModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        budgetData={budgetData}
        onRestoreState={(restored) => {
          setBudgetData(restored);
          if (auth.currentUser) {
            saveUserBudgetToFirestore(auth.currentUser.uid, restored);
          }
        }}
        onForceCloudSync={async () => {
          if (auth.currentUser) {
            await saveUserBudgetToFirestore(auth.currentUser.uid, budgetData);
          } else {
            saveBudgetState(budgetData, true);
          }
        }}
      />

      <DocumentationModal
        isOpen={isDocumentationOpen}
        onClose={() => setIsDocumentationOpen(false)}
      />

      <OnboardingGuideModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={handleCompleteOnboarding}
        currentCurrency={budgetData.currency}
        currentIncome={budgetData.income}
      />
    </div>
  );
}

