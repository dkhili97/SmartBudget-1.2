import React, { useState } from 'react';
import { Bell, Flame, PlusCircle, CheckCircle2, Settings, X, Sparkles } from 'lucide-react';
import { BudgetState, SmartReminderConfig } from '../types';

interface SmartReminderBannerProps {
  budgetData: BudgetState;
  onOpenQuickAdd: () => void;
  onMarkNoExpenseToday: () => void;
  onUpdateConfig?: (newConfig: Partial<SmartReminderConfig>) => void;
}

export const SmartReminderBanner: React.FC<SmartReminderBannerProps> = ({
  budgetData,
  onOpenQuickAdd,
  onMarkNoExpenseToday,
  onUpdateConfig,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const config: SmartReminderConfig = budgetData.reminderConfig || {
    enabled: true,
    inactivityThresholdHours: 18,
    dailyCheckinTime: '20:00',
    lastAppOpen: new Date().toISOString(),
    lastExpenseLogged: new Date(Date.now() - 86400000 * 1).toISOString(),
    consecutiveStreakDays: 3,
  };

  if (!config.enabled || isDismissed) return null;

  const lastExpenseIso = config.lastExpenseLogged || config.lastExpenseLoggedDate;
  const lastExpenseTime = lastExpenseIso
    ? new Date(lastExpenseIso).getTime()
    : Date.now() - 86400000 * 2;
  const hoursSinceExpense = Math.max(0, Math.floor((Date.now() - lastExpenseTime) / (1000 * 60 * 60)));

  const todayStr = new Date().toISOString().split('T')[0];
  const loggedNoExpenseToday =
    config.lastNoExpenseLoggedDate === todayStr || config.lastExpenseLoggedDate === todayStr;

  const isTriggered = hoursSinceExpense >= config.inactivityThresholdHours && !loggedNoExpenseToday;

  return (
    <div className="w-full bg-white text-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs animate-fadeIn relative z-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Info & Streak */}
        <div className="flex items-start space-x-3 w-full sm:w-auto">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60 shrink-0">
            <Bell className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Suivi Quotidien</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                  {config.consecutiveStreakDays || 1}j de série
                </span>
              </h4>
            </div>

            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              {isTriggered ? (
                <>
                  Dernière opération il y a{' '}
                  <span className="font-semibold text-emerald-800 underline">
                    {hoursSinceExpense}h
                  </span>
                  . Une dépense à noter aujourd'hui ?
                </>
              ) : loggedNoExpenseToday ? (
                <>Journée pointée et suivi budgétaire à jour.</>
              ) : (
                <>Suivi actif. Consignez vos dépenses du jour en un clic.</>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
          {!loggedNoExpenseToday && (
            <>
              <button
                onClick={onOpenQuickAdd}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span>+ Dépense</span>
              </button>

              <button
                onClick={onMarkNoExpenseToday}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold border border-slate-200 flex items-center space-x-1 transition-all"
                title="Aujourd'hui, je n'ai rien dépensé"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">0 Dépense</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Paramètres du rappel"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reminder Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 text-slate-800">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4 border border-emerald-100 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Paramètres du Rappel Quotidien
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Activer le rappel quotidien</span>
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => onUpdateConfig?.({ enabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Détecter l'inactivité après :
                </label>
                <select
                  value={config.inactivityThresholdHours}
                  onChange={(e) =>
                    onUpdateConfig?.({ inactivityThresholdHours: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value={8}>8 heures d'inactivité</option>
                  <option value={12}>12 heures d'inactivité</option>
                  <option value={18}>18 heures (Quotidien)</option>
                  <option value={24}>24 heures (Une fois par jour)</option>
                  <option value={48}>48 heures (Tous les 2 jours)</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-[11px] text-emerald-800">
                Mode Proactif : l'application suit votre série de jours consécutifs et vous rappelle de pointer vos dépenses ou vos journées à 0 dépense.
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Enregistrer les préférences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
