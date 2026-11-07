import React, { useState } from 'react';
import {
  FolderKanban,
  FolderPlus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Trash2,
  Copy,
  Layers,
  X,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { BudgetState } from '../types';
import { getUnifiedProjectList, UnifiedProject } from '../lib/storage';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetData: BudgetState;
  onSwitchToPeriod: (periodMonth: string) => void;
  onOpenNewPeriodModal: () => void;
  onOpenPosteRolloverModal?: () => void;
  onDeletePeriodArchive?: (archiveId: string) => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  onClose,
  budgetData,
  onSwitchToPeriod,
  onOpenNewPeriodModal,
  onOpenPosteRolloverModal,
  onDeletePeriodArchive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const currency = budgetData.currency || 'TND';

  if (!isOpen) return null;

  const allProjects: UnifiedProject[] = getUnifiedProjectList(budgetData);
  const activeProject = allProjects.find((p) => p.isActive) || allProjects[0];

  const filteredProjects = allProjects.filter(
    (p) =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.periodMonth.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-800 w-full max-w-2xl rounded-[32px] shadow-2xl p-5 sm:p-6 overflow-hidden flex flex-col my-4 space-y-4 max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Mes Projets & Budgets Mensuels
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                  {allProjects.length} {allProjects.length > 1 ? 'Projets' : 'Projet'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Consultez, réactivez ou créez vos différents mois de budget en toute sécurité
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Top Bar: Search & New Project Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher un mois (ex: Septembre, 2026-09)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenPosteRolloverModal && allProjects.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPosteRolloverModal();
                }}
                className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 flex items-center space-x-1.5 transition-all active:scale-95"
                title="Reporter le reste d'un ancien projet vers le projet actuel"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Reporter Reste</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNewPeriodModal();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all active:scale-95 shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>➕ Nouveau Projet</span>
            </button>
          </div>
        </div>

        {/* Scrollable Project List */}
        <div className="overflow-y-auto space-y-3.5 flex-1 pr-1">
          
          {/* Active Project Highlight Banner */}
          {activeProject && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white text-slate-800 border border-emerald-200/90 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                    Projet Actuel en Cours d'Utilisation
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-emerald-800">
                    {activeProject.periodMonth}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {activeProject.itemsCount} postes | {activeProject.transactionsCount} opérations
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black capitalize text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{activeProject.label}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toutes vos nouvelles dépenses et modifications sont enregistrées sur ce projet.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Budget</span>
                    <span className="font-mono font-black text-slate-900">{activeProject.allocatedBudget} {currency}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Dépensé</span>
                    <span className="font-mono font-black text-amber-600">{activeProject.totalSpent} {currency}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/80 shadow-2xs">
                    <span className="text-[9px] text-emerald-700 uppercase font-bold block">Disponible</span>
                    <span className="font-mono font-black text-emerald-700">{activeProject.remainingBalance} {currency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Divider */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Tous les Projets ({filteredProjects.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Cliquez sur "Activer" pour basculer sur un projet
            </span>
          </div>

          {/* List of all projects */}
          {filteredProjects.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs text-slate-500 font-semibold">Aucun projet ne correspond à votre recherche.</p>
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isCurrent = proj.isActive;

              return (
                <div
                  key={proj.periodMonth}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                      : 'bg-white hover:bg-slate-50/90 border-slate-200/90'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900 capitalize flex items-center gap-1.5">
                        <Calendar className={`w-4 h-4 ${isCurrent ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{proj.label}</span>
                      </span>

                      <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {proj.periodMonth}
                      </span>

                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Actif</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                          Archivé
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span>
                        Budget : <strong className="font-mono text-slate-900">{proj.allocatedBudget} {currency}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Dépensé : <strong className="font-mono text-amber-600">{proj.totalSpent} {currency}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reste : <strong className={`font-mono ${proj.remainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{proj.remainingBalance} {currency}</strong>
                      </span>
                    </div>

                    {proj.notes && (
                      <p className="text-[10px] text-slate-400 italic">
                        {proj.notes}
                      </p>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => {
                          onSwitchToPeriod(proj.periodMonth);
                          onClose();
                        }}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs active:scale-95"
                        title="Bascule sur ce projet pour le modifier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Activer ce Projet</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-300">
                        En cours
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewPeriodModal();
                      }}
                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-600 border border-slate-200 rounded-xl transition-colors"
                      title="Dupliquer ce projet pour un nouveau mois"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {!isCurrent && proj.archiveId && onDeletePeriodArchive && (
                      <button
                        type="button"
                        onClick={() => onDeletePeriodArchive(proj.archiveId!)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Supprimer ce projet archivé"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tous vos projets sont protégés et synchronisés localement et sur le Cloud.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors self-end sm:self-auto"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
