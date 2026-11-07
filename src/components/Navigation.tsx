import React from 'react';
import { Target, ReceiptText, BarChart3, Bot, Calculator, FolderClock, Coins } from 'lucide-react';

export type TabType = 'plan' | 'track' | 'analytics' | 'goals' | 'activities' | 'advisor' | 'audit';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  auditHealthScore?: number;
}

interface NavTabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  score?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  auditHealthScore,
}) => {
  const tabs: NavTabItem[] = [
    { id: 'plan', label: 'Cibles', icon: Target },
    { id: 'track', label: 'Dépenses', icon: ReceiptText },
    { id: 'goals', label: 'Objectifs', icon: Coins },
    { id: 'analytics', label: 'Graphiques', icon: BarChart3 },
    { id: 'activities', label: 'Historique', icon: FolderClock },
    { id: 'advisor', label: 'Conseiller', icon: Bot, badge: 'AI' },
    {
      id: 'audit',
      label: 'Audit AI',
      icon: Calculator,
      score: auditHealthScore,
    },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 text-slate-500 py-1.5 px-2 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
      <div className="max-w-3xl mx-auto flex items-center justify-between sm:justify-around overflow-x-auto space-x-1.5 px-1 py-0.5 scrollbar-none scroll-smooth">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all shrink-0 relative min-w-[62px] ${
                isActive
                  ? 'text-emerald-700 font-extrabold bg-emerald-50/90 shadow-xs border border-emerald-200/80'
                  : 'hover:text-slate-900 hover:bg-slate-100/70 font-semibold text-slate-600'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-3 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full shadow-xs">
                    {tab.badge}
                  </span>
                )}
                {tab.score !== undefined && (
                  <span
                    className={`absolute -top-1 -right-3 text-[8px] font-black px-1 rounded-full border shadow-xs ${
                      tab.score >= 80
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : tab.score >= 50
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {tab.score}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
