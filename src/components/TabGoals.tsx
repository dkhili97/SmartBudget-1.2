import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Zap,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  ArrowUpRight,
  PieChart,
  Coins,
  Layers,
  Info,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { BudgetState, FinancialGoal, StrategyLog } from '../types';

interface TabGoalsProps {
  budgetData: BudgetState;
  onUpdateGoals: (updatedGoals: FinancialGoal[], logEntry?: StrategyLog) => void;
  onAddContributionTransaction?: (goalTitle: string, amount: number) => void;
}

export const TabGoals: React.FC<TabGoalsProps> = ({
  budgetData,
  onUpdateGoals,
  onAddContributionTransaction,
}) => {
  const currency = budgetData.currency || 'TND';
  const income = budgetData.income || 0;
  const savingsEnvelope = (income * (budgetData.customRatios?.savings || 20)) / 100;
  const goals = budgetData.goals || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<FinancialGoal['category']>('emergency');
  const [formTargetAmount, setFormTargetAmount] = useState('');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formMonthlyContribution, setFormMonthlyContribution] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [formPriority, setFormPriority] = useState<FinancialGoal['priority']>('high');
  const [formNotes, setFormNotes] = useState('');

  // Calculations
  const totalTarget = goals.reduce((acc, g) => acc + (g.targetAmount || 0), 0);
  const totalCurrent = goals.reduce((acc, g) => acc + (g.currentAmount || 0), 0);
  const totalMonthlyAllocated = goals.reduce((acc, g) => acc + (g.monthlyContribution || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;

  // AI Allocation Engine calculation
  const computeAIAllocation = () => {
    if (goals.length === 0 || savingsEnvelope <= 0) return [];

    const activeGoals = goals.filter((g) => g.status !== 'completed');
    if (activeGoals.length === 0) return [];

    // Weights by priority
    const priorityWeights: Record<FinancialGoal['priority'], number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const totalWeight = activeGoals.reduce((acc, g) => acc + (priorityWeights[g.priority] || 1), 0);

    return activeGoals.map((g) => {
      const weight = priorityWeights[g.priority] || 1;
      const suggestedMonthly = Math.round((savingsEnvelope * (weight / totalWeight)) * 100) / 100;
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const monthsToTargetAtSuggested = suggestedMonthly > 0 ? Math.ceil(remainingAmount / suggestedMonthly) : 0;

      return {
        goalId: g.id,
        title: g.title,
        currentMonthly: g.monthlyContribution,
        suggestedMonthly,
        monthsToTargetAtSuggested,
      };
    });
  };

  const aiAllocations = computeAIAllocation();

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormCategory('emergency');
    setFormTargetAmount('1000');
    setFormCurrentAmount('0');
    setFormMonthlyContribution('100');
    setFormTargetDate(new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0]);
    setFormPriority('high');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormCategory(goal.category);
    setFormTargetAmount(goal.targetAmount.toString());
    setFormCurrentAmount(goal.currentAmount.toString());
    setFormMonthlyContribution(goal.monthlyContribution.toString());
    setFormTargetDate(goal.targetDate);
    setFormPriority(goal.priority);
    setFormNotes(goal.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseFloat(formTargetAmount) || 0;
    const currAmt = parseFloat(formCurrentAmount) || 0;
    const monthlyContrib = parseFloat(formMonthlyContribution) || 0;

    if (!formTitle.trim() || targetAmt <= 0) {
      alert('Veuillez entrer un titre valide et un montant cible supérieur à 0.');
      return;
    }

    if (editingGoal) {
      const updatedList = goals.map((g) =>
        g.id === editingGoal.id
          ? {
              ...g,
              title: formTitle,
              category: formCategory,
              targetAmount: targetAmt,
              currentAmount: currAmt,
              monthlyContribution: monthlyContrib,
              targetDate: formTargetDate,
              priority: formPriority,
              notes: formNotes,
              status: currAmt >= targetAmt ? ('completed' as const) : g.status,
              updatedAt: new Date().toISOString(),
            }
          : g
      );

      const logEntry: StrategyLog = {
        id: `goal-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item',
        title: `Objectif Modifié : ${formTitle}`,
        details: `Cible: ${targetAmt} ${currency} | Épargne mensuelle: ${monthlyContrib} ${currency}/mois`,
        oldVal: `${editingGoal.targetAmount} ${currency}`,
        newVal: `${targetAmt} ${currency}`,
      };

      onUpdateGoals(updatedList, logEntry);
      setNotice(`Objectif "${formTitle}" mis à jour avec succès !`);
    } else {
      const newGoal: FinancialGoal = {
        id: `goal-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        targetAmount: targetAmt,
        currentAmount: currAmt,
        monthlyContribution: monthlyContrib,
        targetDate: formTargetDate,
        priority: formPriority,
        status: currAmt >= targetAmt ? 'completed' : 'in_progress',
        notes: formNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const logEntry: StrategyLog = {
        id: `goal-log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item',
        title: `Nouvel Objectif Créé : ${formTitle}`,
        details: `Catégorie: ${formCategory} | Cible: ${targetAmt} ${currency} | Contribution: ${monthlyContrib} ${currency}/mois`,
        newVal: `${targetAmt} ${currency}`,
      };

      onUpdateGoals([...goals, newGoal], logEntry);
      setNotice(`Objectif "${formTitle}" créé et enregistré dans l'historique !`);
    }

    setIsModalOpen(false);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    if (confirm(`Voulez-vous vraiment supprimer l'objectif "${title}" ?`)) {
      const updatedList = goals.filter((g) => g.id !== goalId);
      const logEntry: StrategyLog = {
        id: `goal-del-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'item',
        title: `Objectif Supprimé : ${title}`,
        details: `L'objectif a été retiré de votre portefeuille financier.`,
      };
      onUpdateGoals(updatedList, logEntry);
    }
  };

  const handleApplyAIAllocation = () => {
    if (aiAllocations.length === 0) return;

    const updatedGoals = goals.map((g) => {
      const match = aiAllocations.find((a) => a.goalId === g.id);
      if (match) {
        return {
          ...g,
          monthlyContribution: match.suggestedMonthly,
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });

    const logEntry: StrategyLog = {
      id: `ai-alloc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'ratio',
      title: 'IA Portefeuille : Rééquilibrage d\'Allocation d\'Épargne',
      details: `Allocation optimale calculée par l'IA sur l'enveloppe d'épargne mensuelle de ${savingsEnvelope} ${currency}.`,
      newVal: `${updatedGoals.reduce((a, b) => a + b.monthlyContribution, 0)} ${currency}/mois`,
    };

    onUpdateGoals(updatedGoals, logEntry);
    setNotice('✨ Allocation recommandée par l\'IA appliquée et consignée dans l\'Historique !');
    setTimeout(() => setNotice(null), 3500);
  };

  const handleOpenDepositModal = (goal: FinancialGoal) => {
    setSelectedGoalForDeposit(goal);
    setDepositAmount('50');
    setIsDepositModalOpen(true);
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Veuillez saisir un montant positif.');
      return;
    }

    const updatedGoals = goals.map((g) => {
      if (g.id === selectedGoalForDeposit.id) {
        const newCurr = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newCurr,
          status: newCurr >= g.targetAmount ? ('completed' as const) : g.status,
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });

    const logEntry: StrategyLog = {
      id: `goal-dep-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'income',
      title: `Versements Objectif : +${amount} ${currency} -> ${selectedGoalForDeposit.title}`,
      details: `Nouveau solde épargné sur l'objectif: ${(selectedGoalForDeposit.currentAmount + amount)} / ${selectedGoalForDeposit.targetAmount} ${currency}`,
      oldVal: `${selectedGoalForDeposit.currentAmount} ${currency}`,
      newVal: `${selectedGoalForDeposit.currentAmount + amount} ${currency}`,
    };

    if (onAddContributionTransaction) {
      onAddContributionTransaction(`Épargne Objectif: ${selectedGoalForDeposit.title}`, amount);
    }

    onUpdateGoals(updatedGoals, logEntry);
    setIsDepositModalOpen(false);
    setNotice(`+${amount} ${currency} versés avec succès sur "${selectedGoalForDeposit.title}" !`);
    setTimeout(() => setNotice(null), 3000);
  };

  const getCategoryBadge = (cat: FinancialGoal['category']) => {
    switch (cat) {
      case 'emergency':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🛡️ Urgence</span>;
      case 'housing':
        return <span className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🏠 Logement</span>;
      case 'travel':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">✈️ Voyage</span>;
      case 'investment':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">📈 Investissement</span>;
      case 'vehicle':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🚗 Véhicule</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">🎯 Autre</span>;
    }
  };

  const getPriorityBadge = (p: FinancialGoal['priority']) => {
    switch (p) {
      case 'high':
        return <span className="text-rose-600 font-extrabold text-[10px] uppercase tracking-wider">▲ Priorité Haute</span>;
      case 'medium':
        return <span className="text-amber-600 font-bold text-[10px] uppercase tracking-wider">● Priorité Moyenne</span>;
      case 'low':
        return <span className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">▼ Priorité Normale</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Notice Banner */}
      {notice && (
        <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 text-slate-800 rounded-3xl shadow-xs border border-emerald-200/80 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold mb-2">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rubrique Objectifs Financiers</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">Suivi & Atteinte du Portefeuille</h2>
              <p className="text-xs text-slate-500">
                Planification intelligente, versements réguliers et synchronisation dans l'Historique.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl flex items-center space-x-1.5 shadow-xs transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel Objectif</span>
            </button>
          </div>

          {/* Overview Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-100/90 text-xs">
            <div className="bg-white/95 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Épargne Totale</span>
              <span className="text-sm font-black text-emerald-700 font-mono">{totalCurrent.toFixed(0)} {currency}</span>
            </div>
            <div className="bg-white/95 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Cible Totale</span>
              <span className="text-sm font-black text-slate-900 font-mono">{totalTarget.toFixed(0)} {currency}</span>
            </div>
            <div className="bg-white/95 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Progression Globale</span>
              <span className="text-sm font-black text-teal-700 font-mono">{overallProgress}%</span>
            </div>
            <div className="bg-white/95 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Allocation Mensuelle</span>
              <span className="text-sm font-black text-amber-700 font-mono">{totalMonthlyAllocated} / {savingsEnvelope} {currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Portfolio Rebalancing Module */}
      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-2xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Allocation Optimale de Portefeuille (IA)</h3>
              <p className="text-xs text-slate-500">
                Enveloppe d'épargne mensuelle disponible : <strong>{savingsEnvelope} {currency}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleApplyAIAllocation}
            disabled={aiAllocations.length === 0}
            className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Appliquer l'Allocation IA</span>
          </button>
        </div>

        {/* AI Allocation Table */}
        {aiAllocations.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {aiAllocations.map((item) => (
              <div key={item.goalId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[200px]">
                  {item.title}
                </span>
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="text-slate-500">Actuel: <strong className="text-slate-700">{item.currentMonthly} {currency}</strong></span>
                  <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Suggéré : {item.suggestedMonthly} {currency}/mois
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            Ajoutez au moins un objectif actif pour générer la suggestion d'allocation par l'IA.
          </p>
        )}
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
          Vos Objectifs en Cours ({goals.length})
        </h3>

        {goals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
            <Target className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Aucun objectif financier pour le moment</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Créez votre premier objectif (ex: Fonds d'urgence, voyage, achat) pour commencer à planifier et alimenter votre épargne.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer mon Premier Objectif</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isDone = goal.status === 'completed' || goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className={`p-4 bg-white border rounded-3xl shadow-xs transition-all flex flex-col justify-between ${
                    isDone ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Title, Badges */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          {getCategoryBadge(goal.category)}
                          {getPriorityBadge(goal.priority)}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                          {goal.title}
                          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(goal)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id, goal.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{goal.currentAmount.toFixed(0)} {currency}</span>
                        <span className="text-slate-500">Cible: {goal.targetAmount.toFixed(0)} {currency} ({progress}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone ? 'bg-emerald-500' : progress > 60 ? 'bg-emerald-600' : progress > 30 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Date & Contribution */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Échéance</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {goal.targetDate || 'Non spécifiée'}
                        </span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-600">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Versement Mensuel</span>
                        <span className="font-bold text-emerald-700">
                          {goal.monthlyContribution} {currency} / mois
                        </span>
                      </div>
                    </div>

                    {goal.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                        "{goal.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {remaining > 0 ? `Reste à épargner: ${remaining.toFixed(0)} ${currency}` : '🎉 Objectif atteint !'}
                    </span>
                    <button
                      onClick={() => handleOpenDepositModal(goal)}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1 shadow-xs transition-colors"
                    >
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>Alimenter +</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {editingGoal ? 'Modifier l\'Objectif Financier' : 'Créer un Nouvel Objectif'}
            </h3>

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Titre de l'Objectif</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Apport Immobilier, Voyage..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="emergency">🛡️ Urgence / Sécurité</option>
                    <option value="housing">🏠 Logement / Immobilier</option>
                    <option value="travel">✈️ Voyage / Loisir</option>
                    <option value="investment">📈 Investissement</option>
                    <option value="vehicle">🚗 Véhicule</option>
                    <option value="other">🎯 Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="high">Haute (Prioritaire)</option>
                    <option value="medium">Moyenne</option>
                    <option value="low">Basse</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Cible Cible ({currency})</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Montant Actuel ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formCurrentAmount}
                    onChange={(e) => setFormCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Versement Mensuel ({currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={formMonthlyContribution}
                    onChange={(e) => setFormMonthlyContribution(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Cible</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Notes / Description (Optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Objectif d'épargne ou détails..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Alimenter l'Objectif
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verser un montant sur <strong>"{selectedGoalForDeposit.title}"</strong>. Ce versement sera consigné dans l'Historique.
            </p>

            <form onSubmit={handleExecuteDeposit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Montant à verser ({currency})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="py-2 px-3.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Confirmer le Versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
