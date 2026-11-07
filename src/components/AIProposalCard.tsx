import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { AIActionProposal, CustomRatios } from '../types';

interface AIProposalCardProps {
  proposal: AIActionProposal;
  currency: string;
  onApplyRatiosProposal?: (newRatios: CustomRatios) => void;
  onApplyItemBudgetProposal?: (itemId: string, newBudget: number) => void;
  onExecuteTransferProposal?: (fromId: string, toId: string, amount: number, note: string) => void;
}

export const AIProposalCard: React.FC<AIProposalCardProps> = ({
  proposal,
  currency,
  onApplyRatiosProposal,
  onApplyItemBudgetProposal,
  onExecuteTransferProposal,
}) => {
  const [isApplied, setIsApplied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleApply = () => {
    if (proposal.actionType === 'adjust_ratios' && proposal.ratios && onApplyRatiosProposal) {
      onApplyRatiosProposal(proposal.ratios);
      setIsApplied(true);
      setIsConfirming(false);
    } else if (
      proposal.actionType === 'adjust_item_budget' &&
      proposal.itemId &&
      proposal.newItemBudget !== undefined &&
      onApplyItemBudgetProposal
    ) {
      onApplyItemBudgetProposal(proposal.itemId, proposal.newItemBudget);
      setIsApplied(true);
      setIsConfirming(false);
    } else if (
      proposal.actionType === 'transfer_envelope_budget' &&
      proposal.transferData &&
      onExecuteTransferProposal
    ) {
      onExecuteTransferProposal(
        proposal.transferData.fromId,
        proposal.transferData.toId,
        proposal.transferData.amount,
        `Recommandation AI: Transfert de ${proposal.transferData.fromName} vers ${proposal.transferData.toName}`
      );
      setIsApplied(true);
      setIsConfirming(false);
    } else {
      setIsApplied(true);
      setIsConfirming(false);
    }
  };

  return (
    <div className="my-2.5 p-3.5 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl shadow-xs space-y-2.5 text-slate-800 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              {proposal.title}
              <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                Recommandation AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              {proposal.description}
            </p>
          </div>
        </div>
      </div>

      {/* Preview values if available */}
      {proposal.actionType === 'adjust_ratios' && proposal.ratios && (
        <div className="flex items-center justify-around bg-white p-2 rounded-xl border border-emerald-100 text-[11px] font-bold text-slate-700">
          <span className="text-emerald-700">Besoins : {proposal.ratios.needs}%</span>
          <span className="text-teal-700">Plaisirs : {proposal.ratios.wants}%</span>
          <span className="text-emerald-800">Épargne : {proposal.ratios.savings}%</span>
        </div>
      )}

      {proposal.actionType === 'adjust_item_budget' && proposal.newItemBudget !== undefined && (
        <div className="bg-white p-2 rounded-xl border border-emerald-100 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
          <span>Ajustement Budget Poste :</span>
          <span className="text-emerald-600 font-mono text-xs">{proposal.newItemBudget} {currency}</span>
        </div>
      )}

      {/* Action button area */}
      <div className="pt-1">
        {isApplied ? (
          <div className="w-full py-2 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Ajustement Appliqué avec Succès !</span>
          </div>
        ) : isConfirming ? (
          <div className="flex items-center space-x-2 animate-fadeIn">
            <button
              onClick={handleApply}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmer & Appliquer</span>
            </button>
            <button
              onClick={() => setIsConfirming(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirming(true)}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Appliquer cet Ajustement Automatique</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
