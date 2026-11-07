import React, { useState } from 'react';
import { X, ArrowRight, CornerDownRight, CheckCircle2, History, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { BudgetState, BudgetItem, MonthlyReportArchive } from '../types';

interface PosteRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  onApplyPosteRollover: (
    sourcePeriod: string,
    sourceItemName: string,
    targetItemId: string,
    amount: number
  ) => void;
  onClearItemRollover?: (itemId: string) => void;
}

export const PosteRolloverModal: React.FC<PosteRolloverModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onApplyPosteRollover,
  onClearItemRollover,
}) => {
  const currency = budgetData.currency || 'TND';
  const archives = budgetData.monthlyReports || [];

  // Default to first archive if available
  const [selectedSourcePeriod, setSelectedSourcePeriod] = useState<string>(
    archives[0]?.periodMonth || ''
  );
  const selectedArchive = archives.find((a) => a.periodMonth === selectedSourcePeriod) || archives[0];

  // Postes from source archive that had remaining unspent balance
  const sourceItemsWithRest = (selectedArchive?.itemsSnapshot || []).map((item) => {
    // If transactions are snapshotted in archive, calculate spent, else estimate
    const spent = (selectedArchive.transactionsSnapshot || [])
      .filter((t) => t.itemId === item.id && t.type !== 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const rest = Math.max(0, (item.budget || 0) + (item.carriedOverBudget || 0) - spent);
    return {
      ...item,
      spent,
      remainingRest: rest > 0 ? rest : (item.budget || 0) * 0.2, // fallback reasonable rest if no transactions snapshot
    };
  });

  const [selectedSourceItemId, setSelectedSourceItemId] = useState<string>(
    sourceItemsWithRest[0]?.id || ''
  );
  const selectedSourceItem = sourceItemsWithRest.find((i) => i.id === selectedSourceItemId) || sourceItemsWithRest[0];

  const [selectedTargetItemId, setSelectedTargetItemId] = useState<string>(
    budgetData.items[0]?.id || ''
  );

  const [amount, setAmount] = useState<string>(
    selectedSourceItem?.remainingRest ? selectedSourceItem.remainingRest.toFixed(2) : '50'
  );

  // Update amount when source item changes
  const handleSelectSourceItem = (itemId: string) => {
    setSelectedSourceItemId(itemId);
    const found = sourceItemsWithRest.find((i) => i.id === itemId);
    if (found) {
      setAmount(found.remainingRest.toFixed(2));
      // Auto-match target item with same or similar name
      const matchingTarget = budgetData.items.find(
        (target) => target.name.trim().toLowerCase() === found.name.trim().toLowerCase()
      );
      if (matchingTarget) {
        setSelectedTargetItemId(matchingTarget.id);
      }
    }
  };

  const handleSourcePeriodChange = (period: string) => {
    setSelectedSourcePeriod(period);
    const arch = archives.find((a) => a.periodMonth === period);
    if (arch && arch.itemsSnapshot?.length) {
      setSelectedSourceItemId(arch.itemsSnapshot[0].id);
      const rest = arch.itemsSnapshot[0].budget || 50;
      setAmount(rest.toString());
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    if (!selectedSourceItem || !selectedTargetItemId) return;

    onApplyPosteRollover(
      selectedArchive?.periodMonth || 'Ancien Projet',
      selectedSourceItem.name,
      selectedTargetItemId,
      val
    );
    onClose();
  };

  // Active items currently carrying over budget
  const activeItemsWithRollover = budgetData.items.filter(
    (i) => (i.carriedOverBudget || 0) > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col my-8 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Reporter le Reste d'un Poste (Ancien Projet)
              </h2>
              <p className="text-xs text-slate-500">
                Transférer le reliquat d'un poste spécifique vers le projet en cours
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

        {archives.length === 0 ? (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Aucun ancien projet archivé disponible</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Pour reporter le reliquat d'un poste, vous devez avoir au moins un projet archivé dans l'historique. Lorsque vous créez un nouveau projet mensuel, le mois précédent s'archive automatiquement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Info notice about clean identification */}
            <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl text-[11px] text-teal-900 leading-relaxed font-medium">
              💡 <strong>Reste de l'Ancien Budget :</strong> Le montant transféré est clairement identifié comme reliquat reporté (+{amount || 0} {currency}). Il augmente la capacité de dépense de votre poste sans apparaître comme un surplus négatif.
            </div>

            {/* Source Project Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                1. Sélectionner le Projet Source (Archive)
              </label>
              <select
                value={selectedSourcePeriod}
                onChange={(e) => handleSourcePeriodChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {archives.map((a) => (
                  <option key={a.id} value={a.periodMonth}>
                    Projet {a.periodMonth} (Budget: {a.allocatedBudget} {a.currency} - Reste: {a.remainingBalance?.toFixed(0) || 0} {a.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Poste Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Poste Source à Récupérer
              </label>
              {sourceItemsWithRest.length === 0 ? (
                <p className="text-[11px] text-slate-400">Aucun poste trouvé dans cette archive.</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {sourceItemsWithRest.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleSelectSourceItem(item.id)}
                      className={`p-2 rounded-xl text-left border flex items-center justify-between transition-all ${
                        selectedSourceItemId === item.id
                          ? 'border-teal-500 bg-teal-50/80 text-teal-950 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="capitalize text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                        <span className="text-xs">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-teal-700">
                        +{item.remainingRest.toFixed(2)} {currency} restant
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination Poste Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                3. Poste Cible dans le Projet en Cours ({budgetData.selectedPeriodMonth || 'Actuel'})
              </label>
              <select
                value={selectedTargetItemId}
                onChange={(e) => setSelectedTargetItemId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {budgetData.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.category.toUpperCase()}] {item.name} (Budget base: {item.budget} {currency}
                    {item.carriedOverBudget ? ` + Reporté: +${item.carriedOverBudget} ${currency}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                4. Montant du Reste à Reporter ({currency})
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-slate-600">{currency}</span>
                {selectedSourceItem && (
                  <button
                    type="button"
                    onClick={() => setAmount(selectedSourceItem.remainingRest.toFixed(2))}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold transition-colors"
                  >
                    Tout ({selectedSourceItem.remainingRest.toFixed(2)})
                  </button>
                )}
              </div>
            </div>

            {/* Active carried over items summary */}
            {activeItemsWithRollover.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Restes Déjà Reportés dans ce Projet ({activeItemsWithRollover.length})
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {activeItemsWithRollover.map((i) => (
                    <div
                      key={i.id}
                      className="p-1.5 bg-teal-50/50 border border-teal-100 rounded-lg flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{i.name}</span>
                        <span className="text-[10px] text-teal-700 ml-1.5 font-mono">
                          +{i.carriedOverBudget} {currency} ({i.carriedOverSource || 'Report'})
                        </span>
                      </div>
                      {onClearItemRollover && (
                        <button
                          type="button"
                          onClick={() => onClearItemRollover(i.id)}
                          className="text-[10px] text-rose-600 hover:underline font-semibold"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md flex items-center space-x-1.5"
              >
                <CornerDownRight className="w-4 h-4" />
                <span>Confirmer le Report du Poste</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
