import React from 'react';
import { Plus, Trash2, Scale, Flame, Smile, Settings, AlertTriangle, Lock, Unlock, Pin } from 'lucide-react';
import { BudgetItem, BudgetState, CategoryType, StrategyType } from '../types';
import { calculateFinancialMetrics } from '../lib/financialMath';
import { FixedChargesSection } from './FixedChargesSection';

interface TabPlanningProps {
  budgetData: BudgetState;
  onUpdateIncome: (income: number) => void;
  onUpdateStrategy: (strategy: StrategyType) => void;
  onUpdateCustomRatios: (ratios: { needs: number; wants: number; savings: number }) => void;
  onAddItem: (category: CategoryType, name: string, budget: number, options?: { isFixedCharge?: boolean; dueDateDay?: number; excludeFromAnalytics?: boolean }) => void;
  onUpdateItem: (itemId: string, name: string, budget: number, options?: { isFixedCharge?: boolean; dueDateDay?: number; isPaidThisMonth?: boolean; excludeFromAnalytics?: boolean }) => void;
  onDeleteItem: (itemId: string) => void;
  onPayFixedBill?: (item: BudgetItem) => void;
  onOpenPosteRolloverModal?: () => void;
}

export const TabPlanning: React.FC<TabPlanningProps> = ({
  budgetData,
  onUpdateIncome,
  onUpdateStrategy,
  onUpdateCustomRatios,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onPayFixedBill,
  onOpenPosteRolloverModal,
}) => {
  const metrics = calculateFinancialMetrics(budgetData);

  const totalCustom =
    budgetData.customRatios.needs + budgetData.customRatios.wants + budgetData.customRatios.savings;
  const isCustomError = budgetData.strategy === 'custom' && totalCustom !== 100;

  const strategies = [
    {
      id: 'balanced',
      label: 'Équilibré (50/30/20)',
      icon: Scale,
      color: 'border-slate-700 bg-slate-800 text-slate-200',
    },
    {
      id: 'aggressive',
      label: 'Agressif (30/20/50)',
      icon: Flame,
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      id: 'light',
      label: 'Léger (50/45/5)',
      icon: Smile,
      color: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
    },
    {
      id: 'custom',
      label: 'Personnalisé',
      icon: Settings,
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
  ] as const;

  const renderCategoryBox = (category: CategoryType, title: string, colorClass: string, badgeBg: string) => {
    const items = budgetData.items.filter((i) => i.category === category);
    const allocated = metrics.allocated[category];
    const target = metrics.targets[category];
    const diff = target - allocated;
    const isOver = diff < 0;

    return (
      <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm space-y-4">
        {/* Category Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeBg}`}>
            {(metrics.ratios[category] * 100).toFixed(0)}% du Revenu
          </span>
        </div>

        {/* Target vs Allocated summary */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Cible</span>
            <span className="font-mono font-bold text-slate-800">
              {target.toFixed(0)} {budgetData.currency}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Planifié</span>
            <span className="font-mono font-bold text-emerald-600">
              {allocated.toFixed(0)} {budgetData.currency}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] font-medium uppercase tracking-wider">Marge</span>
            <span className={`font-mono font-bold ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isOver ? `${diff.toFixed(0)}` : `+${diff.toFixed(0)}`} {budgetData.currency}
            </span>
          </div>
        </div>

        {/* Item List */}
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    onUpdateItem(item.id, e.target.value, item.budget, {
                      isFixedCharge: item.isFixedCharge,
                      dueDateDay: item.dueDateDay,
                      isPaidThisMonth: item.isPaidThisMonth,
                      excludeFromAnalytics: item.excludeFromAnalytics,
                    })
                  }
                  className="flex-1 bg-white text-xs text-slate-800 font-bold border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nom du poste..."
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={item.budget || ''}
                    onChange={(e) =>
                      onUpdateItem(item.id, item.name, parseFloat(e.target.value) || 0, {
                        isFixedCharge: item.isFixedCharge,
                        dueDateDay: item.dueDateDay,
                        isPaidThisMonth: item.isPaidThisMonth,
                        excludeFromAnalytics: item.excludeFromAnalytics,
                      })
                    }
                    className="w-20 bg-white text-right text-xs text-slate-900 font-mono font-bold border border-slate-200 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">{budgetData.currency}</span>
                </div>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Supprimer ce poste"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Carried over budget badge (Reste reporté de l'ancien budget) */}
              {(item.carriedOverBudget || 0) > 0 && (
                <div className="flex items-center justify-between bg-teal-50/90 border border-teal-200 rounded-xl px-2.5 py-1 text-[10px] text-teal-950 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-teal-700">📦 Reste reporté d'ancien budget :</span>
                    <span className="font-mono font-extrabold text-teal-900">+{item.carriedOverBudget} {budgetData.currency}</span>
                    {item.carriedOverSource && (
                      <span className="text-teal-700">({item.carriedOverSource})</span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    Total dispo: <strong className="font-mono text-slate-900">{(item.budget || 0) + (item.carriedOverBudget || 0)} {budgetData.currency}</strong>
                  </span>
                </div>
              )}

              {/* Item options toolbar: Fixed Charge & Caisse Noire */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-200/50 text-[10px]">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateItem(item.id, item.name, item.budget, {
                      isFixedCharge: !item.isFixedCharge,
                      dueDateDay: item.dueDateDay || 5,
                      isPaidThisMonth: item.isPaidThisMonth,
                      excludeFromAnalytics: item.excludeFromAnalytics,
                    })
                  }
                  className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-colors ${
                    item.isFixedCharge
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                  }`}
                  title="Marquer comme facture/charge fixe obligatoire récurrente"
                >
                  <Pin className="w-3 h-3" />
                  <span>{item.isFixedCharge ? '📌 Charge Fixe' : 'Rendre Charge Fixe'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateItem(item.id, item.name, item.budget, {
                      isFixedCharge: item.isFixedCharge,
                      dueDateDay: item.dueDateDay,
                      isPaidThisMonth: item.isPaidThisMonth,
                      excludeFromAnalytics: !item.excludeFromAnalytics,
                    })
                  }
                  className={`px-2 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-colors ${
                    item.excludeFromAnalytics
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                  }`}
                  title="Caisse Noire: déduit du solde global mais exclu des analyses et de l'audit"
                >
                  {item.excludeFromAnalytics ? <Lock className="w-3 h-3 text-amber-600" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                  <span>{item.excludeFromAnalytics ? '🔒 Caisse Noire (Hors-Analyse)' : 'Activer Caisse Noire'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <button
          onClick={() => onAddItem(category, 'Nouveau poste', 100)}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center space-x-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un poste</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* Income & Strategy Card */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            1. Planification & Allocation du Budget
          </h2>
        </div>

        {/* Income Input */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Revenu Net Mensuel ({budgetData.currency})
          </label>
          <div className="relative">
            <input
              type="number"
              value={budgetData.income || ''}
              onChange={(e) => onUpdateIncome(parseFloat(e.target.value) || 0)}
              placeholder="Ex: 1800"
              className="w-full bg-slate-50/80 text-slate-900 font-mono font-bold text-2xl border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
            <span className="absolute right-4 top-4 text-xs text-slate-400 font-bold">
              {budgetData.currency} / mois
            </span>
          </div>
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Stratégie d'Allocation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {strategies.map((strat) => {
              const isSelected = budgetData.strategy === strat.id;
              const Icon = strat.icon;
              return (
                <button
                  key={strat.id}
                  onClick={() => onUpdateStrategy(strat.id as StrategyType)}
                  className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300 font-bold shadow-xs'
                      : 'bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-medium leading-tight">{strat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Ratios inputs if custom */}
        {budgetData.strategy === 'custom' && (
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-900">Ratios Personnalisés</span>
              <span
                className={`text-xs font-bold ${
                  totalCustom === 100 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                Total: {totalCustom}% {totalCustom === 100 ? '✓' : '(Doit être 100%)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                  Besoins %
                </label>
                <input
                  type="number"
                  value={budgetData.customRatios.needs}
                  onChange={(e) =>
                    onUpdateCustomRatios({
                      ...budgetData.customRatios,
                      needs: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white text-slate-900 font-mono font-bold text-center border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                  Plaisirs %
                </label>
                <input
                  type="number"
                  value={budgetData.customRatios.wants}
                  onChange={(e) =>
                    onUpdateCustomRatios({
                      ...budgetData.customRatios,
                      wants: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white text-slate-900 font-mono font-bold text-center border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-600 font-semibold mb-1">
                  Épargne %
                </label>
                <input
                  type="number"
                  value={budgetData.customRatios.savings}
                  onChange={(e) =>
                    onUpdateCustomRatios({
                      ...budgetData.customRatios,
                      savings: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white text-slate-900 font-mono font-bold text-center border border-slate-200 rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {isCustomError && (
              <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> La somme des 3 catégories doit être égale à 100%.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rubrique Charges & Factures Fixes (Dedicated Section) */}
      <FixedChargesSection
        budgetData={budgetData}
        onAddItem={onAddItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        onPayFixedBill={onPayFixedBill || (() => {})}
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">🔴 Besoins</span>
          <span className="text-base font-mono font-bold text-rose-600 block mt-1">
            {metrics.targets.needs.toFixed(0)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            Planifié: {metrics.allocated.needs.toFixed(0)}
          </span>
        </div>
        <div className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">🟡 Plaisirs</span>
          <span className="text-base font-mono font-bold text-amber-600 block mt-1">
            {metrics.targets.wants.toFixed(0)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            Planifié: {metrics.allocated.wants.toFixed(0)}
          </span>
        </div>
        <div className="p-4 rounded-[24px] bg-white border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">🟢 Épargne</span>
          <span className="text-base font-mono font-bold text-emerald-600 block mt-1">
            {metrics.targets.savings.toFixed(0)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            Planifié: {metrics.allocated.savings.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Category Lists */}
      <div className="space-y-4">
        {renderCategoryBox('needs', 'Charges Fixes & Besoins (🔴)', 'bg-rose-500', 'bg-rose-50 text-rose-700 border border-rose-100')}
        {renderCategoryBox('wants', 'Plaisirs & Envies (🟡)', 'bg-amber-500', 'bg-amber-50 text-amber-700 border border-amber-100')}
        {renderCategoryBox('savings', 'Épargne & Investissement (🟢)', 'bg-emerald-500', 'bg-emerald-50 text-emerald-700 border border-emerald-100')}
      </div>
    </div>
  );
};
