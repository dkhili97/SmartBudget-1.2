import { BudgetState, CategoryType, StrategyType } from '../types';

export interface StrategyRatios {
  needs: number; // e.g. 0.50
  wants: number; // e.g. 0.30
  savings: number; // e.g. 0.20
}

export function getStrategyRatios(strategy: StrategyType, customRatios?: { needs: number; wants: number; savings: number }): StrategyRatios {
  switch (strategy) {
    case 'aggressive':
      return { needs: 0.30, wants: 0.20, savings: 0.50 };
    case 'light':
      return { needs: 0.50, wants: 0.45, savings: 0.05 };
    case 'custom':
      if (customRatios) {
        return {
          needs: (customRatios.needs || 0) / 100,
          wants: (customRatios.wants || 0) / 100,
          savings: (customRatios.savings || 0) / 100,
        };
      }
      return { needs: 0.50, wants: 0.30, savings: 0.20 };
    case 'balanced':
    default:
      return { needs: 0.50, wants: 0.30, savings: 0.20 };
  }
}

export function calculateFinancialMetrics(state: BudgetState) {
  const ratios = getStrategyRatios(state.strategy, state.customRatios);
  const income = state.income || 0;

  // Recommended target amounts
  const targetNeeds = income * ratios.needs;
  const targetWants = income * ratios.wants;
  const targetSavings = income * ratios.savings;

  // Allocated budgets in planned items (Base budget + Reste reporté de l'ancien budget)
  const allocatedNeeds = state.items
    .filter((i) => i.category === 'needs')
    .reduce((acc, i) => acc + (i.budget || 0) + (i.carriedOverBudget || 0), 0);
  const allocatedWants = state.items
    .filter((i) => i.category === 'wants')
    .reduce((acc, i) => acc + (i.budget || 0) + (i.carriedOverBudget || 0), 0);
  const allocatedSavings = state.items
    .filter((i) => i.category === 'savings')
    .reduce((acc, i) => acc + (i.budget || 0) + (i.carriedOverBudget || 0), 0);

  const totalAllocated = allocatedNeeds + allocatedWants + allocatedSavings;

  // Spent amounts from transactions (ONLY actual expenses: t.type !== 'income')
  // Unexpected income/bonus revenue increases available budget, and does NOT make consumed expenses negative!
  const spentNeeds = state.transactions
    .filter((t) => t.category === 'needs' && t.type !== 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const spentWants = state.transactions
    .filter((t) => t.category === 'wants' && t.type !== 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);
  const spentSavings = state.transactions
    .filter((t) => t.category === 'savings' && t.type !== 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalExtraIncome = state.transactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  const totalSpentExpenses = spentNeeds + spentWants; // Needs + Wants are actual expenses
  const totalSpentOverall = spentNeeds + spentWants + spentSavings;

  const remainingAllocated = totalAllocated - totalSpentOverall;
  const remainingIncome = income - totalSpentExpenses;

  // Time metrics
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  // Daily burn rate (expense spent per day elapsed)
  const burnRateDaily = currentDay > 0 ? totalSpentExpenses / currentDay : 0;
  const projectedEndMonthExpense = burnRateDaily * daysInMonth;
  const projectedSavings = Math.max(0, income - projectedEndMonthExpense);

  // Health Score Calculation
  let healthScore = 100;

  // Penalty if expenses exceed allocated or target
  if (spentNeeds > targetNeeds) {
    const diffPct = ((spentNeeds - targetNeeds) / (targetNeeds || 1)) * 100;
    healthScore -= Math.min(30, diffPct * 0.5);
  }
  if (spentWants > targetWants) {
    const diffPct = ((spentWants - targetWants) / (targetWants || 1)) * 100;
    healthScore -= Math.min(30, diffPct * 0.6);
  }
  if (totalSpentExpenses > income) {
    healthScore -= 40;
  }
  if (spentSavings < targetSavings * 0.5) {
    healthScore -= 15;
  }

  healthScore = Math.max(10, Math.min(100, Math.round(healthScore)));

  let healthStatus: 'EXCELLENT' | 'BON' | 'ATTENTION' | 'CRITIQUE' = 'EXCELLENT';
  if (healthScore >= 85) healthStatus = 'EXCELLENT';
  else if (healthScore >= 70) healthStatus = 'BON';
  else if (healthScore >= 50) healthStatus = 'ATTENTION';
  else healthStatus = 'CRITIQUE';

  return {
    ratios,
    income,
    targets: {
      needs: targetNeeds,
      wants: targetWants,
      savings: targetSavings,
    },
    allocated: {
      needs: allocatedNeeds,
      wants: allocatedWants,
      savings: allocatedSavings,
      total: totalAllocated,
    },
    spent: {
      needs: spentNeeds,
      wants: spentWants,
      savings: spentSavings,
      expensesTotal: totalSpentExpenses,
      overallTotal: totalSpentOverall,
    },
    remaining: {
      allocated: remainingAllocated,
      income: remainingIncome,
    },
    timing: {
      currentDay,
      daysInMonth,
      daysRemaining,
    },
    burnRateDaily,
    projectedEndMonthExpense,
    projectedSavings,
    healthScore,
    healthStatus,
  };
}

export function getItemSpent(itemId: string, transactions: BudgetState['transactions']): number {
  return (transactions || [])
    .filter((t) => t.itemId === itemId && t.type !== 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
}
