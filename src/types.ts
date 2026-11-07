export type CategoryType = 'needs' | 'wants' | 'savings';

export type StrategyType = 'balanced' | 'aggressive' | 'light' | 'custom';

export interface Transaction {
  id: string;
  type?: 'expense' | 'income';
  desc: string;
  date: string;
  time: string;
  amount: number;
  category: CategoryType;
  itemId: string;
  notes?: string;
  addToGlobalIncome?: boolean;
}

export interface BudgetItem {
  id: string;
  name: string;
  budget: number;
  category: CategoryType;
  carriedOverBudget?: number; // Reste reporté de l'ancien budget (reliquat)
  carriedOverSource?: string; // Origine du reste reporté (ex: "Report Courses - Août 2026")
  isFixedCharge?: boolean;
  dueDateDay?: number;
  isPaidThisMonth?: boolean;
  fixedBillAmount?: number;
  excludeFromAnalytics?: boolean;
  notes?: string;
}

export interface CustomRatios {
  needs: number;
  wants: number;
  savings: number;
}

export interface SmartReminderConfig {
  enabled: boolean;
  inactivityThresholdHours: number; // e.g. 12, 24, 48
  dailyCheckinTime: string; // e.g. "20:00"
  lastAppOpen: string;
  lastExpenseLogged: string;
  consecutiveStreakDays: number;
  lastAppOpenDate?: string;
  lastExpenseLoggedDate?: string;
  lastNoExpenseLoggedDate?: string;
}

export interface FeatureManifestItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'ai' | 'sync' | 'analytics' | 'ux';
  addedInVersion: string;
  isNew?: boolean;
}

export interface GitHubUpdateConfig {
  repoUrl: string; // e.g. "karim/smartbudget-mobile" or full GitHub URL
  branch: string; // e.g. "main"
  autoCheckOnStartup: boolean;
  masterServerUrl?: string;
  apkDownloadUrl?: string;
  installedFeatureIds?: string[];
  lastInstalledVersion?: string;
  lastInstalledBuildHash?: string;
  lastInstalledCommitSha?: string;
  lastInstalledCommitMsg?: string;
  lastCheckedAt?: string;
}

export interface AppUpdateInfo {
  hasUpdate: boolean;
  updateSource: 'github' | 'server' | 'firestore' | 'both' | 'none';
  version: string;
  buildNumber?: number;
  buildHash: string;
  lastModified?: string;
  releaseNotes: string[];
  features?: FeatureManifestItem[];
  newFeaturesDetected?: FeatureManifestItem[];
  modifiedModules?: string[];
  totalFilesScanned?: number;
  apkDownloadUrl?: string;
  liveWebUrl?: string;
  githubCommit?: {
    sha: string;
    shortSha: string;
    message: string;
    author: string;
    date: string;
    url: string;
    repoFullName: string;
    branch: string;
  } | null;
  githubError?: string | null;
  checkedAt: string;
}

export interface UserAccount {
  email: string;
  name: string;
  isLoggedIn: boolean;
  syncMode: 'cloud' | 'local';
  lastSyncedAt?: string;
}

export interface StrategyLog {
  id: string;
  timestamp: string;
  type: 'strategy' | 'income' | 'ratio' | 'item';
  title: string;
  details: string;
  oldVal?: string;
  newVal?: string;
}

export interface AdvisorLog {
  id: string;
  timestamp: string;
  userPrompt: string;
  aiResponse: string;
  proposalsCount?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  health: 'EXCELLENT' | 'BON' | 'ATTENTION' | 'CRITIQUE';
  score: number;
  burnRateDaily: number;
  summary: string;
  findingsCount: number;
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'emergency' | 'housing' | 'travel' | 'investment' | 'vehicle' | 'other';
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  status: 'in_progress' | 'completed' | 'paused';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletAccount {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'emergency' | 'investment';
  balance: number;
  icon?: string;
  accountNumber?: string;
  excludeFromAnalytics?: boolean;
}

export interface WalletTransfer {
  id: string;
  fromWalletId: string;
  fromWalletName: string;
  toWalletId: string;
  toWalletName: string;
  amount: number;
  note?: string;
  timestamp: string;
}

export interface MonthlyReportArchive {
  id: string;
  periodMonth: string; // e.g., "2026-08" or "08/2026"
  recordDate: string; // e.g., "04/08/2026"
  allocatedBudget: number;
  strategy: StrategyType;
  customRatios: CustomRatios;
  currency: string;
  totalNeedsSpent: number;
  totalWantsSpent: number;
  totalSavingsAllocated: number;
  totalSpent: number;
  remainingBalance: number;
  itemsSnapshot: BudgetItem[];
  transactionsSnapshot?: Transaction[]; // Capture complète des transactions du mois
  notes?: string;
}

export interface ExpensePreset {
  id: string;
  title: string;
  amount: number;
  category: CategoryType;
  itemId?: string;
  icon?: string;
  notes?: string;
}

export interface BudgetState {
  income: number;
  currency: string;
  strategy: StrategyType;
  customRatios: CustomRatios;
  items: BudgetItem[];
  transactions: Transaction[];
  expensePresets?: ExpensePreset[];
  goals?: FinancialGoal[];
  wallets?: WalletAccount[];
  transfers?: WalletTransfer[];
  monthlyReports?: MonthlyReportArchive[];
  selectedPeriodMonth?: string; // YYYY-MM
  lastUpdated: string;
  reminderConfig?: SmartReminderConfig;
  githubUpdateConfig?: GitHubUpdateConfig;
  userAccount?: UserAccount;
  strategyLogs?: StrategyLog[];
  advisorLogs?: AdvisorLog[];
  auditLogs?: AuditLog[];
}

export interface AIActionProposal {
  id: string;
  title: string;
  description: string;
  actionType: 'adjust_ratios' | 'adjust_item_budget' | 'add_savings_target' | 'update_goal_allocation' | 'create_goal' | 'transfer_envelope_budget';
  ratios?: CustomRatios;
  itemId?: string;
  newItemBudget?: number;
  goalId?: string;
  newMonthlyContribution?: number;
  goalData?: Partial<FinancialGoal>;
  transferData?: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    amount: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  mathData?: {
    totalSpent?: number;
    remaining?: number;
    topCategory?: string;
  };
  proposals?: AIActionProposal[];
}

export interface AIAuditResult {
  overallHealth: 'EXCELLENT' | 'BON' | 'ATTENTION' | 'CRITIQUE';
  healthScore: number;
  burnRateDaily: number;
  daysRemainingInMonth: number;
  projectedEndMonthSpent: number;
  projectedSavings: number;
  summary: string;
  mathAnalysis: {
    income: number;
    totalAllocated: number;
    totalSpent: number;
    remainingGlobal: number;
    needsSpent: number;
    needsTarget: number;
    wantsSpent: number;
    wantsTarget: number;
    savingsAllocated: number;
    savingsTarget: number;
  };
  keyFindings: string[];
  actionPlan: string[];
  proposals?: AIActionProposal[];
  generatedAt: string;
}

