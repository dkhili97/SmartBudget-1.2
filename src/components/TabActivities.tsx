import React, { useState } from 'react';
import {
  History,
  ReceiptText,
  Sliders,
  Bot,
  Calculator,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronRight,
  FolderClock,
  Layers,
  Pencil,
  FolderKanban,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import { BudgetState, CategoryType, Transaction, StrategyLog, AdvisorLog, AuditLog } from '../types';
import { getUnifiedProjectList } from '../lib/storage';

interface TabActivitiesProps {
  budgetData: BudgetState;
  onOpenExport?: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onSwitchToPeriod?: (periodMonth: string) => void;
  onOpenNewPeriodModal?: () => void;
}

type ActivitySubTab = 'reporting' | 'expenses' | 'strategy' | 'advisor' | 'audits';

export const TabActivities: React.FC<TabActivitiesProps> = ({
  budgetData,
  onOpenExport,
  onEditTransaction,
  onSwitchToPeriod,
  onOpenNewPeriodModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ActivitySubTab>('reporting');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');

  const currency = budgetData.currency || 'TND';
  const monthlyReports = budgetData.monthlyReports || [];
  const unifiedProjects = getUnifiedProjectList(budgetData);

  // --- PART 1: EXPENSES LOGIC ---
  const filteredTransactions = budgetData.transactions.filter((tx) => {
    const matchesSearch =
      tx.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.notes && tx.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || tx.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalFilteredAmount = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const avgFilteredAmount = filteredTransactions.length > 0 ? totalFilteredAmount / filteredTransactions.length : 0;

  // --- PART 2: STRATEGY LOGS ---
  const strategyLogs: StrategyLog[] = budgetData.strategyLogs || [
    {
      id: 'strat-log-1',
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      type: 'income',
      title: 'Mise à jour du revenu mensuel',
      details: `Revenu fixé à ${budgetData.income} ${currency} / mois`,
      newVal: `${budgetData.income} ${currency}`,
    },
    {
      id: 'strat-log-2',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      type: 'strategy',
      title: 'Adoption de la stratégie d\'allocation',
      details: `Stratégie ${budgetData.strategy.toUpperCase()} active avec ratios ${budgetData.customRatios?.needs || 50}/${budgetData.customRatios?.wants || 30}/${budgetData.customRatios?.savings || 20}`,
      newVal: budgetData.strategy,
    },
  ];

  // --- PART 3: ADVISOR LOGS ---
  const advisorLogs: AdvisorLog[] = budgetData.advisorLogs || [
    {
      id: 'adv-log-1',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      userPrompt: 'Comment optimiser mon épargne ce mois-ci ?',
      aiResponse: 'Rapprochez-vous du ratio 20% en réservant directement vos virements de début de mois vers le Fonds d\'Urgence.',
      proposalsCount: 1,
    },
  ];

  // --- PART 4: AUDIT LOGS ---
  const auditLogs: AuditLog[] = budgetData.auditLogs || [
    {
      id: 'audit-log-1',
      timestamp: new Date().toISOString(),
      health: 'EXCELLENT',
      score: 92,
      burnRateDaily: 28.3,
      summary: 'Diagnostic très favorable. Dépenses maîtrisées et projections respectées.',
      findingsCount: 3,
    },
  ];

  // --- CSV EXPORT HANDLER FOR EXPENSES ---
  const handleExportExpensesCSV = () => {
    const headers = ['ID', 'Date', 'Heure', 'Description', 'Montant', 'Devise', 'Catégorie', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.time || '12:00',
      `"${tx.desc.replace(/"/g, '""')}"`,
      tx.amount,
      currency,
      tx.category,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LexBudget_Depenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PRINT / PDF HANDLER ---
  const handlePrintReport = () => {
    window.print();
  };

  const getCategoryBadge = (cat: CategoryType) => {
    switch (cat) {
      case 'needs':
        return <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">Besoins</span>;
      case 'wants':
        return <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">Envies</span>;
      case 'savings':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">Épargne</span>;
    }
  };

  return (
    <div className="space-y-5 pb-28 animate-fadeIn">
      {/* Central Header Card */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl border border-slate-200">
              <FolderClock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Centralisation des Activités & Historique
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Consignation intégrale des opérations, conseils, stratégies et audits AI
              </p>
            </div>
          </div>

          {/* Global Export Tools */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            <button
              onClick={handleExportExpensesCSV}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              title="Exporter les dépenses au format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintReport}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors"
              title="Imprimer / Imprimer en PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
          <button
            onClick={() => setActiveSubTab('reporting')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeSubTab === 'reporting'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <FolderKanban className={`w-4 h-4 ${activeSubTab === 'reporting' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-xs">Projets & Périodes</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
              {unifiedProjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeSubTab === 'expenses'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <ReceiptText className={`w-4 h-4 ${activeSubTab === 'expenses' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-xs">Dépenses</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
              {budgetData.transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('strategy')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeSubTab === 'strategy'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Sliders className={`w-4 h-4 ${activeSubTab === 'strategy' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-xs">Stratégies</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
              {strategyLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('advisor')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeSubTab === 'advisor'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Bot className={`w-4 h-4 ${activeSubTab === 'advisor' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-xs">Conseiller</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
              {advisorLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('audits')}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
              activeSubTab === 'audits'
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Calculator className={`w-4 h-4 ${activeSubTab === 'audits' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="text-xs">Audits</span>
            </div>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
              {auditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 0: PROJETS & PÉRIODES */}
      {activeSubTab === 'reporting' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white border border-emerald-200/80 text-slate-800 rounded-[24px] shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-emerald-600" />
                <span>Mes Projets & Historique des Périodes Mensuelles</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Consultez, réactivez et comparez tous vos budgets mensuels ({unifiedProjects.length} projets enregistrés).
              </p>
            </div>
            {onOpenNewPeriodModal && (
              <button
                type="button"
                onClick={onOpenNewPeriodModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Nouveau Projet</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {unifiedProjects.map((proj) => {
              const isCurrent = proj.isActive;
              const strategyLabel =
                proj.strategy === 'balanced'
                  ? 'Équilibrée (50/30/20)'
                  : proj.strategy === 'aggressive'
                  ? 'Agressive (30/20/50)'
                  : proj.strategy === 'light'
                  ? 'Légère (50/45/5)'
                  : 'Sur Mesure';

              return (
                <div
                  key={proj.periodMonth}
                  className={`p-5 bg-white border rounded-[28px] shadow-xs space-y-3 transition-colors ${
                    isCurrent
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200/90 hover:border-emerald-200'
                  }`}
                >
                  {/* Reporting Header Line */}
                  <div className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 ${
                    isCurrent ? 'bg-emerald-50/80 border-emerald-200/80 text-slate-800' : 'bg-slate-50/90 border-slate-200/80 text-slate-800'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          📆 Projet {proj.label} ({proj.periodMonth}) — Horodatage : {proj.recordDate}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px]">
                            ACTIF EN COURS
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-slate-700">
                        Budget alloué :{' '}
                        <strong className="text-emerald-700 font-mono text-sm">{proj.allocatedBudget} {currency}</strong>, stratégie{' '}
                        <strong className="text-slate-900">{strategyLabel}</strong> avec un solde restant de{' '}
                        <strong className="text-emerald-700 font-mono">{proj.remainingBalance} {currency}</strong>.
                      </p>
                    </div>

                    {!isCurrent && onSwitchToPeriod && (
                      <button
                        type="button"
                        onClick={() => onSwitchToPeriod(proj.periodMonth)}
                        className="self-start sm:self-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Activer ce Projet</span>
                      </button>
                    )}
                  </div>

                  {/* Details stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Budget Alloué</span>
                      <span className="font-mono font-black text-slate-800">{proj.allocatedBudget} {currency}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Dépenses Totales</span>
                      <span className="font-mono font-black text-amber-600">{proj.totalSpent} {currency}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Postes & Opérations</span>
                      <span className="font-mono font-bold text-slate-700">{proj.itemsCount} postes | {proj.transactionsCount} txs</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] text-emerald-700 font-bold uppercase block">Solde Restant</span>
                      <span className="font-mono font-black text-emerald-800">{proj.remainingBalance} {currency}</span>
                    </div>
                  </div>

                  {proj.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      💬 Note : "{proj.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 1: HISTORIQUE DES DÉPENSES */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-[24px] shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une dépense..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] text-slate-500 font-semibold mr-1 shrink-0">Filtrer:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  categoryFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tous ({budgetData.transactions.length})
              </button>
              <button
                onClick={() => setCategoryFilter('needs')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  categoryFilter === 'needs'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                Besoins
              </button>
              <button
                onClick={() => setCategoryFilter('wants')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  categoryFilter === 'wants'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Envies
              </button>
              <button
                onClick={() => setCategoryFilter('savings')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  categoryFilter === 'savings'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                Épargne
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Filtré</span>
              <span className="text-sm sm:text-base font-mono font-bold text-slate-900">
                {totalFilteredAmount.toFixed(0)} {currency}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Opérations</span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-700">
                {filteredTransactions.length}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Moyenne / Op.</span>
              <span className="text-sm sm:text-base font-mono font-bold text-teal-700">
                {avgFilteredAmount.toFixed(1)} {currency}
              </span>
            </div>
          </div>

          {/* Expense Items List */}
          <div className="bg-white border border-slate-200/90 rounded-[24px] shadow-xs divide-y divide-slate-100 overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <ReceiptText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Aucune dépense trouvée dans l'historique.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const linkedItem = budgetData.items.find((i) => i.id === tx.itemId);
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    className="p-3.5 hover:bg-emerald-50/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    title="Cliquer pour modifier cette opération"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                            <span>{tx.desc}</span>
                            <Pencil className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </h4>
                          {isIncome ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                              Revenu imprévu
                            </span>
                          ) : (
                            getCategoryBadge(tx.category)
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="font-mono">{tx.date} à {tx.time || '12:00'}</span>
                          {linkedItem && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{linkedItem.name}</span>
                            </>
                          )}
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="italic text-slate-400 truncate max-w-[150px]">"{tx.notes}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <span className={`text-sm font-mono font-bold block ${isIncome ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {isIncome ? '+' : '-'}{tx.amount} {currency}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-bold block group-hover:underline">
                          Modifier
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: HISTORIQUE DES STRATÉGIES & ALLOCATIONS */}
      {activeSubTab === 'strategy' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-white border border-slate-200/90 rounded-[24px] shadow-xs p-4 divide-y divide-slate-100">
            {strategyLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Aucune modification enregistrée.</p>
            ) : (
              strategyLogs.map((log) => (
                <div key={log.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                      {log.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                  {log.oldVal && log.newVal && (
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono pt-0.5">
                      <span className="line-through text-slate-400">{log.oldVal}</span>
                      <ChevronRight className="w-3 h-3 text-emerald-600" />
                      <span className="font-bold text-emerald-700">{log.newVal}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: HISTORIQUE DU CONSEILLER AI */}
      {activeSubTab === 'advisor' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-white border border-slate-200/90 rounded-[24px] shadow-xs p-4 space-y-3">
            {advisorLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Aucun échange avec le Conseiller AI enregistré.</p>
            ) : (
              advisorLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-emerald-600" />
                      Interactions Conseiller AI
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-800 font-medium">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Question :</span>
                    "{log.userPrompt}"
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-xs text-emerald-950">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block mb-0.5">Recommandation FinExpert AI :</span>
                    {log.aiResponse}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: HISTORIQUE DES AUDITS AI */}
      {activeSubTab === 'audits' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-white border border-slate-200/90 rounded-[24px] shadow-xs p-4 space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">Aucun audit historique enregistré.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {log.health} ({log.score}/100)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic font-medium">"{log.summary}"</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Burn rate: {log.burnRateDaily} {currency}/jour
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-mono font-bold text-sm text-emerald-800">
                      {log.score}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
