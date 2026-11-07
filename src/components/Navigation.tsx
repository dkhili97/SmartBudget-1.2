import React from 'react';
import { Target, ReceiptText, BarChart3, Bot, Coins } from 'lucide-react';

export type TabType = 'plan' | 'track' | 'goals' | 'analytics' | 'advisor' | 'activities' | 'audit';

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
  // Clean, focused 5-tab mobile navigation (no overflow, perfectly balanced)
  const tabs: NavTabItem[] = [
    { id: 'plan', label: 'Budget', icon: Target },
    { id: 'track', label: 'Dépenses', icon: ReceiptText },
    { id: 'goals', label: 'Objectifs', icon: Coins },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    {
      id: 'advisor',
      label: 'Conseiller',
      icon: Bot,
      score: auditHealthScore,
      badge: 'IA',
    },
  ];

  // Map 'audit' to 'advisor' if activeTab was 'audit'
  const currentTab = activeTab === 'audit' ? 'advisor' : activeTab;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 text-slate-500 py-1.5 px-3 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative flex-1 ${
                isActive
                  ? 'text-emerald-700 font-extrabold bg-emerald-50/90 shadow-2xs border border-emerald-200/80 scale-102'
                  : 'hover:text-slate-900 hover:bg-slate-50 font-semibold text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
                {tab.score !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 text-[8px] font-black px-1.5 py-0.2 rounded-full border shadow-2xs ${
                      tab.score >= 80
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : tab.score >= 50
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {tab.score}
                  </span>
                )}
                {!tab.score && tab.badge && (
                  <span className="absolute -top-1 -right-2.5 bg-emerald-600 text-white text-[7px] font-black px-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
