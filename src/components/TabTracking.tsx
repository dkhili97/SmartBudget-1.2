import React, { useState } from 'react';
import { Plus, Search, Trash2, Calendar, Clock, AlertCircle, CheckCircle2, DollarSign, Filter, Zap, Bookmark, Pencil } from 'lucide-react';
import { BudgetState, CategoryType, ExpensePreset, Transaction } from '../types';
import { getItemSpent } from '../lib/financialMath';

interface TabTrackingProps {
  budgetData: BudgetState;
  onOpenQuickAdd: (category?: CategoryType, itemId?: string, initialType?: 'expense' | 'income') => void;
  onDeleteTransaction: (txId: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onAddTransaction?: (tx: {
    type?: 'expense' | 'income';
    desc: string;
    amount: number;
    category: CategoryType;
    itemId: string;
    date: string;
    time: string;
    notes?: string;
  }) => void;
}

export const TabTracking: React.FC<TabTrackingProps> = ({
  budgetData,
  onOpenQuickAdd,
  onDeleteTransaction,
  onEditTransaction,
  onAddTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryType | 'all'>('all');

  const presets = budgetData.expensePresets || [
    { id: 'preset-cafe', title: 'Café & Expresso', amount: 2.0, category: 'wants', itemId: 'item-cafe', icon: '☕' },
    { id: 'preset-pain', title: 'Pain & Petit Déj', amount: 3.0, category: 'needs', itemId: 'item-courses', icon: '🥖' },
    { id: 'preset-transport', title: 'Transport / Taxi', amount: 5.0, category: 'needs', itemId: 'item-factures', icon: '🚕' },
  ];

  const handleQuickLogPreset = (preset: ExpensePreset) => {
    if (!onAddTransaction) {
      onOpenQuickAdd(preset.category, preset.itemId, 'expense');
      return;
    }
    const categoryItems = budgetData.items.filter((i) => i.category === preset.category);
    const targetItemId = (preset.itemId && budgetData.items.some((i) => i.id === preset.itemId))
      ? preset.itemId
      : (categoryItems[0]?.id || budgetData.items[0]?.id || '');

    if (!targetItemId) {
      onOpenQuickAdd(preset.category, undefined, 'expense');
      return;
    }

    onAddTransaction({
      type: 'expense',
      desc: preset.title,
      amount: preset.amount,
      category: preset.category,
      itemId: targetItemId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      notes: `⚡ Achat type 1-clic (${preset.title})`,
    });
  };

  const filteredTransactions = budgetData.transactions
    .filter((tx) => {
      const matchesCategory = selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;
      const matchesSearch =
        tx.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  const renderCategoryTracking = (category: CategoryType, title: string, badgeBg: string) => {
    const items = budgetData.items.filter((i) => i.category === category);

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <span>{title}</span>
          </h3>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onOpenQuickAdd(category, undefined, 'income')}
              className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center space-x-1 transition-all"
              title="Ajouter un revenu imprévu ou entrée d'argent"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ Revenu Imprévu</span>
            </button>
            <button
              onClick={() => onOpenQuickAdd(category, undefined, 'expense')}
              className="text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center space-x-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Dépense</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-4 text-center text-xs text-slate-400">
            Aucun poste créé dans cette catégorie.
          </div>
        ) : (
          items.map((item) => {
            const spent = getItemSpent(item.id, budgetData.transactions);
            const baseBudget = item.budget || 0;
            const carriedOver = item.carriedOverBudget || 0;
            const effectiveBudget = baseBudget + carriedOver;
            const remaining = effectiveBudget - spent;
            const pct = effectiveBudget > 0 ? (spent / effectiveBudget) * 100 : 0;
            const isOver = remaining < 0;

            const itemTxs = budgetData.transactions
              .filter((t) => t.itemId === item.id)
              .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

            return (
              <div key={item.id} className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                      {carriedOver > 0 && (
                        <span
                          className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200"
                          title={item.carriedOverSource || "Reste reporté de l'ancien budget"}
                        >
                          +{carriedOver} {budgetData.currency} (Reste ancien budget)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Budget base: <span className="font-mono font-semibold text-slate-700">{baseBudget} {budgetData.currency}</span>
                      {carriedOver > 0 && (
                        <span> • Reste reporté: <span className="font-mono font-bold text-teal-700">+{carriedOver} {budgetData.currency}</span></span>
                      )}
                      {' '}• Total dispo: <span className="font-mono font-bold text-slate-900">{effectiveBudget} {budgetData.currency}</span>
                      {' '}• Dépensé: <span className="font-mono font-bold text-rose-600">{spent.toFixed(1)} {budgetData.currency}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                        isOver
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {Math.abs(remaining).toFixed(1)} {budgetData.currency} {isOver ? 'Dépassement' : 'Restant'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct > 100
                        ? 'bg-rose-500'
                        : pct > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>

                {/* Quick Add For Item */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {itemTxs.length} transaction(s)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onOpenQuickAdd(category, item.id, 'income')}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center space-x-0.5"
                      title="Ajouter un revenu ou remboursement pour ce poste"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ Revenu</span>
                    </button>
                    <button
                      onClick={() => onOpenQuickAdd(category, item.id, 'expense')}
                      className="text-[10px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 flex items-center space-x-0.5 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>+ Dépense</span>
                    </button>
                  </div>
                </div>

                {/* Item transaction preview */}
                {itemTxs.length > 0 && (
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-dashed border-slate-100">
                    {itemTxs.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-400 font-mono text-[10px]">{tx.date.substring(5)}</span>
                          <span className="font-semibold text-slate-800">{tx.desc}</span>
                          {tx.type === 'income' && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Revenu
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {tx.type === 'income' ? '+' : '-'}{tx.amount} {budgetData.currency}
                          </span>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* ⚡ Quick Expense Presets Bar (Achats Types 1-Clic) */}
      <div className="p-4 rounded-[28px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-orange-500/10 border border-amber-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Achats Types & Modèles Rapides (1-Clic)
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Enregistrez vos dépenses courantes (ex: Café 2 DT) sans ressaisir à chaque fois !
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenQuickAdd('wants', undefined, 'expense')}
            className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl border border-amber-300 flex items-center space-x-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nouveau Modèle</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleQuickLogPreset(p)}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-amber-100/80 border border-amber-200/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>{p.icon || '⚡'}</span>
              <span>{p.title}</span>
              <span className="font-mono font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 ml-1">
                {p.amount} {budgetData.currency}
              </span>
              <span className="text-[10px] text-amber-600 font-extrabold ml-1 bg-amber-200/60 px-1 rounded">
                +1 Clic
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Category Progress Sections */}
      <div className="space-y-6">
        {renderCategoryTracking('needs', '🔴 Charges Fixes & Besoins', 'bg-rose-50 text-rose-700')}
        {renderCategoryTracking('wants', '🟡 Plaisirs & Envies', 'bg-amber-50 text-amber-700')}
        {renderCategoryTracking('savings', '🟢 Épargne & Projets', 'bg-emerald-50 text-emerald-700')}
      </div>

      {/* Complete Transactions History Section */}
      <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
            <span>Historique Complet des Transactions</span>
          </h3>
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full border border-slate-200">
            {filteredTransactions.length}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une transaction..."
              className="w-full bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-2xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex space-x-1">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-2xl border transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('needs')}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-2xl border transition-colors ${
                selectedCategoryFilter === 'needs'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Besoins
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('wants')}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-2xl border transition-colors ${
                selectedCategoryFilter === 'wants'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Plaisirs
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('savings')}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-2xl border transition-colors ${
                selectedCategoryFilter === 'savings'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Épargne
            </button>
          </div>
        </div>

        {/* Transaction Cards List */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            budgetData.transactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-emerald-200 rounded-3xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Journal de dépenses prêt</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Aucune dépense pour l'instant. Utilisez le bouton '+' ou les modèles rapides ci-dessus pour enregistrer vos premiers achats !
                  </p>
                </div>
                <button
                  onClick={() => onOpenQuickAdd('wants', undefined, 'expense')}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter une dépense</span>
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Aucune transaction ne correspond à votre recherche "{searchTerm}".
              </div>
            )
          ) : (
            filteredTransactions.map((tx) => {
              const item = budgetData.items.find((i) => i.id === tx.itemId);
              const isIncome = tx.type === 'income';
              const catColor = isIncome
                ? 'border-emerald-200 bg-emerald-50/50'
                : tx.category === 'needs'
                ? 'border-rose-200/80 bg-rose-50/30'
                : tx.category === 'wants'
                ? 'border-amber-200/80 bg-amber-50/30'
                : 'border-emerald-200/80 bg-emerald-50/30';

              const dotColor = isIncome
                ? 'bg-emerald-500'
                : tx.category === 'needs'
                ? 'bg-rose-500'
                : tx.category === 'wants'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-2xl border flex justify-between items-center transition-all hover:bg-slate-100/90 ${catColor}`}
                >
                  <div
                    onClick={() => onEditTransaction && onEditTransaction(tx)}
                    className="space-y-0.5 flex-1 cursor-pointer group pr-2"
                    title="Cliquer pour modifier cette opération"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                        <span>{tx.desc}</span>
                        <Pencil className="w-3 h-3 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      {isIncome && (
                        <span className="text-[10px] text-emerald-800 font-bold px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-200">
                          Revenu imprévu
                        </span>
                      )}
                      {item && (
                        <span className="text-[10px] text-slate-600 font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200">
                          {item.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 pl-4">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{tx.date}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{tx.time}</span>
                      </span>
                      {tx.notes && <span className="italic text-slate-500 truncate max-w-[140px]">{tx.notes}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`font-mono font-bold text-sm ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {isIncome ? '+' : '-'}{tx.amount} {budgetData.currency}
                    </span>
                    <button
                      onClick={() => onEditTransaction && onEditTransaction(tx)}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Modifier cette transaction"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Supprimer la transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
