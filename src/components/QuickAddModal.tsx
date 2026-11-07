import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Calendar, Clock, DollarSign, Tag, TrendingUp, ArrowDownLeft, Sparkles, Bookmark, Trash2, Zap, Pencil, Calculator, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { BudgetState, CategoryType, ExpensePreset, Transaction } from '../types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  preselectedCategory?: CategoryType;
  preselectedItemId?: string;
  initialType?: 'expense' | 'income';
  editingTransaction?: Transaction | null;
  onAddTransaction: (tx: {
    type?: 'expense' | 'income';
    desc: string;
    amount: number;
    category: CategoryType;
    itemId: string;
    date: string;
    time: string;
    notes?: string;
    addToGlobalIncome?: boolean;
  }) => void;
  onUpdateTransaction?: (
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
  ) => void;
  onDeleteTransaction?: (txId: string) => void;
  onAddPreset?: (preset: ExpensePreset) => void;
  onDeletePreset?: (presetId: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  preselectedCategory,
  preselectedItemId,
  initialType = 'expense',
  editingTransaction,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddPreset,
  onDeletePreset,
}) => {
  const [txType, setTxType] = useState<'expense' | 'income'>(initialType);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryType>('needs');
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [notes, setNotes] = useState('');
  const [addToGlobalIncome, setAddToGlobalIncome] = useState(true);
  const [saveAsPreset, setSaveAsPreset] = useState(false);

  // Presets Menu State (Collapsible for lightweight UI)
  const [isPresetsExpanded, setIsPresetsExpanded] = useState(false);
  const [newPresetTitle, setNewPresetTitle] = useState('');
  const [newPresetAmount, setNewPresetAmount] = useState('');
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(false);

  const handleCreateQuickPresetInline = () => {
    const pAmount = parseFloat(newPresetAmount);
    if (!newPresetTitle.trim() || !pAmount || pAmount <= 0) return;
    if (onAddPreset) {
      onAddPreset({
        id: `preset-${Date.now()}`,
        title: newPresetTitle.trim(),
        amount: pAmount,
        category,
        itemId: itemId || budgetData.items[0]?.id || '',
        icon: '⚡',
      });
      setNewPresetTitle('');
      setNewPresetAmount('');
    }
  };

  // Integrated Calculator State
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [liveCalculated, setLiveCalculated] = useState<number | null>(null);

  // Helper to safely evaluate mathematical expressions
  const evaluateCalc = (expr: string): number | null => {
    try {
      const sanitized = expr.replace(/[^0-9+\-*/.()]/g, '');
      if (!sanitized) return null;
      // Function constructor is safe here as sanitized strictly filters safe math characters
      const res = new Function(`"use strict"; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res * 100) / 100;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleCalcInput = (key: string) => {
    if (key === 'C') {
      setCalcExpr('');
      setLiveCalculated(null);
    } else if (key === 'DEL') {
      setCalcExpr((prev) => prev.slice(0, -1));
    } else {
      setCalcExpr((prev) => prev + key);
    }
  };

  const handleCalcQuickAdd = (val: number) => {
    setCalcExpr((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        const currentNum = parseFloat(amount) || 0;
        return currentNum > 0 ? `${currentNum} + ${val}` : `${val}`;
      }
      if (/[+\-*/]$/.test(trimmed)) {
        return `${trimmed} ${val}`;
      }
      return `${trimmed} + ${val}`;
    });
  };

  const handleApplyCalcResult = () => {
    const evaluated = evaluateCalc(calcExpr) ?? evaluateCalc(amount) ?? parseFloat(amount);
    if (evaluated !== null && !isNaN(evaluated)) {
      setAmount(evaluated.toString());
      setLiveCalculated(null);
    }
    setIsCalcOpen(false);
  };

  const presets = budgetData.expensePresets || [
    { id: 'preset-cafe', title: 'Café & Expresso', amount: 2.0, category: 'wants', itemId: 'item-cafe', icon: '☕' },
    { id: 'preset-pain', title: 'Pain & Petit Déj', amount: 3.0, category: 'needs', itemId: 'item-courses', icon: '🥖' },
    { id: 'preset-transport', title: 'Transport / Taxi', amount: 5.0, category: 'needs', itemId: 'item-factures', icon: '🚕' },
  ];

  useEffect(() => {
    if (isOpen) {
      setIsCalcOpen(false);
      setCalcExpr('');
      setLiveCalculated(null);
      setConfirmDeleteTx(false);
      if (editingTransaction) {
        setTxType(editingTransaction.type || 'expense');
        setDesc(editingTransaction.desc || '');
        setAmount(editingTransaction.amount ? editingTransaction.amount.toString() : '');
        setCategory(editingTransaction.category || 'needs');
        setItemId(editingTransaction.itemId || '');
        setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
        setTime(editingTransaction.time || new Date().toTimeString().substring(0, 5));
        setNotes(editingTransaction.notes || '');
        setAddToGlobalIncome(editingTransaction.addToGlobalIncome ?? true);
        setSaveAsPreset(false);
      } else {
        setTxType(initialType);
        const cat = preselectedCategory || 'needs';
        setCategory(cat);
        const availableItems = budgetData.items.filter((i) => i.category === cat);
        if (preselectedItemId) {
          setItemId(preselectedItemId);
        } else if (availableItems.length > 0) {
          setItemId(availableItems[0].id);
        } else {
          setItemId('');
        }
        setDesc('');
        setAmount('');
        setNotes('');
        setAddToGlobalIncome(true);
        setSaveAsPreset(false);
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().substring(0, 5));
      }
    }
  }, [isOpen, editingTransaction, preselectedCategory, preselectedItemId, initialType, budgetData.items]);

  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    const availableItems = budgetData.items.filter((i) => i.category === newCat);
    if (availableItems.length > 0) {
      setItemId(availableItems[0].id);
    } else {
      setItemId('');
    }
  };

  const handleApplyPreset = (preset: ExpensePreset, instantSubmit = false) => {
    setTxType('expense');
    setDesc(preset.title);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    
    // Find item in matching category or fallback
    const categoryItems = budgetData.items.filter((i) => i.category === preset.category);
    const targetItemId = (preset.itemId && budgetData.items.some((i) => i.id === preset.itemId))
      ? preset.itemId
      : (categoryItems[0]?.id || budgetData.items[0]?.id || '');
    
    setItemId(targetItemId);

    if (instantSubmit && targetItemId) {
      onAddTransaction({
        type: 'expense',
        desc: preset.title,
        amount: preset.amount,
        category: preset.category,
        itemId: targetItemId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
        notes: preset.notes || `Achat Type rapide (${preset.title})`,
        addToGlobalIncome: false,
      });
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    if (!itemId) return;

    const trimmedDesc = desc.trim() || (txType === 'income' ? 'Revenu imprévu' : 'Dépense');

    const txPayload = {
      type: txType,
      desc: trimmedDesc,
      amount: numAmount,
      category,
      itemId,
      date,
      time,
      notes,
      addToGlobalIncome: txType === 'income' ? addToGlobalIncome : false,
    };

    if (editingTransaction && onUpdateTransaction) {
      onUpdateTransaction(editingTransaction.id, txPayload);
    } else {
      onAddTransaction(txPayload);

      if (txType === 'expense' && saveAsPreset && onAddPreset) {
        onAddPreset({
          id: `preset-${Date.now()}`,
          title: trimmedDesc,
          amount: numAmount,
          category,
          itemId,
          icon: '⚡',
          notes: notes || undefined,
        });
      }
    }

    onClose();
  };

  const handleDelete = () => {
    if (editingTransaction && onDeleteTransaction) {
      if (!confirmDeleteTx) {
        setConfirmDeleteTx(true);
        return;
      }
      onDeleteTransaction(editingTransaction.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentCategoryItems = budgetData.items.filter((i) => i.category === category);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-100 text-slate-800 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2.5 rounded-2xl border ${
              editingTransaction
                ? 'bg-teal-50 text-teal-700 border-teal-200'
                : txType === 'income'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {editingTransaction ? <Pencil className="w-5 h-5" /> : txType === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingTransaction
                  ? "Modifier l'Opération / Dépense"
                  : txType === 'income'
                  ? 'Nouveau Revenu Imprévu'
                  : 'Nouvelle Dépense'}
              </h2>
              <p className="text-xs text-slate-400">
                {editingTransaction
                  ? "Modifiez les informations et sauvegardez l'élément de l'historique"
                  : txType === 'income'
                  ? "Entrée d'argent pour couvrir un imprévu ou gonfler le budget"
                  : 'Enregistrer un achat ou règlement réel'}
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

        {/* Mode Selector Switcher */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setTxType('expense')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              txType === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>🔴 Dépense</span>
          </button>

          <button
            type="button"
            onClick={() => setTxType('income')}
            className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              txType === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>🟢 Revenu Imprévu</span>
          </button>
        </div>

        {/* Expense Presets (Modèles d'Achats Rapides Types - Collapsible & Lightweight) */}
        {txType === 'expense' && (
          <div className="mt-3.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl transition-all">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPresetsExpanded(!isPresetsExpanded)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 hover:text-amber-800 transition-colors"
                title={isPresetsExpanded ? "Masquer le menu des modèles" : "Afficher et gérer les modèles d'achats"}
              >
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>Modèles Rapides (1-Clic)</span>
                <span className="px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded-full text-[10px] font-mono font-bold">
                  {presets.length}
                </span>
                {isPresetsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                )}
              </button>

              {!isPresetsExpanded && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-[210px] no-scrollbar">
                  {presets.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p, true)}
                      className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200/90 text-slate-800 text-[10px] font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                      title={`Ajouter instantanément "${p.title}" (${p.amount} ${budgetData.currency})`}
                    >
                      <span>{p.icon || '⚡'}</span>
                      <span className="truncate max-w-[60px]">{p.title}</span>
                      <span className="text-amber-700 font-mono">+{p.amount}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Expanded Detailed Grid & Inline Creation Form */}
            {isPresetsExpanded && (
              <div className="mt-2.5 pt-2 border-t border-amber-200/60 space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="group inline-flex items-center bg-white hover:bg-amber-100/80 border border-amber-200/90 text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset, false)}
                        className="flex items-center gap-1 mr-1"
                        title="Remplir le formulaire avec ce modèle"
                      >
                        <span>{preset.icon || '⚡'}</span>
                        <span>{preset.title}</span>
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60 ml-0.5">
                          {preset.amount} {budgetData.currency}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset, true)}
                        className="p-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center transition-transform hover:scale-105 ml-1"
                        title="⚡ Enregistrer immédiatement en 1 clic !"
                      >
                        +1
                      </button>

                      {onDeletePreset && (
                        <button
                          type="button"
                          onClick={() => onDeletePreset(preset.id)}
                          className="text-slate-300 hover:text-rose-600 ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Supprimer ce modèle type"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Direct Inline Preset Creation */}
                {onAddPreset && (
                  <div className="pt-2 flex items-center gap-1.5 border-t border-amber-200/50">
                    <input
                      type="text"
                      placeholder="Nouveau modèle (ex: Croissant)"
                      value={newPresetTitle}
                      onChange={(e) => setNewPresetTitle(e.target.value)}
                      className="flex-1 bg-white border border-amber-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Prix"
                      value={newPresetAmount}
                      onChange={(e) => setNewPresetAmount(e.target.value)}
                      className="w-16 bg-white border border-amber-200 rounded-xl px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleCreateQuickPresetInline}
                      disabled={!newPresetTitle.trim() || !newPresetAmount}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all shrink-0 flex items-center gap-1 shadow-2xs"
                      title="Enregistrer ce modèle sans recharger la page"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Income Option: Global Income Bump */}
          {txType === 'income' && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div className="pr-2">
                <span className="text-xs font-bold text-emerald-950 block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" /> Ajouter au Revenu Mensuel Global
                </span>
                <span className="text-[10px] text-emerald-800 block">
                  Augmente le revenu total disponible pour recalculer vos cibles d'allocation
                </span>
              </div>
              <input
                type="checkbox"
                checked={addToGlobalIncome}
                onChange={(e) => setAddToGlobalIncome(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer shrink-0"
              />
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {txType === 'income' ? 'Catégorie / Destination' : 'Catégorie Budget'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleCategoryChange('needs')}
                className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all ${
                  category === 'needs'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔴 Besoins
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('wants')}
                className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all ${
                  category === 'wants'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟡 Plaisirs
              </button>
              <button
                type="button"
                onClick={() => handleCategoryChange('savings')}
                className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all ${
                  category === 'savings'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🟢 Épargne
              </button>
            </div>
          </div>

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Poste / Article {txType === 'income' ? 'à financer/couvrir' : ''}
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl pl-10 pr-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currentCategoryItems.length === 0 ? (
                  <option value="">Aucun poste créé dans cette catégorie</option>
                ) : (
                  currentCategoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Budget: {item.budget} {budgetData.currency})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Description {txType === 'income' ? 'du Revenu' : ''}
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={txType === 'income' ? 'Ex: Prime, Remboursement, Cadeau' : 'Ex: Café Express, Pain, Taxi'}
                required
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-500">
                  Montant ({budgetData.currency})
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isCalcOpen;
                    setIsCalcOpen(nextState);
                    if (nextState) {
                      setCalcExpr(amount || '');
                    }
                  }}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all ${
                    isCalcOpen
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculatrice</span>
                </button>
              </div>

              <div className="relative">
                <DollarSign className={`w-4 h-4 absolute left-3 top-3 ${txType === 'income' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAmount(val);
                    const evalVal = evaluateCalc(val);
                    if (evalVal !== null && evalVal !== parseFloat(val)) {
                      setLiveCalculated(evalVal);
                    } else {
                      setLiveCalculated(null);
                    }
                  }}
                  placeholder="Ex: 2.5 ou 12+5.5"
                  required
                  className={`w-full bg-slate-50 font-mono font-bold border border-slate-200 rounded-2xl pl-9 pr-24 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    txType === 'income' ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                />

                {liveCalculated !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(liveCalculated.toString());
                      setLiveCalculated(null);
                    }}
                    className="absolute right-1.5 top-1.5 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono font-bold rounded-xl transition-all flex items-center gap-1 shadow-xs"
                    title="Cliquer pour appliquer le résultat calculé"
                  >
                    <span>= {liveCalculated} {budgetData.currency}</span>
                    <Check className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Expandable Integrated Calculator Pad */}
              {isCalcOpen && (
                <div className="mt-2 p-3 rounded-2xl bg-slate-50 text-slate-800 border border-slate-200/90 shadow-md space-y-2.5 animate-fadeIn">
                  {/* Expression & Result Display */}
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200/80 flex flex-col items-end shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-mono min-h-[14px] truncate max-w-full">
                      {calcExpr || '0'}
                    </div>
                    <div className="text-base font-mono font-black text-emerald-700">
                      = {evaluateCalc(calcExpr) ?? (parseFloat(amount) || 0)} {budgetData.currency}
                    </div>
                  </div>

                  {/* Quick Addition Pills */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-0.5 text-[10px]">
                    <span className="text-slate-500 font-semibold text-[9px] shrink-0">Ajouts rapides:</span>
                    {[1, 2, 5, 10, 20, 50].map((addVal) => (
                      <button
                        key={addVal}
                        type="button"
                        onClick={() => handleCalcQuickAdd(addVal)}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold rounded-lg border border-emerald-200 transition-colors shrink-0"
                      >
                        +{addVal}
                      </button>
                    ))}
                  </div>

                  {/* Numeric Keypad Grid */}
                  <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                    <button type="button" onClick={() => handleCalcInput('C')} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200">C</button>
                    <button type="button" onClick={() => handleCalcInput('(')} className="p-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200">(</button>
                    <button type="button" onClick={() => handleCalcInput(')')} className="p-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200">)</button>
                    <button type="button" onClick={() => handleCalcInput('/')} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200">÷</button>

                    <button type="button" onClick={() => handleCalcInput('7')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">7</button>
                    <button type="button" onClick={() => handleCalcInput('8')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">8</button>
                    <button type="button" onClick={() => handleCalcInput('9')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">9</button>
                    <button type="button" onClick={() => handleCalcInput('*')} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200">×</button>

                    <button type="button" onClick={() => handleCalcInput('4')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">4</button>
                    <button type="button" onClick={() => handleCalcInput('5')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">5</button>
                    <button type="button" onClick={() => handleCalcInput('6')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">6</button>
                    <button type="button" onClick={() => handleCalcInput('-')} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200">-</button>

                    <button type="button" onClick={() => handleCalcInput('1')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">1</button>
                    <button type="button" onClick={() => handleCalcInput('2')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">2</button>
                    <button type="button" onClick={() => handleCalcInput('3')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">3</button>
                    <button type="button" onClick={() => handleCalcInput('+')} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200">+</button>

                    <button type="button" onClick={() => handleCalcInput('0')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs col-span-2">0</button>
                    <button type="button" onClick={() => handleCalcInput('.')} className="p-2 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200/80 shadow-2xs">.</button>
                    <button type="button" onClick={() => handleCalcInput('DEL')} className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl border border-amber-200 flex items-center justify-center">⌫</button>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyCalcResult}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Valider le calcul ({evaluateCalc(calcExpr) ?? (parseFloat(amount) || 0)} {budgetData.currency})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl pl-9 pr-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Heure
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl pl-9 pr-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Option to Save as Preset */}
          {txType === 'expense' && onAddPreset && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div className="pr-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 fill-amber-100" />
                  <span>Enregistrer comme Achat Type / Modèle</span>
                </span>
                <span className="text-[10px] text-amber-800 block">
                  Permet de réutiliser cet achat (ex: {desc || 'Café 2 DT'}) en 1 clic plus tard
                </span>
              </div>
              <input
                type="checkbox"
                checked={saveAsPreset}
                onChange={(e) => setSaveAsPreset(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer shrink-0"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Note supplémentaire (Optionnel)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Café quotidien du matin..."
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit & Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            {editingTransaction && onDeleteTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className={`py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1 transition-colors ${
                  confirmDeleteTx
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
                title="Supprimer définitivement cette opération"
              >
                <Trash2 className="w-4 h-4" />
                <span>{confirmDeleteTx ? 'Confirmer ?' : 'Supprimer'}</span>
              </button>
            )}
            <div className="flex-1 flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!amount || !itemId}
                className={`w-2/3 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  editingTransaction
                    ? 'bg-teal-600 hover:bg-teal-500 text-white'
                    : txType === 'income'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {editingTransaction
                  ? 'Enregistrer les modifications'
                  : txType === 'income'
                  ? 'Enregistrer le Revenu'
                  : 'Enregistrer la Dépense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
