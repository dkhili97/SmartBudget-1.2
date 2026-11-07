import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, CheckCircle2, Sparkles, FolderPlus, Layers, Copy, Trash2, ArrowRight, RotateCcw, Wallet, ExternalLink, Check } from 'lucide-react';
import { BudgetState, StrategyType, MonthlyReportArchive, CategoryType } from '../types';

interface NewPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  onCreateNewPeriod: (
    periodMonth: string,
    recordDate: string,
    income: number,
    strategy: StrategyType,
    mode: 'blank' | 'copy',
    rolloverAmount?: number,
    itemRollovers?: { sourceItemName: string; targetItemName: string; amount: number }[]
  ) => void;
  onSwitchToPeriod?: (periodMonth: string) => void;
  onDeletePeriodArchive?: (reportId: string) => void;
}

interface PosteRolloverEntry {
  enabled: boolean;
  amount: number;
  targetItemName: string;
}

function getNextMonthString(currentMonthStr?: string): string {
  if (!currentMonthStr || !/^\d{4}-\d{2}$/.test(currentMonthStr)) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const [yearStr, monthStr] = currentMonthStr.split('-');
  let y = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10) + 1;
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, '0')}`;
}

export const NewPeriodModal: React.FC<NewPeriodModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onCreateNewPeriod,
  onSwitchToPeriod,
  onDeletePeriodArchive,
}) => {
  const currency = budgetData.currency || 'TND';
  const todayFormatted = new Date().toLocaleDateString('fr-FR');

  // Calculate items with leftover budget in active month
  const itemsWithRest = budgetData.items.map((item) => {
    const spent = (budgetData.transactions || [])
      .filter((t) => t.itemId === item.id && t.type !== 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalItemCapacity = (item.budget || 0) + (item.carriedOverBudget || 0);
    const rest = Math.max(0, totalItemCapacity - spent);
    return {
      ...item,
      spent,
      rest,
    };
  });

  // Calculate global surplus
  const totalSpentInCurrent = (budgetData.transactions || [])
    .filter((t) => t.type !== 'income')
    .reduce((a, c) => a + (c.amount || 0), 0);
  const extraIncomeInCurrent = (budgetData.transactions || [])
    .filter((t) => t.type === 'income')
    .reduce((a, c) => a + (c.amount || 0), 0);
  const calculatedSurplus = Math.max(0, (budgetData.income || 0) + extraIncomeInCurrent - totalSpentInCurrent);

  const [periodMonth, setPeriodMonth] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(todayFormatted);
  const [income, setIncome] = useState<string>('2000');
  const [strategy, setStrategy] = useState<StrategyType>('balanced');
  const [creationMode, setCreationMode] = useState<'blank' | 'copy'>('copy');
  
  // Global Rollover state
  const [enableRollover, setEnableRollover] = useState<boolean>(false);
  const [rolloverAmount, setRolloverAmount] = useState<string>('0');

  // Poste-by-poste Rollover state: Record<itemId, { enabled: boolean; amount: number; targetItemName: string }>
  const [posteRollovers, setPosteRollovers] = useState<Record<string, { enabled: boolean; amount: number; targetItemName: string }>>({});

  // Reset/Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      const nextM = getNextMonthString(budgetData.selectedPeriodMonth);
      setPeriodMonth(nextM);
      setRecordDate(new Date().toLocaleDateString('fr-FR'));
      setIncome(budgetData.income ? budgetData.income.toString() : '2000');
      setStrategy(budgetData.strategy || 'balanced');
      setCreationMode('copy');
      setEnableRollover(false);
      setRolloverAmount(calculatedSurplus > 0 ? calculatedSurplus.toFixed(2) : '0');

      // Initialize poste rollovers mapping
      const initialMap: Record<string, { enabled: boolean; amount: number; targetItemName: string }> = {};
      itemsWithRest.forEach((it) => {
        initialMap[it.id] = {
          enabled: false,
          amount: Math.round(it.rest * 100) / 100,
          targetItemName: it.name,
        };
      });
      setPosteRollovers(initialMap);
    }
  }, [isOpen, budgetData.selectedPeriodMonth, budgetData.income, budgetData.strategy]);

  if (!isOpen) return null;

  // Check if target month already exists in archives
  const monthAlreadyExists = (budgetData.monthlyReports || []).some(
    (r) => r.periodMonth === periodMonth
  ) || budgetData.selectedPeriodMonth === periodMonth;

  const handleTogglePoste = (itemId: string, enabled: boolean) => {
    setPosteRollovers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        enabled,
      },
    }));
  };

  const handleUpdatePosteAmount = (itemId: string, amount: number) => {
    setPosteRollovers((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        amount,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incVal = parseFloat(income);
    if (!incVal || incVal <= 0) return;
    if (!periodMonth || !/^\d{4}-\d{2}$/.test(periodMonth)) return;

    const rollVal = enableRollover ? (parseFloat(rolloverAmount) || 0) : 0;

    // Collect individual poste rollovers
    const selectedItemRollovers = (Object.entries(posteRollovers) as [string, PosteRolloverEntry][])
      .filter(([_, val]) => val.enabled && val.amount > 0)
      .map(([itemId, val]) => {
        const item = itemsWithRest.find((i) => i.id === itemId);
        return {
          sourceItemName: item?.name || 'Poste',
          targetItemName: val.targetItemName || item?.name || 'Poste',
          amount: val.amount,
        };
      });

    onCreateNewPeriod(
      periodMonth,
      recordDate,
      incVal,
      strategy,
      creationMode,
      rollVal,
      selectedItemRollovers
    );
    onClose();
  };

  const handleDuplicateArchive = (report: MonthlyReportArchive) => {
    setIncome(report.allocatedBudget.toString());
    setStrategy(report.strategy);
    setCreationMode('copy');
    // Also suggest next month based on this report
    setPeriodMonth(getNextMonthString(report.periodMonth));
  };

  const activeReports = budgetData.monthlyReports || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col my-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Lancer un Nouveau Projet Mensuel
              </h2>
              <p className="text-xs text-slate-500">
                Créez une nouvelle période sans écraser vos budgets précédents
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Safeguard Notification */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 leading-relaxed font-medium flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>Sauvegarde Totale :</strong> Votre projet actuel <strong>{budgetData.selectedPeriodMonth || 'En cours'}</strong> sera entièrement archivé avec ses postes et transactions dans l'historique avant le démarrage du nouveau mois.
            </div>
          </div>

          {/* Month / Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mois du Nouveau Projet (AAAA-MM)
              </label>
              <input
                type="month"
                required
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              {monthAlreadyExists && (
                <p className="text-[10px] text-amber-600 font-semibold mt-1">
                  ⚠️ Un projet pour ce mois existe déjà dans l'historique ou est actif.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Date de Création (JJ/MM/AAAA)
              </label>
              <input
                type="text"
                required
                placeholder="ex: 01/09/2026"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Base Net Income */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Revenu Net de Base Alloué ({currency})
            </label>
            <input
              type="number"
              min="100"
              step="any"
              required
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SECTION: Postes-by-Poste Rollover */}
          <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-teal-950 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Report du Reste Poste par Poste ({currency})</span>
              </span>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
                Précision Fiable
              </span>
            </div>

            <p className="text-[10px] text-teal-900 leading-tight">
              Cochez les postes de l'ancien mois ({budgetData.selectedPeriodMonth || 'Actuel'}) dont vous souhaitez reporter le reliquat non dépensé. Le système l'identifiera clairement comme <strong>Reste de l'ancien budget</strong> sans l'afficher en surplus négatif.
            </p>

            {itemsWithRest.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic">Aucun poste dans le mois précédent.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 pt-1">
                {itemsWithRest.map((item) => {
                  const currentConf = posteRollovers[item.id] || { enabled: false, amount: item.rest, targetItemName: item.name };
                  return (
                    <div
                      key={item.id}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        currentConf.enabled
                          ? 'bg-white border-teal-400 shadow-xs'
                          : 'bg-white/60 border-teal-100 hover:bg-white'
                      }`}
                    >
                      <label className="flex items-center space-x-2 cursor-pointer flex-1 mr-2">
                        <input
                          type="checkbox"
                          checked={currentConf.enabled}
                          onChange={(e) => handleTogglePoste(item.id, e.target.checked)}
                          className="w-4 h-4 accent-teal-600 rounded border-slate-300 focus:ring-teal-500"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-[11px]">{item.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            Budget: {item.budget} • Dépensé: {item.spent.toFixed(0)} • Reste: <strong className="text-teal-700">+{item.rest.toFixed(1)} {currency}</strong>
                          </span>
                        </div>
                      </label>

                      {currentConf.enabled && (
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-bold text-teal-900">Reporter:</span>
                          <input
                            type="number"
                            step="any"
                            value={currentConf.amount}
                            onChange={(e) => handleUpdatePosteAmount(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <span className="text-[10px] font-bold text-teal-700">{currency}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Cash Rollover Balance Section */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 font-extrabold text-slate-900 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableRollover}
                  onChange={(e) => setEnableRollover(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Report Global de Trésorerie Restante ({currency})</span>
                </span>
              </label>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {calculatedSurplus > 0 ? `+${calculatedSurplus.toFixed(2)} ${currency} estimé` : 'Solde neutre'}
              </span>
            </div>

            <p className="text-[10px] text-slate-600 font-medium leading-tight">
              Ajouter une entrée de trésorerie globale du reliquat général restant du mois précédent.
            </p>

            {enableRollover && (
              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-900">Montant du report global :</span>
                <input
                  type="number"
                  step="any"
                  value={rolloverAmount}
                  onChange={(e) => setRolloverAmount(e.target.value)}
                  className="w-32 px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-700">{currency}</span>
              </div>
            )}
          </div>

          {/* Strategy selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Stratégie d'Allocation
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as StrategyType)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="balanced">Équilibré (50% Besoins / 30% Envies / 20% Épargne)</option>
              <option value="aggressive">Aggressif Épargne (40% Besoins / 20% Envies / 40% Épargne)</option>
              <option value="light">Confort / Plaisir (60% Besoins / 30% Envies / 10% Épargne)</option>
              <option value="custom">Sur Mesure (Ratios Personnalisés)</option>
            </select>
          </div>

          {/* Creation Mode Options */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Mode de Démarrage du Projet
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCreationMode('copy')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  creationMode === 'copy'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold">Copier la Structure (Recommandé)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal leading-tight">
                  Reprend vos postes et budgets actuels, avec dépenses remises à zéro.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode('blank')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  creationMode === 'blank'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-extrabold">Projet Vierge</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal leading-tight">
                  Repart de zéro avec les postes par défaut standards.
                </span>
              </button>
            </div>
          </div>

          {/* Existing Archived Projects (Historique & Bascule) */}
          {activeReports.length > 0 && (
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  📂 Projets Archivés ({activeReports.length})
                </label>
                <span className="text-[10px] text-slate-400">Cliquez "Ouvrir" pour consulter ou réactiver</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{r.periodMonth}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Budget: {r.allocatedBudget} {r.currency} | Dépensé: {r.totalSpent} {r.currency}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {onSwitchToPeriod && (
                        <button
                          type="button"
                          onClick={() => {
                            onSwitchToPeriod(r.periodMonth);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg flex items-center space-x-1 transition-colors"
                          title="Bascule vers ce projet pour le consulter et le modifier"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ouvrir</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDuplicateArchive(r)}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 font-bold text-[10px] rounded-lg flex items-center space-x-1 transition-colors"
                        title="Dupliquer la configuration de ce projet"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Dupliquer</span>
                      </button>

                      {onDeletePeriodArchive && (
                        <button
                          type="button"
                          onClick={() => onDeletePeriodArchive(r.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Supprimer ce projet archivé"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Valider & Créer le Projet ({periodMonth || 'Nouveau'})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
