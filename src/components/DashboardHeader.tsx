import React, { useState } from 'react';
import {
  Calendar,
  FolderPlus,
  ChevronDown,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart,
  Layers,
  ArrowRight,
  Pencil,
  Check,
  Trash2,
  Copy,
  FolderKanban,
  CheckCircle2,
} from 'lucide-react';
import { BudgetState } from '../types';
import { calculateFinancialMetrics } from '../lib/financialMath';
import { getUnifiedProjectList } from '../lib/storage';

interface DashboardHeaderProps {
  budgetData: BudgetState;
  onOpenNewPeriodModal: () => void;
  onOpenProjectsManager?: () => void;
  onOpenPosteRolloverModal?: () => void;
  onSelectPeriodMonth?: (month: string) => void;
  onUpdateIncome?: (income: number) => void;
  onDeletePeriodArchive?: (reportId: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  budgetData,
  onOpenNewPeriodModal,
  onOpenProjectsManager,
  onOpenPosteRolloverModal,
  onSelectPeriodMonth,
  onUpdateIncome,
  onDeletePeriodArchive,
}) => {
  const currency = budgetData.currency || 'TND';
  const metrics = calculateFinancialMetrics(budgetData);
  const unifiedProjects = getUnifiedProjectList(budgetData);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState(budgetData.income.toString());

  const selectedPeriod = budgetData.selectedPeriodMonth || '2026-08';

  // Format month string e.g. "2026-08" -> "Août 2026"
  const formatPeriodLabel = (p: string) => {
    if (!p) return 'Mois en Cours';
    const [year, month] = p.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const currentLabel = formatPeriodLabel(selectedPeriod);

  return (
    <div className="bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 text-slate-800 rounded-[32px] p-5 sm:p-6 border border-emerald-200/80 shadow-xs space-y-4 mb-5">
      {/* Top Bar: Date Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/90 pb-4">
        
        {/* Date Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200/90 text-xs font-bold text-slate-800 transition-all shadow-2xs"
            title="Changer de projet ou voir tous les mois"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="capitalize">{currentLabel} ({selectedPeriod})</span>
            <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Projet Actif
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-40 p-2 space-y-1">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Tous Mes Projets ({unifiedProjects.length})
                </span>
                {onOpenProjectsManager && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProjectsManager();
                    }}
                    className="text-[10px] text-emerald-700 hover:underline font-bold"
                  >
                    Voir tout ↗
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
                {unifiedProjects.map((proj) => {
                  const isCurrent = proj.isActive;

                  return (
                    <div
                      key={proj.periodMonth}
                      className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-emerald-50/90 border border-emerald-200 text-emerald-950 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => {
                          if (!isCurrent && onSelectPeriodMonth) {
                            onSelectPeriodMonth(proj.periodMonth);
                          }
                          setIsDropdownOpen(false);
                        }}
                        className="flex-1 text-left flex flex-col pr-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize font-bold text-xs">{proj.label} ({proj.periodMonth})</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded-full font-black">
                              ACTIF
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Budget: {proj.allocatedBudget} {currency} | Reste: {proj.remainingBalance} {currency}
                        </span>
                      </button>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            onOpenNewPeriodModal();
                          }}
                          className="p-1 hover:bg-emerald-100/70 rounded text-slate-400 hover:text-emerald-700"
                          title="Dupliquer / Créer basé sur ce projet"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {!isCurrent && proj.archiveId && onDeletePeriodArchive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePeriodArchive(proj.archiveId!);
                            }}
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                            title="Supprimer ce projet archivé"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1.5 border-t border-slate-100 space-y-1">
                {onOpenProjectsManager && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProjectsManager();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <FolderKanban className="w-4 h-4 text-emerald-600" />
                    <span>📂 Gérer Tous les Projets ({unifiedProjects.length})</span>
                  </button>
                )}

                {onOpenPosteRolloverModal && unifiedProjects.length > 1 && (
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenPosteRolloverModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-teal-800 hover:bg-teal-50/70 flex items-center space-x-2"
                  >
                    <Layers className="w-4 h-4 text-teal-600" />
                    <span>🔄 Reporter le Reste d'un Ancien Poste</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenNewPeriodModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50/80 flex items-center space-x-2"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                  <span>➕ Nouveau Projet Mensuel</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons: Mes Projets, Reporter Poste & Nouveau Projet */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenProjectsManager && (
            <button
              onClick={onOpenProjectsManager}
              className="px-3.5 py-2 bg-white hover:bg-emerald-50/70 text-emerald-800 border border-emerald-200/90 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95 shadow-2xs"
              title="Consulter et gérer tous mes projets"
            >
              <FolderKanban className="w-4 h-4 text-emerald-600" />
              <span>Mes Projets ({unifiedProjects.length})</span>
            </button>
          )}

          {onOpenPosteRolloverModal && unifiedProjects.length > 1 && (
            <button
              onClick={onOpenPosteRolloverModal}
              className="px-3.5 py-2 bg-teal-50/70 hover:bg-teal-100/80 text-teal-800 border border-teal-200/90 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
              title="Reporter le solde non dépensé d'un poste d'un ancien projet"
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline">Reporter Reste Ancien Poste</span>
              <span className="sm:hidden">Report Poste</span>
            </button>
          )}

          <button
            onClick={onOpenNewPeriodModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nouveau Projet</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Card Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Budget Alloué */}
        <div className="p-4 rounded-2xl bg-white/95 border border-slate-200/80 shadow-2xs space-y-1 relative group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Budget Alloué ({currentLabel})</span>
            <div className="flex items-center space-x-1">
              {onUpdateIncome && (
                <button
                  onClick={() => {
                    if (isEditingIncome) {
                      const val = parseFloat(tempIncome);
                      if (!isNaN(val) && val >= 0) {
                        onUpdateIncome(val);
                      }
                      setIsEditingIncome(false);
                    } else {
                      setTempIncome(budgetData.income.toString());
                      setIsEditingIncome(true);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                  title={isEditingIncome ? "Valider la modification" : "Modifier le budget global"}
                >
                  {isEditingIncome ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
              )}
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          
          {isEditingIncome ? (
            <div className="flex items-center space-x-1 pt-1">
              <input
                type="number"
                value={tempIncome}
                onChange={(e) => setTempIncome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseFloat(tempIncome);
                    if (!isNaN(val) && val >= 0 && onUpdateIncome) {
                      onUpdateIncome(val);
                    }
                    setIsEditingIncome(false);
                  }
                }}
                className="w-full bg-slate-50 border border-emerald-400 text-slate-900 font-mono font-black text-lg px-2 py-1 rounded-xl focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  const val = parseFloat(tempIncome);
                  if (!isNaN(val) && val >= 0 && onUpdateIncome) {
                    onUpdateIncome(val);
                  }
                  setIsEditingIncome(false);
                }}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                OK
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (onUpdateIncome) {
                  setTempIncome(budgetData.income.toString());
                  setIsEditingIncome(true);
                }
              }}
              className="text-xl font-black text-slate-900 font-mono cursor-pointer hover:text-emerald-700 transition-colors flex items-center gap-1.5"
              title="Cliquer pour modifier le budget"
            >
              <span>{budgetData.income.toLocaleString()}</span>
              <span className="text-xs text-emerald-600">{currency}</span>
              <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
            </div>
          )}

          <p className="text-[10px] text-slate-500">
            Stratégie: <strong className="text-slate-700 capitalize">{budgetData.strategy}</strong>
          </p>
        </div>

        {/* Card 2: Consommé Actuel */}
        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/70 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Consommé</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            {metrics.spent.overallTotal.toLocaleString()} <span className="text-xs">{currency}</span>
          </div>
          <div className="w-full bg-amber-100/80 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (metrics.spent.overallTotal / (budgetData.income || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Solde Restant & Budget Journalier Conseillé */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-bold uppercase tracking-wider">Solde Restant Dispo</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {metrics.remaining.income.toLocaleString()} <span className="text-xs">{currency}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-emerald-800/80 pt-0.5">
            <span className="font-medium">{metrics.remaining.income >= 0 ? 'Budget maîtrisé' : 'Dépassement'}</span>
            {metrics.remaining.income > 0 && (
              <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200/90 shadow-2xs">
                ~{Math.round(metrics.remaining.income / Math.max(1, metrics.timing.daysRemaining))} {currency}/j
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
