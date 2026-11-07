import { BudgetState } from '../types';

export const INITIAL_BUDGET_STATE: BudgetState = {
  income: 1800,
  currency: 'TND',
  strategy: 'balanced',
  customRatios: { needs: 50, wants: 30, savings: 20 },
  items: [
    // Needs (Charges Fixes / Besoins - 50%)
    { id: 'item-loyer', name: 'Loyer & Logement', budget: 500, category: 'needs' },
    { id: 'item-factures', name: 'STEG / Sonede / Telecom', budget: 150, category: 'needs' },
    { id: 'item-courses', name: 'Alimentation & Courses', budget: 250, category: 'needs' },
    
    // Wants (Plaisirs / Envies - 30%)
    { id: 'item-cafe', name: 'Café & Restaurants', budget: 180, category: 'wants' },
    { id: 'item-loisirs', name: 'Loisirs & Abonnements', budget: 150, category: 'wants' },
    { id: 'item-shopping', name: 'Shopping & Achats', budget: 210, category: 'wants' },

    // Savings (Épargne / Investissements - 20%)
    { id: 'item-epargne-sec', name: 'Fonds d\'Urgence', budget: 200, category: 'savings' },
    { id: 'item-projets', name: 'Projets & Investissement', budget: 160, category: 'savings' },
  ],
  transactions: [
    {
      id: 'tx-1',
      desc: 'Loyer du mois',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      amount: 500,
      category: 'needs',
      itemId: 'item-loyer',
      notes: 'Payé par virement'
    },
    {
      id: 'tx-2',
      desc: 'Facture Électricité',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      time: '14:30',
      amount: 85,
      category: 'needs',
      itemId: 'item-factures',
      notes: 'Facture bimestrielle'
    },
    {
      id: 'tx-3',
      desc: 'Courses Supermarché',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      time: '18:15',
      amount: 110,
      category: 'needs',
      itemId: 'item-courses'
    },
    {
      id: 'tx-4',
      desc: 'Café entre amis',
      date: new Date().toISOString().split('T')[0],
      time: '12:45',
      amount: 25,
      category: 'wants',
      itemId: 'item-cafe'
    },
    {
      id: 'tx-5',
      desc: 'Dépôt Fonds de Secours',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      time: '10:00',
      amount: 200,
      category: 'savings',
      itemId: 'item-epargne-sec'
    }
  ],
  expensePresets: [
    { id: 'preset-cafe', title: 'Café & Expresso', amount: 2.0, category: 'wants', itemId: 'item-cafe', icon: '☕' },
    { id: 'preset-pain', title: 'Pain & Petit Déj', amount: 3.0, category: 'needs', itemId: 'item-courses', icon: '🥖' },
    { id: 'preset-transport', title: 'Transport / Taxi', amount: 5.0, category: 'needs', itemId: 'item-factures', icon: '🚕' },
    { id: 'preset-eau', title: 'Bouteille d\'eau', amount: 1.0, category: 'needs', itemId: 'item-courses', icon: '💧' },
  ],
  goals: [
    {
      id: 'goal-1',
      title: 'Fonds d\'Urgence Sécurité (3 Mois)',
      category: 'emergency',
      targetAmount: 3000,
      currentAmount: 1200,
      monthlyContribution: 200,
      targetDate: '2026-12-31',
      priority: 'high',
      status: 'in_progress',
      notes: 'Matelas de sécurité financier en cas d\'imprévu',
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'goal-2',
      title: 'Apport Personnel Immobilier',
      category: 'housing',
      targetAmount: 10000,
      currentAmount: 2500,
      monthlyContribution: 100,
      targetDate: '2027-06-30',
      priority: 'medium',
      status: 'in_progress',
      notes: 'Épargne à long terme pour crédit immobilier',
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'goal-3',
      title: 'Projet Voyage & Vacances d\'Été',
      category: 'travel',
      targetAmount: 1500,
      currentAmount: 600,
      monthlyContribution: 60,
      targetDate: '2026-08-31',
      priority: 'low',
      status: 'in_progress',
      notes: 'Budget détente et découvertes',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  wallets: [
    { id: 'wallet-1', name: 'Compte Courant (Bancaire)', type: 'checking', balance: 2450, icon: '💳' },
    { id: 'wallet-2', name: 'Compte Épargne & Projets', type: 'savings', balance: 1200, icon: '🏦' },
    { id: 'wallet-3', name: 'Portefeuille Espèces / Cash', type: 'cash', balance: 350, icon: '💵' },
    { id: 'wallet-4', name: 'Réserve d\'Urgence (Secours)', type: 'emergency', balance: 1000, icon: '🛡️' }
  ],
  transfers: [
    {
      id: 'tr-init-1',
      fromWalletId: 'wallet-1',
      fromWalletName: 'Compte Courant (Bancaire)',
      toWalletId: 'wallet-2',
      toWalletName: 'Compte Épargne & Projets',
      amount: 200,
      note: 'Virement mensuel d\'épargne programmé',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],
  selectedPeriodMonth: '2026-08',
  monthlyReports: [
    {
      id: 'rep-2026-07',
      periodMonth: '2026-07',
      recordDate: '01/07/2026',
      allocatedBudget: 1800,
      strategy: 'balanced',
      customRatios: { needs: 50, wants: 30, savings: 20 },
      currency: 'TND',
      totalNeedsSpent: 820,
      totalWantsSpent: 410,
      totalSavingsAllocated: 360,
      totalSpent: 1590,
      remainingBalance: 210,
      itemsSnapshot: [
        { id: 'item-loyer', name: 'Loyer & Charges', budget: 500, category: 'needs' },
        { id: 'item-courses', name: 'Alimentation & Courses', budget: 400, category: 'needs' },
        { id: 'item-resto', name: 'Restaurants & Sorties', budget: 300, category: 'wants' },
        { id: 'item-epargne', name: 'Épargne de Sécurité', budget: 360, category: 'savings' }
      ],
      notes: 'Bilan de Juillet 2026 : Épargne respectée à 100%, surplus de 210 TND basculé sur le compte courant.'
    },
    {
      id: 'rep-2026-08',
      periodMonth: '2026-08',
      recordDate: '01/08/2026',
      allocatedBudget: 1800,
      strategy: 'balanced',
      customRatios: { needs: 50, wants: 30, savings: 20 },
      currency: 'TND',
      totalNeedsSpent: 420,
      totalWantsSpent: 210,
      totalSavingsAllocated: 360,
      totalSpent: 990,
      remainingBalance: 810,
      itemsSnapshot: [
        { id: 'item-loyer', name: 'Loyer & Logement', budget: 500, category: 'needs' },
        { id: 'item-courses', name: 'Alimentation & Supermarché', budget: 400, category: 'needs' },
        { id: 'item-transport', name: 'Carburant & Transport', budget: 150, category: 'needs' },
        { id: 'item-sorties', name: 'Café, Loisirs & Sorties', budget: 300, category: 'wants' },
        { id: 'item-shopping', name: 'Shopping & Envie', budget: 240, category: 'wants' },
        { id: 'item-projets', name: 'Fonds de Secours & Épargne', budget: 360, category: 'savings' }
      ],
      notes: 'Budget du mois en cours (Août 2026). Statut optimal avec 810 TND disponibles.'
    }
  ],
  lastUpdated: new Date().toISOString(),
  reminderConfig: {
    enabled: true,
    inactivityThresholdHours: 18,
    dailyCheckinTime: '20:00',
    lastAppOpen: new Date().toISOString(),
    lastExpenseLogged: new Date(Date.now() - 86400000 * 1).toISOString(),
    consecutiveStreakDays: 3,
  },
  userAccount: {
    email: 'karim.dkhili@gmail.com',
    name: 'Karim Dkhili',
    isLoggedIn: true,
    syncMode: 'cloud',
    lastSyncedAt: new Date().toISOString(),
  },
  strategyLogs: [
    {
      id: 'strat-log-1',
      timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
      type: 'income',
      title: 'Mise à jour du revenu mensuel',
      details: 'Revenu défini à 1800 TND / mois',
      oldVal: '1500 TND',
      newVal: '1800 TND',
    },
    {
      id: 'strat-log-2',
      timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
      type: 'strategy',
      title: 'Adoption de la stratégie Équilibrée',
      details: 'Ratios configurés à 50% Besoins (900 TND), 30% Envies (540 TND), 20% Épargne (360 TND)',
      oldVal: 'Custom (60/20/20)',
      newVal: 'Équilibré (50/30/20)',
    },
    {
      id: 'strat-log-3',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      type: 'item',
      title: 'Ajustement du poste "Loyer & Logement"',
      details: 'Enveloppe fixée à 500 TND pour couvrir le loyer mensuel',
      oldVal: '450 TND',
      newVal: '500 TND',
    }
  ],
  advisorLogs: [
    {
      id: 'adv-log-1',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      userPrompt: 'Comment mieux répartir mon épargne ce mois-ci ?',
      aiResponse: 'Je vous recommande de verser 200 TND dans votre Fonds d\'Urgence et 160 TND dans vos Projets d\'Investissement. Vos charges fixes restent à 50% de vos revenus.',
      proposalsCount: 1,
    },
    {
      id: 'adv-log-2',
      timestamp: new Date().toISOString(),
      userPrompt: 'Puis-je effectuer une dépense supplémentaire en loisirs ?',
      aiResponse: 'Vos dépenses Envies/Plaisirs s\'élèvent actuellement à 25 TND sur une limite de 540 TND. Il vous reste une marge confortable de 515 TND.',
      proposalsCount: 0,
    }
  ],
  auditLogs: [
    {
      id: 'audit-log-1',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      health: 'EXCELLENT',
      score: 88,
      burnRateDaily: 32.5,
      summary: 'Excellente tenue de compte. Vos charges fixes sont maîtrisées et le rythme d\'épargne est respecté.',
      findingsCount: 3,
    },
    {
      id: 'audit-log-2',
      timestamp: new Date().toISOString(),
      health: 'EXCELLENT',
      score: 92,
      burnRateDaily: 28.3,
      summary: 'Bilan très sain. Aucun dépassement de catégorie détecté. Projection de fin de mois positive.',
      findingsCount: 3,
    }
  ],
};

