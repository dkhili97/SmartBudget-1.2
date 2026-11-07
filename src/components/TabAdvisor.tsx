import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  User,
  MessageSquareQuote,
  Calculator,
  Activity,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Sliders,
  Scale,
} from 'lucide-react';
import { BudgetState, ChatMessage, CustomRatios, AIAuditResult } from '../types';
import { calculateFinancialMetrics } from '../lib/financialMath';
import { generateAdvisorOfflineReply, generateAuditOffline } from '../lib/offlineAdvisor';
import { AIProposalCard } from './AIProposalCard';

interface TabAdvisorProps {
  budgetData: BudgetState;
  auditResult?: AIAuditResult | null;
  onSetAuditResult?: (result: AIAuditResult) => void;
  onApplyCustomRatios?: (ratios: CustomRatios) => void;
  onApplyItemBudget?: (itemId: string, newBudget: number) => void;
  onExecuteTransfer?: (fromId: string, toId: string, amount: number, note: string) => void;
  onLogAdvisorInteraction?: (userPrompt: string, aiResponse: string, proposalsCount: number) => void;
}

export const TabAdvisor: React.FC<TabAdvisorProps> = ({
  budgetData,
  auditResult,
  onSetAuditResult,
  onApplyCustomRatios,
  onApplyItemBudget,
  onExecuteTransfer,
  onLogAdvisorInteraction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'diagnostic' | 'chat'>('diagnostic');

  // Interactive "What-If" Savings Simulator state
  const [wantsCutPercent, setWantsCutPercent] = useState<number>(15);
  const [needsCutPercent, setNeedsCutPercent] = useState<number>(5);

  const localMetrics = calculateFinancialMetrics(budgetData);

  // Diagnostic state
  const [diagnostic, setDiagnostic] = useState<AIAuditResult>(() => {
    return auditResult || generateAuditOffline(budgetData);
  });

  useEffect(() => {
    const fresh = generateAuditOffline(budgetData);
    setDiagnostic(fresh);
    if (onSetAuditResult) onSetAuditResult(fresh);
  }, [budgetData]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Bonjour ${budgetData.userAccount?.name || 'cher utilisateur'} ! Je suis votre **Conseiller Financier IA Hors-Ligne**.

J'ai analysé votre budget de **${budgetData.income} ${budgetData.currency}** et vos transactions en temps réel.

N'hésitez pas à me demander comment équilibrer vos dépenses, simuler un achat, ou optimiser votre épargne !`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    `Puis-je me permettre un achat à 150 ${budgetData.currency} ce mois-ci ?`,
    `Comment rééquilibrer mes ratios 50/30/20 ?`,
    `Combien me reste-t-il exactement cette semaine ?`,
    `Fais un bilan global de mes finances.`,
  ];

  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeSubTab]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const reply = generateAdvisorOfflineReply(query, budgetData);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposals: [],
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (onLogAdvisorInteraction) {
        onLogAdvisorInteraction(query, reply, 0);
      }
    } catch (error: any) {
      console.error('Advisor chat error:', error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: '⚠️ Une erreur s\'est produite lors de l\'analyse locale de votre budget.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-msg-reset',
        sender: 'assistant',
        text: `Discussion réinitialisée ! Posez-moi vos questions sur vos données budgétaires actuelles (${budgetData.income} ${budgetData.currency}).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

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
    alert('✅ Nouveaux ratios 50/30/20 appliqués avec succès !');
  };

  const healthColor =
    (diagnostic.overallHealth || localMetrics.healthStatus) === 'EXCELLENT'
      ? 'text-emerald-700 border-emerald-300 bg-emerald-50'
      : (diagnostic.overallHealth || localMetrics.healthStatus) === 'BON'
      ? 'text-teal-700 border-teal-300 bg-teal-50'
      : (diagnostic.overallHealth || localMetrics.healthStatus) === 'ATTENTION'
      ? 'text-amber-700 border-amber-300 bg-amber-50'
      : 'text-rose-700 border-rose-300 bg-rose-50';

  return (
    <div className="space-y-4 mb-24 animate-fadeIn">
      {/* Top Segmented Selector */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center max-w-sm mx-auto border border-slate-200/80">
        <button
          onClick={() => setActiveSubTab('diagnostic')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'diagnostic'
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Diagnostic &amp; Santé</span>
        </button>
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'chat'
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>Discussion IA</span>
        </button>
      </div>

      {/* SUB-VIEW 1: DIAGNOSTIC & SANTE */}
      {activeSubTab === 'diagnostic' && (
        <div className="space-y-4">
          {/* Health Score Overview Card */}
          <div className="p-5 sm:p-6 rounded-[32px] bg-white border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Score de Santé Financière</h3>
                  <p className="text-[11px] text-slate-400">Analyse mathématique autonome</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${healthColor}`}>
                {diagnostic.healthScore}/100 • {diagnostic.overallHealth}
              </span>
            </div>

            {/* Score progress bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  diagnostic.healthScore >= 80
                    ? 'bg-emerald-500'
                    : diagnostic.healthScore >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, diagnostic.healthScore))}%` }}
              />
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Charges Fixes</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {localMetrics.spent.needs.toFixed(0)} / {localMetrics.targets.needs.toFixed(0)} {budgetData.currency}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Envies &amp; Loisirs</span>
                <span className="font-mono font-bold text-slate-800 text-xs">
                  {localMetrics.spent.wants.toFixed(0)} / {localMetrics.targets.wants.toFixed(0)} {budgetData.currency}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Épargne Réelle</span>
                <span className="font-mono font-bold text-emerald-700 text-xs">
                  {localMetrics.spent.savings.toFixed(0)} / {localMetrics.targets.savings.toFixed(0)} {budgetData.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Key Observations */}
          {diagnostic.observations && diagnostic.observations.length > 0 && (
            <div className="p-5 rounded-[28px] bg-white border border-slate-100 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Observations de l'Audit</span>
              </h4>
              <div className="space-y-2">
                {diagnostic.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2.5 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive "What-If" Simulator */}
          <div className="p-5 sm:p-6 rounded-[32px] bg-gradient-to-br from-emerald-50/60 via-teal-50/30 to-white border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Simulateur d'Économies "Et si..."
                  </h4>
                  <p className="text-[10px] text-slate-500">Ajustez pour voir votre potentiel d'épargne</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Réduire les dépenses Plaisirs / Envies :</span>
                  <span className="font-mono text-emerald-700 font-extrabold">-{wantsCutPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="5"
                  value={wantsCutPercent}
                  onChange={(e) => setWantsCutPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Optimiser les charges fixes / factures :</span>
                  <span className="font-mono text-emerald-700 font-extrabold">-{needsCutPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="2"
                  value={needsCutPercent}
                  onChange={(e) => setNeedsCutPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gain Mensuel Simulé</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  +{totalSimulatedMonthlyGain} {budgetData.currency} / mois
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Soit +{totalSimulatedYearlyGain} {budgetData.currency} par an
                </span>
              </div>
              <button
                onClick={handleApplySimulatedRatios}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DISCUSSION IA */}
      {activeSubTab === 'chat' && (
        <div className="flex flex-col h-[70vh] max-h-[640px] bg-white border border-slate-100 rounded-[32px] shadow-xs overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white text-slate-800 border-b border-emerald-100 flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  FinExpert AI <Sparkles className="w-3 h-3 text-amber-500" />
                </h3>
                <p className="text-[9px] text-emerald-700 font-medium">100% Hors-Ligne &amp; Privé</p>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors border border-slate-200 text-xs"
              title="Effacer la discussion"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-1.5">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-emerald-900 transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                <MessageSquareQuote className="w-3 h-3 text-emerald-600" />
                <span className="truncate max-w-[200px]">{prompt}</span>
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  <div className="max-w-[85%] space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-none font-medium shadow-xs'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-xs'
                      }`}
                    >
                      {msg.text}
                    </div>

                    <span className={`text-[9px] text-slate-400 font-mono block ${isUser ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-emerald-800 italic bg-emerald-50 p-2.5 rounded-2xl border border-emerald-100 max-w-[80%]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span>FinExpert analyse vos données...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-2.5 bg-white border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-1.5"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Posez votre question à l'IA..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 text-slate-800 text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputPrompt.trim() || isLoading}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
