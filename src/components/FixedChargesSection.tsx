import React, { useState } from 'react';
import { Calendar, Check, CheckCircle2, Clock, DollarSign, FileText, Plus, AlertCircle, ShieldAlert, Zap, Trash2, ArrowRight } from 'lucide-react';
import { BudgetItem, BudgetState, CategoryType } from '../types';

interface FixedChargesSectionProps {
  budgetData: BudgetState;
  onAddItem: (category: CategoryType, name: string, budget: number, options?: { isFixedCharge?: boolean; dueDateDay?: number; excludeFromAnalytics?: boolean }) => void;
  onUpdateItem: (itemId: string, name: string, budget: number, options?: { isFixedCharge?: boolean; dueDateDay?: number; isPaidThisMonth?: boolean; excludeFromAnalytics?: boolean }) => void;
  onDeleteItem: (itemId: string) => void;
  onPayFixedBill: (item: BudgetItem) => void;
}

export const FixedChargesSection: React.FC<FixedChargesSectionProps> = ({
  budgetData,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onPayFixedBill,
}) => {
  const currency = budgetData.currency || 'TND';

  // Filter items that are fixed charges (or default fallback to items in 'needs' with Loyer/Factures)
  const fixedItems = budgetData.items.filter((item) => item.isFixedCharge);

  // Form state for creating a new fixed charge
  const [isAdding, setIsAdding] = useState(false);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState<CategoryType>('needs');
  const [newBillDueDate, setNewBillDueDate] = useState<number>(5);
  const [newBillExclude, setNewBillExclude] = useState(false);

  // Calculation metrics
  const totalFixedAmount = fixedItems.reduce((acc, item) => acc + (item.budget || 0), 0);
  const paidItems = fixedItems.filter((item) => item.isPaidThisMonth);
  const totalPaidAmount = paidItems.reduce((acc, item) => acc + (item.budget || 0), 0);
  const totalRemainingAmount = Math.max(0, totalFixedAmount - totalPaidAmount);
  const paidPercent = totalFixedAmount > 0 ? Math.round((totalPaidAmount / totalFixedAmount) * 100) : 0;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newBillAmount);
    if (!newBillName.trim() || !amount || amount <= 0) return;

    onAddItem(newBillCategory, newBillName.trim(), amount, {
      isFixedCharge: true,
      dueDateDay: newBillDueDate,
      excludeFromAnalytics: newBillExclude,
    });

    setNewBillName('');
    setNewBillAmount('');
    setIsAdding(false);
  };

  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 text-slate-800 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl font-bold">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Rubrique Charges & Factures Fixes
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {fixedItems.length} Engagements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion récurrente des loyers, abonnements, factures STEG/Télécom et mensualités obligatoires.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Fermer' : 'Nouvelle Facture Fixe'}</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 bg-rose-50/50 border border-rose-200/70 rounded-2xl">
          <span className="text-[10px] font-bold text-rose-800/80 uppercase tracking-wider block">
            Total Mensuel
          </span>
          <span className="text-base font-mono font-bold text-rose-700 block mt-0.5">
            {totalFixedAmount.toFixed(0)} {currency}
          </span>
          <span className="text-[9px] text-slate-500">Budget engagé</span>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider block">
            Payé ce Mois
          </span>
          <span className="text-base font-mono font-bold text-emerald-700 block mt-0.5">
            {totalPaidAmount.toFixed(0)} {currency}
          </span>
          <span className="text-[9px] text-emerald-700 font-semibold">{paidPercent}% Réglé</span>
        </div>

        <div className="p-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-800/80 uppercase tracking-wider block">
            Reste à Régler
          </span>
          <span className="text-base font-mono font-bold text-amber-700 block mt-0.5">
            {totalRemainingAmount.toFixed(0)} {currency}
          </span>
          <span className="text-[9px] text-slate-500">{fixedItems.length - paidItems.length} Factures</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
          <span>Progression du règlement mensuel</span>
          <span className="font-mono text-emerald-700 font-bold">{paidPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      </div>

      {/* Inline Creation Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3 animate-fadeIn text-xs"
        >
          <div className="flex justify-between items-center border-b border-emerald-200/60 pb-2">
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Ajouter une Facture / Charge Fixe Récurrente
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] text-slate-600 font-bold mb-1">Intitulé de la Facture</label>
              <input
                type="text"
                required
                placeholder="Ex: Loyer, Électricité, Fibre Internet, Assurance..."
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 font-bold mb-1">Montant Estimé ({currency})</label>
              <input
                type="number"
                step="any"
                required
                placeholder="Ex: 150"
                value={newBillAmount}
                onChange={(e) => setNewBillAmount(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 font-mono font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 font-bold mb-1">Jour d'Échéance (du 1 au 31)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={newBillDueDate}
                onChange={(e) => setNewBillDueDate(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-600 font-bold mb-1">Catégorie Budgétaire</label>
              <select
                value={newBillCategory}
                onChange={(e) => setNewBillCategory(e.target.value as CategoryType)}
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="needs">🔴 Besoins Essentiels (Loyer, Factures)</option>
                <option value="wants">🟡 Abonnements & Loisirs Fixes</option>
                <option value="savings">🟢 Épargne & Crédits Fixes</option>
              </select>
            </div>
          </div>

          {/* Caisse Noire toggle */}
          <div className="pt-1 flex items-center space-x-2">
            <input
              type="checkbox"
              id="newBillExclude"
              checked={newBillExclude}
              onChange={(e) => setNewBillExclude(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-600 bg-white border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="newBillExclude" className="text-xs text-slate-700 font-medium cursor-pointer">
              🔒 <strong className="text-amber-700">Option Caisse Noire / Hors-Analyse :</strong> Déduire du solde global mais ne pas inclure dans les analyses graphiques & audit.
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
          >
            ➕ Créer et Engager cette Charge Fixe
          </button>
        </form>
      )}

      {/* List of Fixed Charge Items */}
      <div className="space-y-2">
        {fixedItems.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-2xl text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">Aucune charge fixe enregistrée pour le moment.</p>
            <p className="text-[11px] text-slate-400">
              Cliquez sur "Nouvelle Facture Fixe" ci-dessus ou cochez l'option "Charge Fixe" sur vos postes existants.
            </p>
          </div>
        ) : (
          fixedItems.map((item) => {
            const isPaid = !!item.isPaidThisMonth;
            return (
              <div
                key={item.id}
                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 ${
                  isPaid
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-700'
                    : 'bg-slate-50/80 border-slate-200/90 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateItem(item.id, item.name, item.budget, {
                        isFixedCharge: true,
                        dueDateDay: item.dueDateDay,
                        isPaidThisMonth: !isPaid,
                        excludeFromAnalytics: item.excludeFromAnalytics,
                      })
                    }
                    className={`p-2 rounded-xl border transition-colors ${
                      isPaid
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                    title={isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{item.name}</span>
                      {isPaid ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Payé
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          À régler
                        </span>
                      )}
                      {item.excludeFromAnalytics && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          🔒 Caisse Noire
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Échéance: le {item.dueDateDay || 5} du mois
                      </span>
                      <span>Catégorie: {item.category.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <span className="text-sm font-mono font-extrabold text-slate-900">
                    {item.budget} {currency}
                  </span>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onPayFixedBill(item)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1 shadow-2xs transition-all"
                      title="Enregistrer la transaction et marquer payé"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Payer 1-Clic</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    title="Supprimer cette facture fixe"
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
  );
};
