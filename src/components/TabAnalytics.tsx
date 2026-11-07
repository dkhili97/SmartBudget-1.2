import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Flame,
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  Award,
  Activity,
} from 'lucide-react';
import { BudgetState } from '../types';
import { calculateFinancialMetrics } from '../lib/financialMath';

interface TabAnalyticsProps {
  budgetData: BudgetState;
}

export const TabAnalytics: React.FC<TabAnalyticsProps> = ({ budgetData }) => {
  const metrics = calculateFinancialMetrics(budgetData);

  // Bar Chart Data: Planned vs Actual per category
  const barData = [
    {
      name: 'Besoins',
      Cible: Math.round(metrics.targets.needs),
      Planifié: Math.round(metrics.allocated.needs),
      Réel: Math.round(metrics.spent.needs),
    },
    {
      name: 'Plaisirs',
      Cible: Math.round(metrics.targets.wants),
      Planifié: Math.round(metrics.allocated.wants),
      Réel: Math.round(metrics.spent.wants),
    },
    {
      name: 'Épargne',
      Cible: Math.round(metrics.targets.savings),
      Planifié: Math.round(metrics.allocated.savings),
      Réel: Math.round(metrics.spent.savings),
    },
  ];

  // Pie Chart Data: Detailed item-level actual expenses
  const itemPieData: { name: string; value: number; color: string }[] = [];
  const categoryColors = {
    needs: '#f43f5e', // rose-500
    wants: '#f59e0b', // amber-500
    savings: '#10b981', // emerald-500
  };

  budgetData.items.forEach((item) => {
    if (item.excludeFromAnalytics) return;
    const spent = budgetData.transactions
      .filter((t) => t.itemId === item.id && t.type !== 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    if (spent > 0) {
      itemPieData.push({
        name: item.name,
        value: Math.round(spent),
        color: categoryColors[item.category],
      });
    }
  });

  // Daily spending trend (grouped by date)
  const dailyMap = new Map<string, number>();
  (budgetData.transactions || [])
    .filter((t) => t.type !== 'income')
    .forEach((tx) => {
      const key = tx.date || '2026-08-01';
      dailyMap.set(key, (dailyMap.get(key) || 0) + tx.amount);
    });

  const dailyTrendData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([dateStr, total]) => ({
      jour: dateStr.substring(5),
      Montant: Math.round(total * 10) / 10,
    }));

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Top Velocity & Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" /> Burn Rate/Jour
          </span>
          <span className="text-base font-mono font-bold text-amber-600 mt-1 block">
            {metrics.burnRateDaily.toFixed(1)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">
            Jours écoulés: {metrics.timing.currentDay}j
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-teal-600" /> Projection Fin Mois
          </span>
          <span className="text-base font-mono font-bold text-teal-700 mt-1 block">
            {metrics.projectedEndMonthExpense.toFixed(0)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Dépenses prévues</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Épargne Estimée
          </span>
          <span className="text-base font-mono font-bold text-emerald-600 mt-1 block">
            {metrics.projectedSavings.toFixed(0)} {budgetData.currency}
          </span>
          <span className="text-[9px] text-slate-400 font-medium">En fin de mois</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-[24px] shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-600" /> Score Santé
          </span>
          <span className="text-base font-mono font-bold text-slate-900 mt-1 block">
            {metrics.healthScore} / 100
          </span>
          <span className="text-[9px] text-emerald-600 font-bold uppercase">
            {metrics.healthStatus}
          </span>
        </div>
      </div>

      {/* Bar Chart: Budget Prévu vs Réalité */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Comparatif : Cible vs Planifié vs Réel</span>
          </h3>
          <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            En {budgetData.currency}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#1e293b',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="Cible" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Planifié" fill="#0d9488" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Réel" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center space-x-4 text-[11px] text-slate-500 font-semibold pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>Cible Conseillée</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>Planifié</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Dépensé Réel</span>
          </div>
        </div>
      </div>

      {/* Daily Trend Chart */}
      {dailyTrendData.length > 1 && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Rythme Quotidien des Dépenses</span>
            </h3>
            <span className="text-[10px] text-teal-800 font-bold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {dailyTrendData.length} derniers jours actifs
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="jour" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Montant"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#emeraldFlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Doughnut Chart: Detailed Subcategory Breakdown */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-[32px] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
          <PieIcon className="w-4 h-4 text-amber-500" />
          <span>Répartition Réelle par Poste de Dépense</span>
        </h3>

        {itemPieData.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            Aucune dépense enregistrée pour afficher le graphique.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={itemPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {itemPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', color: '#475569' }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
