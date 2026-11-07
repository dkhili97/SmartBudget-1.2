import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Trash2, User, RefreshCw, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { BudgetState, ChatMessage, CustomRatios } from '../types';
import { AIProposalCard } from './AIProposalCard';
import { generateAdvisorOfflineReply } from '../lib/offlineAdvisor';

interface TabAdvisorProps {
  budgetData: BudgetState;
  onApplyCustomRatios?: (ratios: CustomRatios) => void;
  onApplyItemBudget?: (itemId: string, newBudget: number) => void;
  onExecuteTransfer?: (fromId: string, toId: string, amount: number, note: string) => void;
  onLogAdvisorInteraction?: (userPrompt: string, aiResponse: string, proposalsCount: number) => void;
}

export const TabAdvisor: React.FC<TabAdvisorProps> = ({
  budgetData,
  onApplyCustomRatios,
  onApplyItemBudget,
  onExecuteTransfer,
  onLogAdvisorInteraction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Bonjour ${budgetData.userAccount?.name || 'Karim'} ! Je suis votre **Conseiller Financier AI Expert**.

J'ai analysé en temps réel votre budget de **${budgetData.income} ${budgetData.currency}** et vos transactions actuelles.

Si nécessaire, je peux vous proposer des **ajustements automatiques** de vos allocations pour préserver votre stabilité financière.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    `Puis-je me permettre d'acheter un objet à 300 ${budgetData.currency} ce mois-ci ?`,
    `Ajuste mon plan financier si j'ai trop dépensé en Plaisirs.`,
    `Combien me reste-t-il exactement cette semaine ?`,
    `Comment rééquilibrer mes ratios 50/30/20 ?`,
    `Fais un bilan global de mon budget.`,
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
      // Analyse et réponse 100% hors-ligne (aucune API externe requise)
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
        text: '⚠️ Oups ! Une erreur s\'est produite lors de l\'analyse locale de votre budget.',
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

  return (
    <div className="flex flex-col h-[78vh] max-h-[700px] bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden mb-24 animate-fadeIn">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white text-slate-800 border-b border-emerald-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-2xs">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              FinExpert AI <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h3>
            <p className="text-[10px] text-emerald-700 font-medium">
              Conseiller & Ajusteur Financier Intelligent
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors border border-slate-200 text-xs"
          title="Effacer la discussion"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-100 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-900 transition-all shrink-0 active:scale-95 disabled:opacity-50 shadow-xs"
          >
            <MessageSquareQuote className="w-3 h-3 text-emerald-600" />
            <span className="truncate max-w-[220px]">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[85%] space-y-1`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none font-medium shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render AI Action Proposals if any */}
                {!isUser && msg.proposals && msg.proposals.length > 0 && (
                  <div className="pt-1">
                    {msg.proposals.map((prop) => (
                      <AIProposalCard
                        key={prop.id}
                        proposal={prop}
                        currency={budgetData.currency}
                        onApplyRatiosProposal={onApplyCustomRatios}
                        onApplyItemBudgetProposal={onApplyItemBudget}
                        onExecuteTransferProposal={onExecuteTransfer}
                      />
                    ))}
                  </div>
                )}

                <span className={`text-[9px] text-slate-400 font-mono block ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2.5 text-xs text-emerald-800 italic bg-emerald-50 p-3 rounded-2xl border border-emerald-100 max-w-[75%]">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>FinExpert AI analyse vos données et prépare ses recommandations...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Posez votre question ou demandez un réajustement de plan..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 text-slate-800 text-xs border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

