import React, { useState } from 'react';
import {
  Wallet,
  ArrowRightLeft,
  X,
  Plus,
  CheckCircle2,
  Building2,
  PiggyBank,
  Banknote,
  ShieldCheck,
  TrendingUp,
  Coins,
  History,
  Trash2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { BudgetState, WalletAccount, WalletTransfer } from '../types';

interface WalletTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  onExecuteTransfer: (fromWalletId: string, toWalletId: string, amount: number, note: string) => void;
  onAddWallet: (name: string, type: WalletAccount['type'], initialBalance: number, icon: string, excludeFromAnalytics?: boolean) => void;
  onToggleWalletExcludeAnalytics?: (walletId: string) => void;
  onDeleteWallet?: (walletId: string) => void;
}

export const WalletTransferModal: React.FC<WalletTransferModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onExecuteTransfer,
  onAddWallet,
  onToggleWalletExcludeAnalytics,
  onDeleteWallet,
}) => {
  const currency = budgetData.currency || 'TND';
  const wallets = budgetData.wallets || [];
  const items = budgetData.items || [];
  const goals = budgetData.goals || [];
  const transfers = budgetData.transfers || [];

  const [activeTab, setActiveTab] = useState<'transfer' | 'wallets' | 'history'>('transfer');

  // Combined selector state
  const defaultFrom = wallets[0]?.id || items[0]?.id || '';
  const defaultTo = items.find((i) => i.category === 'savings')?.id || goals[0]?.id || wallets[1]?.id || '';

  const [fromId, setFromId] = useState<string>(defaultFrom);
  const [toId, setToId] = useState<string>(defaultTo);
  const [transferAmount, setTransferAmount] = useState<string>('50');
  const [transferNote, setTransferNote] = useState<string>('Transfert de solde entre cibles');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Add wallet form state
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<WalletAccount['type']>('checking');
  const [newWalletBalance, setNewWalletBalance] = useState('0');
  const [newWalletIcon, setNewWalletIcon] = useState('💳');
  const [newWalletExcludeAnalytics, setNewWalletExcludeAnalytics] = useState(false);

  if (!isOpen) return null;

  const totalBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  // Helper to resolve entity display details
  const getEntityDetails = (id: string) => {
    if (id.startsWith('wallet-')) {
      const w = wallets.find((x) => x.id === id);
      return { name: w?.name || 'Portefeuille', bal: w?.balance || 0, type: 'wallet', icon: w?.icon || '💳' };
    }
    if (id.startsWith('item-')) {
      const item = items.find((x) => x.id === id);
      const categoryLabel = item?.category === 'needs' ? 'Besoins' : item?.category === 'wants' ? 'Plaisir' : 'Épargne';
      return { name: `${item?.name} [${categoryLabel}]`, bal: item?.budget || 0, type: 'item', icon: '🎯' };
    }
    if (id.startsWith('goal-')) {
      const g = goals.find((x) => x.id === id);
      return { name: `Objectif: ${g?.title}`, bal: g?.currentAmount || 0, type: 'goal', icon: '🚩' };
    }
    return { name: 'Inconnu', bal: 0, type: 'unknown', icon: '❓' };
  };

  const fromEntity = getEntityDetails(fromId);
  const toEntity = getEntityDetails(toId);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);

    if (!fromId || !toId) {
      alert('Veuillez sélectionner le compte/cible source et la destination.');
      return;
    }

    if (fromId === toId) {
      alert('La provenance et la destination doivent être différentes.');
      return;
    }

    if (!amount || amount <= 0) {
      alert('Veuillez saisir un montant positif.');
      return;
    }

    onExecuteTransfer(fromId, toId, amount, transferNote);
    setStatusNotice(`✅ Transfert de ${amount} ${currency} exécuté avec succès de "${fromEntity.name}" vers "${toEntity.name}" !`);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleCreateWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      alert('Veuillez saisir un nom pour le compte.');
      return;
    }
    const initBal = parseFloat(newWalletBalance) || 0;
    onAddWallet(newWalletName, newWalletType, initBal, newWalletIcon, newWalletExcludeAnalytics);
    setIsAddingWallet(false);
    setNewWalletName('');
    setNewWalletBalance('0');
    setNewWalletExcludeAnalytics(false);
    setStatusNotice(`✅ Nouveau portefeuille "${newWalletName}" créé !`);
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const getWalletTypeBadge = (type: WalletAccount['type']) => {
    switch (type) {
      case 'checking':
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">💳 Courant</span>;
      case 'savings':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🏦 Épargne</span>;
      case 'cash':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">💵 Espèces</span>;
      case 'emergency':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🛡️ Urgence</span>;
      case 'investment':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">📈 Placement</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Portefeuilles & Virement de Solde
              </h2>
              <p className="text-xs text-slate-500">
                Gérez vos comptes et transférez des fonds entre portefeuilles
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

        {/* Global Balance Banner */}
        <div className="mt-4 p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50 border border-emerald-200/80 text-slate-800 rounded-2xl flex justify-between items-center shadow-2xs">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Solde Total Cumulé</span>
            <span className="text-lg font-black text-emerald-700 font-mono">{totalBalance.toFixed(2)} {currency}</span>
          </div>
          <span className="text-xs text-emerald-800 font-semibold bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
            {wallets.length} Comptes Actifs
          </span>
        </div>

        {/* Tabs selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mt-4">
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'transfer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔄 Nouveau Virement
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'wallets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💼 Comptes ({wallets.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📜 Historique ({transfers.length})
          </button>
        </div>

        {/* Notice Banner */}
        {statusNotice && (
          <div className="mt-3 p-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {/* TAB 1: TRANSFER FORM */}
          {activeTab === 'transfer' && (
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-900 leading-relaxed font-medium">
                💡 <strong>Flexibilité Inter-Cibles :</strong> Vous pouvez transférer du solde entre <strong>Portefeuilles bancaires</strong>, <strong>Postes de budget</strong> (ex: basculer 50 {currency} de <em>Café & Sorties</em> vers <em>Épargne</em>), ou vers un <strong>Objectif Financier</strong> !
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* From Source */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Source de Provenance (Débit)
                  </label>
                  <select
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <optgroup label="💼 COMPTES & PORTEFEUILLES">
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon || '💳'} {w.name} ({w.balance.toFixed(0)} {currency})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎯 CIBLES DE BUDGET (ENVELOPPES)">
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          🎯 {i.name} ({i.category.toUpperCase()}) - Alloc: {i.budget} {currency}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🚩 OBJECTIFS D'ÉPARGNE">
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          🚩 {g.title} ({g.currentAmount} / {g.targetAmount} {currency})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* To Destination */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Cible Destination (Crédit)
                  </label>
                  <select
                    value={toId}
                    onChange={(e) => setToId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <optgroup label="🎯 CIBLES DE BUDGET (ENVELOPPES)">
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          🎯 {i.name} ({i.category.toUpperCase()}) - Alloc: {i.budget} {currency}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🚩 OBJECTIFS D'ÉPARGNE">
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          🚩 {g.title} ({g.currentAmount} / {g.targetAmount} {currency})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="💼 COMPTES & PORTEFEUILLES">
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.icon || '💳'} {w.name} ({w.balance.toFixed(0)} {currency})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Balance Preview Row */}
              {fromId && toId && fromId !== toId && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Ajustement Source ({fromEntity.name})</span>
                    <span className={`font-bold ${fromEntity.bal - (parseFloat(transferAmount) || 0) < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {(fromEntity.bal - (parseFloat(transferAmount) || 0)).toFixed(2)} {currency}
                      {fromEntity.bal - (parseFloat(transferAmount) || 0) < 0 ? ' (Négatif / Découvert)' : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Ajustement Destination ({toEntity.name})</span>
                    <span className="font-bold text-emerald-700">
                      {(toEntity.bal + (parseFloat(transferAmount) || 0)).toFixed(2)} {currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Transfer Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Montant à Transférer ({currency})
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Note / Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Motif / Note (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: Réserve vacances, virement mensuel..."
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Exécuter le Virement Immédiat</span>
              </button>
            </form>
          )}

          {/* TAB 2: LIST OF WALLETS & ADD WALLET */}
          {activeTab === 'wallets' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Vos Portefeuilles Enregistrés
                </span>
                <button
                  onClick={() => setIsAddingWallet((prev) => !prev)}
                  className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingWallet ? 'Annuler' : 'Créer un Compte'}</span>
                </button>
              </div>

              {/* Add Wallet Form */}
              {isAddingWallet && (
                <form onSubmit={handleCreateWalletSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs animate-fadeIn">
                  <h4 className="font-bold text-slate-900 text-xs">Nouveau Portefeuille</h4>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nom du Compte</label>
                      <input
                        type="text"
                        required
                        placeholder="ex: Carte BNA, Coffre, Crypto..."
                        value={newWalletName}
                        onChange={(e) => setNewWalletName(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Icône</label>
                      <select
                        value={newWalletIcon}
                        onChange={(e) => setNewWalletIcon(e.target.value)}
                        className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                      >
                        <option value="💳">💳 Carte</option>
                        <option value="🏦">🏦 Banque</option>
                        <option value="💵">💵 Cash</option>
                        <option value="🛡️">🛡️ Coffre</option>
                        <option value="📈">📈 Placement</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Type de Compte</label>
                      <select
                        value={newWalletType}
                        onChange={(e) => setNewWalletType(e.target.value as any)}
                        className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                      >
                        <option value="checking">Courant / Dépôt</option>
                        <option value="savings">Épargne</option>
                        <option value="cash">Espèces</option>
                        <option value="emergency">Urgence</option>
                        <option value="investment">Investissement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Solde Initial ({currency})</label>
                      <input
                        type="number"
                        step="any"
                        value={newWalletBalance}
                        onChange={(e) => setNewWalletBalance(e.target.value)}
                        className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="newWalletExcludeAnalytics"
                      checked={newWalletExcludeAnalytics}
                      onChange={(e) => setNewWalletExcludeAnalytics(e.target.checked)}
                      className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="newWalletExcludeAnalytics" className="text-[11px] font-bold text-amber-900 cursor-pointer">
                      🔒 Caisse Noire (Exclure des analyses & audits)
                      <span className="block text-[10px] text-amber-700 font-normal">
                        Ce portefeuille alimentera vos dépenses sans perturber le budget/audit global.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Enregistrer le Portefeuille
                  </button>
                </form>
              )}

              {/* List of Wallets */}
              <div className="space-y-2.5">
                {wallets.map((w) => (
                  <div key={w.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-xs">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl p-2 bg-slate-100 rounded-xl">{w.icon || '💳'}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-xs text-slate-900">{w.name}</h4>
                          {getWalletTypeBadge(w.type)}
                          {w.excludeFromAnalytics && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              🔒 Caisse Noire
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {w.id}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-3">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Solde Actuel</span>
                        <span className="text-sm font-black text-slate-900">{w.balance.toFixed(2)} {currency}</span>
                      </div>

                      {onToggleWalletExcludeAnalytics && (
                        <button
                          type="button"
                          onClick={() => onToggleWalletExcludeAnalytics(w.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            w.excludeFromAnalytics
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800'
                          }`}
                          title="Basculer le statut Caisse Noire (exclu des audits)"
                        >
                          {w.excludeFromAnalytics ? '🔒 Caisse Noire' : '🔓 Inclure'}
                        </button>
                      )}

                      {onDeleteWallet && wallets.length > 2 && (
                        <button
                          onClick={() => onDeleteWallet(w.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors"
                          title="Supprimer"
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

          {/* TAB 3: TRANSFER HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
                Historique des Virements Inter-Comptes
              </span>

              {transfers.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-bold">Aucun virement enregistré</p>
                  <p className="text-[11px] text-slate-400">Effectuez votre premier transfert de solde pour le voir ici.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transfers.map((tr) => (
                    <div key={tr.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                          <span>{tr.fromWalletName}</span>
                          <ArrowRightLeft className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{tr.toWalletName}</span>
                        </div>
                        <span className="font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                          +{tr.amount} {currency}
                        </span>
                      </div>
                      {tr.note && <p className="text-[11px] text-slate-500 italic">"{tr.note}"</p>}
                      <span className="text-[9px] font-mono text-slate-400 block">
                        {new Date(tr.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
