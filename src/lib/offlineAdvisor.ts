import { AIAuditResult, BudgetState } from '../types';

/**
 * Moteur de conseil financier 100% Hors-Ligne (Offline Rule-Based Financial Advisor).
 * Analyse les données budgétaires réelles en local sans aucune dépendance réseau ni clé API.
 */
export function generateAdvisorOfflineReply(userMessage: string, budgetData: BudgetState): string {
  const currency = budgetData?.currency || 'TND';
  const income = Number(budgetData?.income || 0);
  const transactions = Array.isArray(budgetData?.transactions) ? budgetData.transactions : [];

  const totalSpent = transactions.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const remaining = income - totalSpent;

  const needsSpent = transactions
    .filter((t: any) => t.category === 'needs')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const wantsSpent = transactions
    .filter((t: any) => t.category === 'wants')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const savingsSpent = transactions
    .filter((t: any) => t.category === 'savings')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  const needsTarget = income * ((budgetData?.customRatios?.needs || 50) / 100);
  const wantsTarget = income * ((budgetData?.customRatios?.wants || 30) / 100);
  const savingsTarget = income * ((budgetData?.customRatios?.savings || 20) / 100);

  const lowerMsg = userMessage.toLowerCase();

  const priceMatch = userMessage.match(/\b(\d+(?:[.,]\d+)?)\s*(?:TND|€|\$|DT|dinars)?\b/i);
  const askedAmount = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

  if (
    askedAmount &&
    (lowerMsg.includes('acheter') ||
      lowerMsg.includes('permettre') ||
      lowerMsg.includes('prix') ||
      lowerMsg.includes('cout') ||
      lowerMsg.includes('coût'))
  ) {
    const remainingWants = wantsTarget - wantsSpent;
    if (askedAmount <= remaining) {
      if (askedAmount <= remainingWants) {
        return `✅ **Avis Favorable :** Oui, vous pouvez vous permettre cet achat de **${askedAmount} ${currency}** !

• **Budget Plaisirs Restant :** ${remainingWants.toFixed(2)} ${currency}
• **Impact :** Cet achat est 100% couvert par votre enveloppe "Plaisirs" sans toucher à vos charges fixes ni à votre épargne.
• **Solde Global Après Achat :** ${(remaining - askedAmount).toFixed(2)} ${currency}`;
      } else {
        return `⚠️ **Avis Sous Condition :** Vous avez le solde global disponible (${remaining.toFixed(2)} ${currency}), mais cet achat dépasserait votre budget "Plaisirs" mensuel de **${(askedAmount - remainingWants).toFixed(2)} ${currency}**.

• **Budget Plaisirs Cible :** ${wantsTarget.toFixed(2)} ${currency} (Dépensé: ${wantsSpent.toFixed(2)} ${currency})
• **Conseil :** Si cet achat n'est pas urgent, prélevez la différence sur une autre ligne non prioritaire ou étalez-le sur le mois prochain.`;
      }
    } else {
      return `❌ **Avis Défavorable :** Non, cet achat de **${askedAmount} ${currency}** dépasse votre solde restant actuel (**${remaining.toFixed(2)} ${currency}**).
• **Dépassement :** ${(askedAmount - remaining).toFixed(2)} ${currency}.
• **Recommandation :** Attendez d'alimenter votre budget du mois suivant.`;
    }
  }

  if (
    lowerMsg.includes('reste') ||
    lowerMsg.includes('solde') ||
    lowerMsg.includes('semaine') ||
    lowerMsg.includes('combien')
  ) {
    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today + 1;
    const dailyAllowance = remainingDays > 0 ? remaining / remainingDays : remaining;

    return `📊 **Bilan du Solde Restant :**

• **Revenu Net :** ${income} ${currency}
• **Total Dépensé :** ${totalSpent.toFixed(2)} ${currency}
• **Solde Restant Global :** **${remaining.toFixed(2)} ${currency}**
• **Budget Journalier Conseillé :** ~${dailyAllowance.toFixed(2)} ${currency} / jour pour les ${remainingDays} jours restants ce mois-ci.`;
  }

  if (lowerMsg.includes('plaisir') || lowerMsg.includes('envie') || lowerMsg.includes('wants')) {
    return `🎯 **Analyse de la catégorie Plaisirs & Envies :**

• **Budget Cible (${budgetData?.customRatios?.wants || 30}%) :** ${wantsTarget.toFixed(2)} ${currency}
• **Dépensé Actuellement :** ${wantsSpent.toFixed(2)} ${currency}
• **Restant Disponible :** ${(wantsTarget - wantsSpent).toFixed(2)} ${currency}
• **Statut :** ${wantsSpent <= wantsTarget ? '🟢 Sous contrôle' : '🔴 Dépassement de budget'}`;
  }

  return `🤖 **Analyse Financière Hors-Ligne (SmartBudget) :**

Pour votre budget global de **${income} ${currency}** :
• **Besoins Essentiels (${budgetData?.customRatios?.needs || 50}%) :** ${needsSpent.toFixed(2)} / ${needsTarget.toFixed(2)} ${currency}
• **Plaisirs & Envies (${budgetData?.customRatios?.wants || 30}%) :** ${wantsSpent.toFixed(2)} / ${wantsTarget.toFixed(2)} ${currency}
• **Épargne & Projets (${budgetData?.customRatios?.savings || 20}%) :** ${savingsSpent.toFixed(2)} / ${savingsTarget.toFixed(2)} ${currency}
• **Solde Disponible :** **${remaining.toFixed(2)} ${currency}**

Vous utilisez SmartBudget en mode 100% hors-ligne. Posez-moi une question sur un achat spécifique ou sur votre rythme de dépenses !`;
}

/**
 * Générateur d'Audit Financier et Diagnostic 100% Hors-Ligne.
 */
export function generateAuditOffline(budgetData: BudgetState): AIAuditResult {
  const currency = budgetData?.currency || 'TND';
  const income = Number(budgetData?.income || 0);
  const transactions = Array.isArray(budgetData?.transactions) ? budgetData.transactions : [];
  const items = Array.isArray(budgetData?.items) ? budgetData.items : [];

  const totalAllocated = items.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
  const totalSpent = transactions.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const remainingGlobal = income - totalSpent;

  const needsSpent = transactions
    .filter((t: any) => t.category === 'needs')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const wantsSpent = transactions
    .filter((t: any) => t.category === 'wants')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const savingsSpent = transactions
    .filter((t: any) => t.category === 'savings')
    .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  const needsTarget = income * ((budgetData?.customRatios?.needs || 50) / 100);
  const wantsTarget = income * ((budgetData?.customRatios?.wants || 30) / 100);
  const savingsTarget = income * ((budgetData?.customRatios?.savings || 20) / 100);

  const now = new Date();
  const currentDay = Math.max(1, now.getDate());
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = totalDays - currentDay;

  const burnRateDaily = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedEndMonthSpent = burnRateDaily * totalDays;
  const projectedSavings = income - projectedEndMonthSpent;

  let healthScore = 100;
  if (totalSpent > income) healthScore -= 40;
  if (wantsSpent > wantsTarget) healthScore -= 20;
  if (needsSpent > needsTarget) healthScore -= 15;
  if (projectedEndMonthSpent > income) healthScore -= 15;
  healthScore = Math.max(10, Math.min(100, healthScore));

  let overallHealth: 'EXCELLENT' | 'BON' | 'ATTENTION' | 'CRITIQUE' = 'EXCELLENT';
  if (healthScore < 50) overallHealth = 'CRITIQUE';
  else if (healthScore < 70) overallHealth = 'ATTENTION';
  else if (healthScore < 85) overallHealth = 'BON';

  return {
    overallHealth,
    healthScore,
    burnRateDaily: Math.round(burnRateDaily * 100) / 100,
    daysRemainingInMonth: daysRemaining,
    projectedEndMonthSpent: Math.round(projectedEndMonthSpent * 100) / 100,
    projectedSavings: Math.round(projectedSavings * 100) / 100,
    summary: `Votre vitesse de dépense moyenne est de ${burnRateDaily.toFixed(1)} ${currency}/jour. Selon les tendances actuelles, votre solde estimé en fin de mois sera de ${projectedSavings.toFixed(1)} ${currency}.`,
    mathAnalysis: {
      income,
      totalAllocated,
      totalSpent,
      remainingGlobal,
      needsSpent,
      needsTarget,
      wantsSpent,
      wantsTarget,
      savingsAllocated: savingsSpent,
      savingsTarget,
    },
    keyFindings: [
      `Dépenses totales enregistrées : ${totalSpent.toFixed(2)} ${currency} sur un revenu de ${income} ${currency}.`,
      `Poste Plaisirs : ${wantsSpent.toFixed(2)} ${currency} dépensés (${((wantsSpent / (income || 1)) * 100).toFixed(1)}% du revenu).`,
      `Capacité d'épargne projetée : ~${Math.max(0, projectedSavings).toFixed(2)} ${currency} d'ici la fin du mois.`,
    ],
    actionPlan: [
      `Maintenez les dépenses quotidiennes sous le seuil conseillé de ${(
        (income - totalSpent) /
        (daysRemaining || 1)
      ).toFixed(1)} ${currency}/jour.`,
      `Priorisez l'alimentation du compte d'épargne d'urgence au début du mois.`,
      `Passez en revue les dépenses discrétionnaires dans la catégorie Plaisirs.`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

