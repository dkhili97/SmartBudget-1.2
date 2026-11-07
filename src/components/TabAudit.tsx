import React, { useState, useEffect } from 'react';
import {
  Calculator,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Flame,
  Lightbulb,
  Activity,
  ShieldCheck,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { BudgetState, AIAuditResult, CustomRatios } from '../types';
import { calculateFinancialMetrics } from '../lib/financialMath';
import { AIProposalCard } from './AIProposalCard';
import { generateAuditOffline } from '../lib/offlineAdvisor';

interface TabAuditProps {
  budgetData: BudgetState;
  auditResult: AIAuditResult | null;
  onSetAuditResult: (result: AIAuditResult) => void;
  onApplyCustomRatios?: (ratios: CustomRatios) => void;
  onApplyItemBudget?: (itemId: string, newBudget: number) => void;
  onLogAuditRun?: (audit: AIAuditResult) => void;
}

export const TabAudit: React.FC<TabAuditProps> = ({
  budgetData,
  auditResult,
  onSetAuditResult,
  onApplyCustomRatios,
  onApplyItemBudget,
  onLogAuditRun,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive "What-If" Savings Simulator state
  const [wantsCutPercent, setWantsCutPercent] = useState<number>(15);
  const [needsCutPercent, setNeedsCutPercent] = useState<number>(5);

  const localMetrics = calculateFinancialMetrics(budgetData);

  const runAudit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Diagnostic financier et audit mathématique 100% hors-ligne
      const data: AIAuditResult = generateAuditOffline(budgetData);
      onSetAuditResult(data);
      if (onLogAuditRun) onLogAuditRun(data);
    } catch (e: any) {
      console.error('Audit generation error:', e);
      setErrorMsg(e?.message || "Impossible de générer l'audit budgétaire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auditResult) {
      runAudit();
    }
  }, []);

  // Simulator calculations
  const baseWants = Math.max(localMetrics.spent.wants, localMetrics.targets.wants);
  const baseNeeds = Math.max(localMetrics.spent.needs, localMetrics.targets.needs);
  const monthlyGainFromWants = (baseWants * wantsCutPercent) / 100;
  const monthlyGainFromNeeds = (baseNeeds * needsCutPercent) / 100;
  const totalSimulatedMonthlyGain = Math.round(monthlyGainFromWants + monthlyGainFromNeeds);
  const totalSimulatedYearlyGain = totalSimulatedMonthlyGain * 12;

  const handleApplySimulatedRatios = () => {
    if (!onApplyCustomRatios || budgetData.income <= 0) return;
    const currentRatios = budgetData.customRatios || { needs: 50, wants: 30, savings: 20 };
    const wantsReductionPts = Math.max(1, Math.round((currentRatios.wants * wantsCutPercent) / 100));
    const needsReductionPts = Math.max(0, Math.round((currentRatios.needs * needsCutPercent) / 100));
    const newWants = Math.max(5, currentRatios.wants - wantsReductionPts);
    const newNeeds = Math.max(20, currentRatios.needs - needsReductionPts);
    const newSavings = Math.max(5, 100 - newNeeds - newWants);

    onApplyCustomRatios({
      needs: newNeeds,
      wants: newWants,
      savings: newSavings,
    });
  };

  const healthColor =
    (auditResult?.overallHealth || localMetrics.healthStatus) === 'EXCELLENT'
      ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
      : (auditResult?.overallHealth || localMetrics.healthStatus) === 'BON'
      ? 'text-teal-700 border-teal-200 bg-teal-50'
      : (auditResult?.overallHealth || localMetrics.healthStatus) === 'ATTENTION'
      ? 'text-amber-700 border-amber-200 bg-amber-50'
      : 'text-rose-700 border-rose-200 bg-rose-50';

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* Header card with Trigger Button */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Analyse Quotidienne & Bilan Mathématique
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diagnostic algorithmique instantané, simulateur d'épargne et conseils d'ajustement
          </p>
        </div>

        <button
          onClick={runAudit}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center justify-center space-x-2 shadow-2xs transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`}
          />
          <span>{loading ? 'Analyse en cours...' : "Actualiser l'audit"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Health Status Ring & Summary */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs text-center relative overflow-hidden space-y-4">
        <div className="flex justify-center items-center">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="currentColor"
                strokeWidth="10"
                strokeDasharray={326}
                strokeDashoffset={
                  326 - (326 * (auditResult?.healthScore || localMetrics.healthScore)) / 100
                }
                className={
                  (auditResult?.healthScore || localMetrics.healthScore) >= 80
                    ? 'text-emerald-500'
                    : (auditResult?.healthScore || localMetrics.healthScore) >= 60
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-mono font-bold text-slate-900">
                {auditResult?.healthScore || localMetrics.healthScore}
              </span>
              <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">
                / 100
              </span>
            </div>
          </div>
        </div>

        <div
          className={`inline-block px-3 py-1 rounded-md border text-xs font-black tracking-wide uppercase ${healthColor}`}
        >
          STATUT : {auditResult?.overallHealth || localMetrics.healthStatus}
        </div>

        <p className="text-xs text-slate-700 leading-relaxed max-w-lg mx-auto font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          "
          {auditResult?.summary ||
            'Votre budget est équilibré. Continuez à suivre régulièrement vos dépenses.'}
          "
        </p>

        {auditResult?.generatedAt && (
          <span className="text-[10px] text-slate-400 font-mono block">
            Dernier calcul: {new Date(auditResult.generatedAt).toLocaleString('fr-FR')}
          </span>
        )}
      </div>

      {/* Burn Rate & Time Velocity Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Burn Rate Quotidien
          </span>
          <span className="text-base font-mono font-bold text-amber-600 block">
            {(auditResult?.burnRateDaily || localMetrics.burnRateDaily).toFixed(1)}{' '}
            {budgetData.currency}/j
          </span>
          <span className="text-[10px] text-slate-400 block">Vitesse moyenne</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Projection Fin de Mois
          </span>
          <span className="text-base font-mono font-bold text-emerald-700 block">
            {(
              auditResult?.projectedEndMonthSpent || localMetrics.projectedEndMonthExpense
            ).toFixed(0)}{' '}
            {budgetData.currency}
          </span>
          <span className="text-[10px] text-slate-400 block">Dépenses anticipées</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs sm:col-span-1 col-span-2 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-teal-600" /> Solde Épargne Projeté
          </span>
          <span className="text-base font-mono font-bold text-teal-700 block">
            {(auditResult?.projectedSavings || localMetrics.projectedSavings).toFixed(0)}{' '}
            {budgetData.currency}
          </span>
          <span className="text-[10px] text-slate-400 block">Capital conservé</span>
        </div>
      </div>

      {/* Interactive "What-If" Savings Simulator */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 text-slate-800 rounded-[28px] border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/90 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Simulateur Interactif d'Optimisation ("What-If")
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulez une réduction de vos dépenses variables pour projeter votre gain d'épargne
            </p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            +{totalSimulatedYearlyGain} {budgetData.currency} / an
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Optimisation Plaisirs & Envies</span>
              <span className="font-mono font-bold text-amber-600">-{wantsCutPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={wantsCutPercent}
              onChange={(e) => setWantsCutPercent(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 flex justify-between">
              <span>Base: {baseWants.toFixed(0)} {budgetData.currency}</span>
              <span className="text-emerald-700 font-mono font-bold">
                Gain: +{monthlyGainFromWants.toFixed(0)} {budgetData.currency}/mois
              </span>
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Optimisation Besoins Courants</span>
              <span className="font-mono font-bold text-teal-700">-{needsCutPercent}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={5}
              value={needsCutPercent}
              onChange={(e) => setNeedsCutPercent(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 flex justify-between">
              <span>Base: {baseNeeds.toFixed(0)} {budgetData.currency}</span>
              <span className="text-emerald-700 font-mono font-bold">
                Gain: +{monthlyGainFromNeeds.toFixed(0)} {budgetData.currency}/mois
              </span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Potentiel d'Épargne Supplémentaire
            </span>
            <p className="text-xs text-slate-800 font-semibold">
              +<span className="text-base font-mono font-extrabold text-emerald-700">{totalSimulatedMonthlyGain} {budgetData.currency}</span> / mois soit{' '}
              <span className="font-mono font-bold text-emerald-800">
                +{totalSimulatedYearlyGain} {budgetData.currency}
              </span>{' '}
              sur 12 mois
            </p>
          </div>
          {onApplyCustomRatios && (
            <button
              type="button"
              onClick={handleApplySimulatedRatios}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Appliquer ces ratios cibles</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Action Proposals */}
      {auditResult?.proposals && auditResult.proposals.length > 0 && (
        <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-[32px] space-y-3">
          <h3 className="text-sm font-bold text-emerald-950 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ajustements AI Recommandés pour Stabiliser votre Budget</span>
          </h3>
          <div className="space-y-2">
            {auditResult.proposals.map((prop) => (
              <AIProposalCard
                key={prop.id}
                proposal={prop}
                currency={budgetData.currency}
                onApplyRatiosProposal={onApplyCustomRatios}
                onApplyItemBudgetProposal={onApplyItemBudget}
              />
            ))}
          </div>
        </div>
      )}

      {/* Key Findings */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-500" />
          <span>Constats Clés Mathématiques</span>
        </h3>

        <div className="space-y-2">
          {(
            auditResult?.keyFindings || [
              `Vos charges fixes consomment ${(
                (localMetrics.spent.needs / (localMetrics.income || 1)) *
                100
              ).toFixed(0)}% de votre revenu.`,
              `Dépenses dans la catégorie Plaisirs: ${localMetrics.spent.wants} ${budgetData.currency}.`,
              `Il vous reste ${localMetrics.timing.daysRemaining} jours dans le mois.`,
            ]
          ).map((finding, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-800"
            >
              <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center justify-center shrink-0 text-[10px]">
                {idx + 1}
              </span>
              <span className="leading-relaxed font-medium">{finding}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-emerald-600" />
          <span>Plan d'Action Recommandé</span>
        </h3>

        <div className="space-y-2">
          {(
            auditResult?.actionPlan || [
              'Verrouiller le budget Plaisirs pour le reste de la semaine.',
              "Consolider l'épargne dès le début de mois.",
              "Mettre à jour régulièrement l'application à chaque transaction.",
            ]
          ).map((action, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-2.5 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-xs text-emerald-900"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-semibold">{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
