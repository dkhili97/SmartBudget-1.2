import { BudgetState, MonthlyReportArchive, StrategyType } from '../types';
import { INITIAL_BUDGET_STATE } from '../data/initialData';

const STORAGE_KEY = 'budgetApp_Final_Karim';
const BACKUP_KEY = 'budgetApp_AutoBackups_Karim';
const LAST_12H_BACKUP_KEY = 'budgetApp_Last12hBackup_Timestamp';

export interface SavedBackup {
  id: string;
  timestamp: string;
  label: string;
  transactionCount: number;
  itemCount: number;
  income: number;
  data: BudgetState;
}

export interface UnifiedProject {
  periodMonth: string;
  label: string;
  isActive: boolean;
  allocatedBudget: number;
  totalSpent: number;
  remainingBalance: number;
  strategy: StrategyType;
  recordDate: string;
  itemsCount: number;
  transactionsCount: number;
  archiveId?: string;
  notes?: string;
}

/**
 * Returns all projects unified (active project + all saved archives),
 * sorted chronologically (newest first). Never omits the active project.
 */
export function getUnifiedProjectList(state: BudgetState): UnifiedProject[] {
  const currency = state.currency || 'TND';
  const activeMonth = state.selectedPeriodMonth || '2026-08';

  // Compute active month metrics
  const activeNeeds = (state.transactions || [])
    .filter((t) => t.category === 'needs' && t.type !== 'income')
    .reduce((a, c) => a + c.amount, 0);
  const activeWants = (state.transactions || [])
    .filter((t) => t.category === 'wants' && t.type !== 'income')
    .reduce((a, c) => a + c.amount, 0);
  const activeSavings = (state.transactions || [])
    .filter((t) => t.category === 'savings' && t.type !== 'income')
    .reduce((a, c) => a + c.amount, 0);
  const activeTotalSpent = activeNeeds + activeWants + activeSavings;

  const projectMap = new Map<string, UnifiedProject>();

  const formatPeriodLabel = (p: string) => {
    if (!p) return 'Période';
    const parts = p.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        const dateObj = new Date(year, month - 1, 1);
        return dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      }
    }
    return p;
  };

  // 1. Add Active Project first
  projectMap.set(activeMonth, {
    periodMonth: activeMonth,
    label: formatPeriodLabel(activeMonth),
    isActive: true,
    allocatedBudget: state.income,
    totalSpent: activeTotalSpent,
    remainingBalance: state.income - activeTotalSpent,
    strategy: state.strategy,
    recordDate: new Date().toLocaleDateString('fr-FR'),
    itemsCount: (state.items || []).length,
    transactionsCount: (state.transactions || []).length,
    notes: 'Projet en cours d\'utilisation (Actif)',
  });

  // 2. Add all archived reports from monthlyReports
  (state.monthlyReports || []).forEach((r) => {
    if (r.periodMonth === activeMonth) {
      // Don't overwrite the active one, but preserve archiveId
      const current = projectMap.get(activeMonth);
      if (current) current.archiveId = r.id;
      return;
    }

    projectMap.set(r.periodMonth, {
      periodMonth: r.periodMonth,
      label: formatPeriodLabel(r.periodMonth),
      isActive: false,
      allocatedBudget: r.allocatedBudget,
      totalSpent: r.totalSpent,
      remainingBalance: r.remainingBalance,
      strategy: r.strategy,
      recordDate: r.recordDate,
      itemsCount: (r.itemsSnapshot || []).length,
      transactionsCount: (r.transactionsSnapshot || []).length,
      archiveId: r.id,
      notes: r.notes,
    });
  });

  // 3. Check auto-backups to recover any projects that might have been lost
  try {
    const backups = getAutoBackups();
    backups.forEach((b) => {
      if (b.data && Array.isArray(b.data.monthlyReports)) {
        b.data.monthlyReports.forEach((rep) => {
          if (!projectMap.has(rep.periodMonth)) {
            projectMap.set(rep.periodMonth, {
              periodMonth: rep.periodMonth,
              label: formatPeriodLabel(rep.periodMonth),
              isActive: false,
              allocatedBudget: rep.allocatedBudget,
              totalSpent: rep.totalSpent,
              remainingBalance: rep.remainingBalance,
              strategy: rep.strategy,
              recordDate: rep.recordDate,
              itemsCount: (rep.itemsSnapshot || []).length,
              transactionsCount: (rep.transactionsSnapshot || []).length,
              archiveId: rep.id,
              notes: rep.notes || 'Restauré depuis sauvegarde automatique',
            });
          }
        });
      }
      if (b.data && b.data.selectedPeriodMonth && !projectMap.has(b.data.selectedPeriodMonth)) {
        projectMap.set(b.data.selectedPeriodMonth, {
          periodMonth: b.data.selectedPeriodMonth,
          label: formatPeriodLabel(b.data.selectedPeriodMonth),
          isActive: false,
          allocatedBudget: b.data.income || 0,
          totalSpent: 0,
          remainingBalance: b.data.income || 0,
          strategy: b.data.strategy || 'balanced',
          recordDate: new Date(b.timestamp).toLocaleDateString('fr-FR'),
          itemsCount: (b.data.items || []).length,
          transactionsCount: (b.data.transactions || []).length,
          notes: 'Restauré depuis historique',
        });
      }
    });
  } catch (e) {
    console.error('Error extracting projects from backups:', e);
  }

  // Sort descending by period (e.g. 2026-09, 2026-08, 2026-07)
  return Array.from(projectMap.values()).sort((a, b) => b.periodMonth.localeCompare(a.periodMonth));
}

export function checkAndPerform12hBackup(state: BudgetState, onNotify?: (message: string) => void): boolean {
  try {
    const lastBackupTime = localStorage.getItem(LAST_12H_BACKUP_KEY);
    const now = Date.now();
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

    if (!lastBackupTime || now - parseInt(lastBackupTime, 10) >= TWELVE_HOURS_MS) {
      const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      createBackupSnapshot(state, `Sauvegarde Automatique (Cycle 12H - ${timeStr})`);
      localStorage.setItem(LAST_12H_BACKUP_KEY, now.toString());
      if (onNotify) {
        onNotify(`💾 Sauvegarde automatique de vos données effectuée avec succès (Cycle 12h) !`);
      }
      return true;
    }
  } catch (e) {
    console.error('Error in 12h backup check:', e);
  }
  return false;
}

export function getAutoBackups(): SavedBackup[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading auto backups:', e);
    return [];
  }
}

export function createBackupSnapshot(state: BudgetState, label = 'Sauvegarde Automatique'): SavedBackup {
  const backups = getAutoBackups();
  const snapshot: SavedBackup = {
    id: `backup-${Date.now()}`,
    timestamp: new Date().toISOString(),
    label,
    transactionCount: (state.transactions || []).length,
    itemCount: (state.items || []).length,
    income: state.income || 0,
    data: state,
  };

  // Keep last 30 backups
  const updatedBackups = [snapshot, ...backups].slice(0, 30);
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(updatedBackups));
  } catch (e) {
    console.error('Error saving backup snapshot:', e);
  }
  return snapshot;
}

export function restoreAutoBackup(backupId: string): BudgetState | null {
  const backups = getAutoBackups();
  const target = backups.find((b) => b.id === backupId);
  if (target && target.data) {
    saveBudgetState(target.data, false); // Save without overriding backup list
    return target.data;
  }
  return null;
}

export function deleteBackupSnapshot(backupId: string): void {
  const backups = getAutoBackups();
  const filtered = backups.filter((b) => b.id !== backupId);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(filtered));
}

export function loadBudgetState(): BudgetState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saveBudgetState(INITIAL_BUDGET_STATE, true);
      return INITIAL_BUDGET_STATE;
    }
    const parsed = JSON.parse(saved);
    return {
      ...INITIAL_BUDGET_STATE,
      ...parsed,
      items: Array.isArray(parsed.items) ? parsed.items : INITIAL_BUDGET_STATE.items,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : INITIAL_BUDGET_STATE.transactions,
      goals: Array.isArray(parsed.goals) ? parsed.goals : INITIAL_BUDGET_STATE.goals,
      wallets: Array.isArray(parsed.wallets) && parsed.wallets.length > 0 ? parsed.wallets : INITIAL_BUDGET_STATE.wallets,
      transfers: Array.isArray(parsed.transfers) ? parsed.transfers : INITIAL_BUDGET_STATE.transfers,
      monthlyReports: Array.isArray(parsed.monthlyReports) && parsed.monthlyReports.length > 0 ? parsed.monthlyReports : INITIAL_BUDGET_STATE.monthlyReports,
      selectedPeriodMonth: parsed.selectedPeriodMonth || INITIAL_BUDGET_STATE.selectedPeriodMonth || '2026-08',
      customRatios: parsed.customRatios || INITIAL_BUDGET_STATE.customRatios,
      currency: parsed.currency || 'TND',
      reminderConfig: {
        ...INITIAL_BUDGET_STATE.reminderConfig,
        ...(parsed.reminderConfig || {}),
        lastAppOpen: new Date().toISOString(),
        lastAppOpenDate: new Date().toISOString().substring(0, 10),
      },
      githubUpdateConfig: {
        repoUrl: '',
        branch: 'main',
        autoCheckOnStartup: true,
        ...(parsed.githubUpdateConfig || {}),
      },
      userAccount: {
        ...INITIAL_BUDGET_STATE.userAccount,
        ...(parsed.userAccount || {}),
      },
    };
  } catch (error) {
    console.error('Error loading budget from localStorage:', error);
    return INITIAL_BUDGET_STATE;
  }
}

export function saveBudgetState(state: BudgetState, triggerBackup = true): void {
  try {
    const updated = {
      ...state,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (triggerBackup) {
      // Throttle automatic backups to max 1 per 2 minutes, unless transaction count changed
      const backups = getAutoBackups();
      const lastBackup = backups[0];
      const now = Date.now();
      const lastTime = lastBackup ? new Date(lastBackup.timestamp).getTime() : 0;
      const txCountDiff = (state.transactions || []).length !== (lastBackup?.transactionCount || 0);

      if (!lastBackup || now - lastTime > 2 * 60 * 1000 || txCountDiff) {
        createBackupSnapshot(updated, txCountDiff ? 'Sauvegarde (Nouvelle Transaction)' : 'Sauvegarde Automatique');
      }
    }
  } catch (error) {
    console.error('Error saving budget to localStorage:', error);
  }
}

/**
 * Safely backs up all user budget data, clears Service Worker & browser asset caches,
 * records the newly installed version/commit SHA, and reloads the application.
 */
export async function performCleanAppUpdate(
  state: BudgetState,
  updateDetails?: {
    version?: string;
    buildHash?: string;
    commitSha?: string;
    commitMsg?: string;
    installedFeatureIds?: string[];
    targetLiveUrl?: string;
  }
): Promise<void> {
  try {
    // 1. Create a dedicated pre-update backup snapshot so zero data can be lost
    const updatedState: BudgetState = {
      ...state,
      githubUpdateConfig: {
        repoUrl: state.githubUpdateConfig?.repoUrl || '',
        branch: state.githubUpdateConfig?.branch || 'main',
        autoCheckOnStartup: state.githubUpdateConfig?.autoCheckOnStartup ?? true,
        ...state.githubUpdateConfig,
        ...(updateDetails?.version && { lastInstalledVersion: updateDetails.version }),
        ...(updateDetails?.buildHash && { lastInstalledBuildHash: updateDetails.buildHash }),
        ...(updateDetails?.commitSha && { lastInstalledCommitSha: updateDetails.commitSha }),
        ...(updateDetails?.commitMsg && { lastInstalledCommitMsg: updateDetails.commitMsg }),
        ...(updateDetails?.installedFeatureIds && {
          installedFeatureIds: updateDetails.installedFeatureIds,
        }),
        lastCheckedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };

    createBackupSnapshot(
      updatedState,
      `Sauvegarde Pré-Mise à Jour (${updateDetails?.version || 'APK / Cloud Sync'})`
    );
    saveBudgetState(updatedState, false);

    // 2. Clear PWA / Service Worker caches so the phone fetches fresh code
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update();
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      } catch (swErr) {
        console.warn('Service worker update warning:', swErr);
      }
    }

    if ('caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      } catch (cacheErr) {
        console.warn('Cache clear warning:', cacheErr);
      }
    }
  } catch (e) {
    console.error('Error preparing clean app update:', e);
  }

  // 3. Reload with cache-busting parameter (or redirect to targetLiveUrl in OTA mode)
  const rawTargetUrl =
    typeof updateDetails?.targetLiveUrl === 'string'
      ? updateDetails.targetLiveUrl.trim()
      : '';

  if (rawTargetUrl && /^https?:\/\//i.test(rawTargetUrl)) {
    try {
      const liveUrl = new URL(rawTargetUrl);
      liveUrl.searchParams.set('updated', Date.now().toString());
      window.location.href = liveUrl.toString();
      return;
    } catch (urlErr) {
      console.warn('Invalid targetLiveUrl, falling back to standard reload:', urlErr);
    }
  }

  try {
    const url = new URL(window.location.href);
    url.searchParams.set('updated', Date.now().toString());
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export function resetBudgetState(): BudgetState {
  localStorage.removeItem(STORAGE_KEY);
  saveBudgetState(INITIAL_BUDGET_STATE);
  return INITIAL_BUDGET_STATE;
}

export function exportBudgetJSON(state: BudgetState): string {
  return JSON.stringify(state, null, 2);
}

export function importBudgetJSON(jsonString: string): BudgetState | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed.income === 'number' && Array.isArray(parsed.items) && Array.isArray(parsed.transactions)) {
      saveBudgetState(parsed);
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse budget JSON:', e);
    return null;
  }
}
