import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for exported Android APK (Antigravity / Capacitor / WebView)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Initialize Gemini Client safely
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Dynamic PWA Manifest Route
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    name: "SmartBudget AI - Gestion Financière",
    short_name: "Budget.AI",
    description: "Application mobile de gestion de budget personnel avec planification 50/30/20, suivi des dépenses et Conseiller AI.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  });
});

// ----------------------------------------------------
// FALLBACK ENGINES FOR AI ADVISOR & AUDIT
// ----------------------------------------------------
function generateAdvisorFallbackReply(userMessage: string, budgetData: any): string {
  const currency = budgetData?.currency || 'TND';
  const income = Number(budgetData?.income || 0);
  const transactions = Array.isArray(budgetData?.transactions) ? budgetData.transactions : [];
  
  const totalSpent = transactions.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const remaining = income - totalSpent;
  
  const needsSpent = transactions.filter((t: any) => t.category === 'needs').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const wantsSpent = transactions.filter((t: any) => t.category === 'wants').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const savingsSpent = transactions.filter((t: any) => t.category === 'savings').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  const needsTarget = income * ((budgetData?.customRatios?.needs || 50) / 100);
  const wantsTarget = income * ((budgetData?.customRatios?.wants || 30) / 100);
  const savingsTarget = income * ((budgetData?.customRatios?.savings || 20) / 100);

  const lowerMsg = userMessage.toLowerCase();

  const priceMatch = userMessage.match(/\b(\d+(?:[.,]\d+)?)\s*(?:TND|€|\$|DT|dinars)?\b/i);
  const askedAmount = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;

  if (askedAmount && (lowerMsg.includes('acheter') || lowerMsg.includes('permettre') || lowerMsg.includes('prix') || lowerMsg.includes('cout') || lowerMsg.includes('coût'))) {
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

  if (lowerMsg.includes('reste') || lowerMsg.includes('solde') || lowerMsg.includes('semaine') || lowerMsg.includes('combien')) {
    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - today + 1;
    const dailyAllowance = remainingDays > 0 ? (remaining / remainingDays) : remaining;

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

  return `🤖 **Analyse Financière de FinExpert AI :**

Pour votre budget global de **${income} ${currency}** :
• **Besoins Essentiels (50%) :** ${needsSpent.toFixed(2)} / ${needsTarget.toFixed(2)} ${currency}
• **Plaisirs & Envies (30%) :** ${wantsSpent.toFixed(2)} / ${wantsTarget.toFixed(2)} ${currency}
• **Épargne & Projets (20%) :** ${savingsSpent.toFixed(2)} / ${savingsTarget.toFixed(2)} ${currency}
• **Solde Disponible :** **${remaining.toFixed(2)} ${currency}**

Comment souhaitez-vous optimiser vos postes de dépenses aujourd'hui ? Posez-moi une question sur un achat spécifique ou un conseil de gestion !`;
}

function generateAuditFallback(budgetData: any) {
  const currency = budgetData?.currency || 'TND';
  const income = Number(budgetData?.income || 0);
  const transactions = Array.isArray(budgetData?.transactions) ? budgetData.transactions : [];
  const items = Array.isArray(budgetData?.items) ? budgetData.items : [];

  const totalAllocated = items.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
  const totalSpent = transactions.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const remainingGlobal = income - totalSpent;

  const needsSpent = transactions.filter((t: any) => t.category === 'needs').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const wantsSpent = transactions.filter((t: any) => t.category === 'wants').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const savingsSpent = transactions.filter((t: any) => t.category === 'savings').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

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

  let overallHealth = 'EXCELLENT';
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
      `Maintenez les dépenses quotidiennes sous le seuil conseillé de ${((income - totalSpent) / (daysRemaining || 1)).toFixed(1)} ${currency}/jour.`,
      `Priorisez l'alimentation du compte d'épargne d'urgence au début du mois.`,
      `Passez en revue les dépenses discrétionnaires dans la catégorie Plaisirs.`,
    ],
    generatedAt: new Date().toISOString(),
  };
}

// Interactive AI Financial Advisor Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, budgetData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message payload is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = getGeminiAI();

        // Prepare systemic prompt with real-time budget context
        const budgetSummaryContext = `
VOUS ÊTES: "FinExpert AI", un conseiller financier certifié, algorithmique, direct et rigoureux.
PROPRIÉTAIRE DU BUDGET: Karim DKHILI (ou l'utilisateur actuel).
DEVISE DE L'APPLICATION: ${budgetData?.currency || 'TND'}

DONNÉES BUDGETAIRES ACTUELLES DE L'UTILISATEUR (EN TEMPS RÉEL):
- Revenu Net Mensuel: ${budgetData?.income || 0} ${budgetData?.currency || 'TND'}
- Stratégie Choisie: ${budgetData?.strategy || 'balanced'}
- Ratios Personnalisés: Besoins ${budgetData?.customRatios?.needs || 50}%, Plaisirs ${budgetData?.customRatios?.wants || 30}%, Épargne ${budgetData?.customRatios?.savings || 20}%

OBJECTIFS FINANCIERS DU PORTEFEUILLE (GOALS):
${JSON.stringify(budgetData?.goals || [], null, 2)}

POSTES D'ALIMENTATION & BUDGETS DÉFINIS (ITEMS):
${JSON.stringify(budgetData?.items || [], null, 2)}

HISTORIQUE DES TRANSACTIONS ET DÉPENSES RÉELLES SAISIES:
${JSON.stringify(budgetData?.transactions || [], null, 2)}

RÈGLES DU CONSEILLER:
1. Répondez toujours en français, de manière claire, concise, structurée et motivante.
2. Basisez TOUTES vos analyses et réponses sur les données réelles fournies ci-dessus (faites des calculs exacts).
3. Si l'utilisateur demande une réallocation ou un ajustement, fournissez un objet JSON contenant 'reply' et optionnellement un tableau 'proposals' d'actions concrètes exécutables.
4. Schéma JSON si pertinent:
{
  "reply": "Explication détaillée de votre analyse...",
  "proposals": [
    {
      "id": "prop-1",
      "title": "Titre court de l'action",
      "description": "Explication de la modification",
      "actionType": "adjust_ratios",
      "ratios": { "needs": 50, "wants": 30, "savings": 20 }
    }
  ]
}
5. Si aucun ajustement automatique n'est requis, vous pouvez répondre sous forme de texte simple.
        `;

        const formattedContents = [];
        if (Array.isArray(history)) {
          for (const h of history) {
            if (h.sender === 'user') {
              formattedContents.push({ role: 'user', parts: [{ text: h.text }] });
            } else if (h.sender === 'assistant') {
              formattedContents.push({ role: 'model', parts: [{ text: h.text }] });
            }
          }
        }

        formattedContents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: formattedContents,
          config: {
            systemInstruction: budgetSummaryContext,
            temperature: 0.7,
          },
        });

        const rawText = response.text || '';
        let replyText = rawText;
        let proposals: any[] = [];

        try {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          if (cleanJson.startsWith('{')) {
            const parsed = JSON.parse(cleanJson);
            if (parsed.reply) replyText = parsed.reply;
            if (Array.isArray(parsed.proposals)) proposals = parsed.proposals;
          }
        } catch (e) {
          // Plain text fallback
        }

        // Generate proposal fallback if user asked for rebalance/adjustment
        const lowerMsg = message.toLowerCase();
        if (proposals.length === 0 && (lowerMsg.includes('ajuste') || lowerMsg.includes('rééquilibre') || lowerMsg.includes('ratio') || lowerMsg.includes('budget'))) {
          proposals.push({
            id: `prop-${Date.now()}`,
            title: 'Rééquilibrage Cible (50/30/20)',
            description: 'Ajuste immédiatement les allocations d\'épargne et de besoins aux ratios cibles 50/30/20.',
            actionType: 'adjust_ratios',
            ratios: { needs: 50, wants: 30, savings: 20 },
          });
        }

        return res.json({ reply: replyText, proposals });
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, switching to local financial engine fallback:', geminiError?.message);
      }
    }

    // Fallback if API key missing or Gemini request failed
    const fallbackReply = generateAdvisorFallbackReply(message, budgetData);
    const fallbackProposals: any[] = [];

    const lowerMsg = (message || '').toLowerCase();
    if (lowerMsg.includes('ajuste') || lowerMsg.includes('rééquilibre') || lowerMsg.includes('ratio') || lowerMsg.includes('budget')) {
      fallbackProposals.push({
        id: `prop-${Date.now()}-1`,
        title: 'Rééquilibrage de la Stratégie (50/30/20)',
        description: 'Réaligne automatiquement vos ratios à 50% Besoins, 30% Plaisirs, 20% Épargne.',
        actionType: 'adjust_ratios',
        ratios: { needs: 50, wants: 30, savings: 20 },
      });
    }

    if (lowerMsg.includes('transfert') || lowerMsg.includes('transferer') || lowerMsg.includes('plaisir') || lowerMsg.includes('epargne')) {
      const wantsItem = (budgetData?.items || []).find((i: any) => i.category === 'wants');
      const savingsGoal = (budgetData?.goals || [])[0] || (budgetData?.items || []).find((i: any) => i.category === 'savings');

      if (wantsItem && savingsGoal) {
        fallbackProposals.push({
          id: `prop-${Date.now()}-2`,
          title: `Transférer 50 ${budgetData?.currency || 'TND'} de ${wantsItem.name} vers Épargne`,
          description: `Alloue un surplus de 50 ${budgetData?.currency || 'TND'} prélevé sur vos plaisirs pour sécuriser votre épargne.`,
          actionType: 'transfer_envelope_budget',
          transferData: {
            fromId: wantsItem.id,
            fromName: wantsItem.name,
            toId: savingsGoal.id,
            toName: savingsGoal.title || savingsGoal.name,
            amount: 50,
          },
        });
      }
    }

    return res.json({ reply: fallbackReply, proposals: fallbackProposals });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    const fallbackReply = generateAdvisorFallbackReply(req.body?.message || '', req.body?.budgetData);
    return res.json({ reply: fallbackReply, proposals: [] });
  }
});

// Automated Mathematical Audit & Feedback Endpoint
app.post('/api/ai/audit', async (req, res) => {
  try {
    const { budgetData } = req.body;

    if (!budgetData) {
      return res.status(400).json({ error: 'budgetData is required for mathematical audit' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = getGeminiAI();

        const systemPrompt = `
Vous êtes un expert-comptable et conseiller financier algorithmique de premier ordre.
Votre rôle est d'effectuer un audit mathématique complet et rigoureux du budget d'un utilisateur.

Règles de Calcul et Diagnostic:
- Calculez la vitesse de dépense quotidienne (Daily Burn Rate = Dépenses totales / jour actuel du mois).
- Projetez la dépense totale en fin de mois (Burn Rate * nombre total de jours du mois).
- Évaluez l'écart (Variance) entre les cibles de la stratégie (${budgetData.strategy}) et les montants réels consommés.
- Déterminez le score de santé financière (Score de 0 à 100).
- Donnez un statut global: EXCELLENT, BON, ATTENTION, ou CRITIQUE.
- Identifiez 3 à 5 constats clés (Key Findings) basés sur les chiffres réels.
- Rédigez un plan d'action immédiat en 3 points concrets et réalisables.

Répondez STRICTEMENT sous forme d'un objet JSON respectant le schéma demandé.
        `;

        const userPrompt = `Effectue l'audit mathématique approfondi de ce budget :
Revenu Net: ${budgetData.income} ${budgetData.currency}
Stratégie: ${budgetData.strategy}
Custom ratios: ${JSON.stringify(budgetData.customRatios)}
Items planifiés: ${JSON.stringify(budgetData.items)}
Transactions réelles: ${JSON.stringify(budgetData.transactions)}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                overallHealth: {
                  type: Type.STRING,
                  description: 'Statut global: EXCELLENT, BON, ATTENTION, ou CRITIQUE',
                },
                healthScore: {
                  type: Type.INTEGER,
                  description: 'Score de santé financière de 0 à 100',
                },
                burnRateDaily: {
                  type: Type.NUMBER,
                  description: 'Vitesse de dépense moyenne par jour',
                },
                daysRemainingInMonth: {
                  type: Type.INTEGER,
                  description: 'Nombre de jours restants dans le mois actuel',
                },
                projectedEndMonthSpent: {
                  type: Type.NUMBER,
                  description: 'Projection des dépenses totales d\'ici la fin du mois',
                },
                projectedSavings: {
                  type: Type.NUMBER,
                  description: 'Épargne estimée conservée à la fin du mois',
                },
                summary: {
                  type: Type.STRING,
                  description: 'Résumé exécutif en 2-3 phrases claires et percutantes',
                },
                mathAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    income: { type: Type.NUMBER },
                    totalAllocated: { type: Type.NUMBER },
                    totalSpent: { type: Type.NUMBER },
                    remainingGlobal: { type: Type.NUMBER },
                    needsSpent: { type: Type.NUMBER },
                    needsTarget: { type: Type.NUMBER },
                    wantsSpent: { type: Type.NUMBER },
                    wantsTarget: { type: Type.NUMBER },
                    savingsAllocated: { type: Type.NUMBER },
                    savingsTarget: { type: Type.NUMBER },
                  },
                  required: ['income', 'totalAllocated', 'totalSpent', 'remainingGlobal'],
                },
                keyFindings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Liste de 3 à 5 constats clés mathématiques',
                },
                actionPlan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Liste de 3 recommandations prioritaires',
                },
              },
              required: [
                'overallHealth',
                'healthScore',
                'burnRateDaily',
                'projectedEndMonthSpent',
                'projectedSavings',
                'summary',
                'keyFindings',
                'actionPlan',
              ],
            },
          },
        });

        const jsonText = response.text || '{}';
        const auditResult = JSON.parse(jsonText);
        auditResult.generatedAt = new Date().toISOString();

        return res.json(auditResult);
      } catch (geminiError: any) {
        console.warn('Gemini Audit API failed, using local audit fallback:', geminiError?.message);
      }
    }

    const fallbackAudit = generateAuditFallback(budgetData);
    return res.json(fallbackAudit);
  } catch (error: any) {
    console.error('Error in /api/ai/audit:', error);
    const fallbackAudit = generateAuditFallback(req.body?.budgetData);
    return res.json(fallbackAudit);
  }
});

// App Version, Full Codebase Recursive Hash & Intelligent APK Update Sync Endpoints
import fs from 'fs';
import crypto from 'crypto';

interface ServerFeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'core' | 'ai' | 'sync' | 'analytics' | 'ux';
  addedInVersion: string;
  isNew?: boolean;
}

const BASELINE_KNOWN_COMPONENTS = new Set([
  'AIProposalCard.tsx',
  'ApkUpdateModal.tsx',
  'AuthModal.tsx',
  'BackupManagerModal.tsx',
  'CategoryCard.tsx',
  'DashboardHeader.tsx',
  'DocumentationModal.tsx',
  'ExportModal.tsx',
  'MobileHeader.tsx',
  'Navigation.tsx',
  'NewPeriodModal.tsx',
  'PosteRolloverModal.tsx',
  'ProjectsManagerModal.tsx',
  'QuickAddModal.tsx',
  'SmartReminderBanner.tsx',
  'TabActivities.tsx',
  'TabAdvisor.tsx',
  'TabAnalytics.tsx',
  'TabAudit.tsx',
  'TabGoals.tsx',
  'TabPlanning.tsx',
  'TabTracking.tsx',
  'UpdateNotificationBanner.tsx',
  'WalletTransferModal.tsx',
]);

let serverFeaturesManifest: ServerFeatureItem[] = [
  {
    id: 'feat-budget-50-30-20',
    title: 'Planification 50/30/20 & Ratios Personnalisés',
    description: 'Allocation dynamique des revenus en Besoins, Plaisirs et Épargne avec report de reliquat.',
    category: 'core',
    addedInVersion: '1.0.0',
  },
  {
    id: 'feat-multi-wallets',
    title: 'Gestion Multi-Comptes & Virements Internes',
    description: 'Suivi des soldes Compte Courant, Épargne, Cash et Fonds d\'urgence.',
    category: 'core',
    addedInVersion: '1.1.0',
  },
  {
    id: 'feat-cloud-firestore-sync',
    title: 'Synchronisation Temps Réel Firebase Firestore',
    description: 'Fusion intelligente sans perte des transactions et archives mensuelles entre appareils.',
    category: 'sync',
    addedInVersion: '1.2.0',
  },
  {
    id: 'feat-ai-advisor-audit',
    title: 'Conseiller Financier FinExpert AI & Audit Mathématique',
    description: 'Chat interactif Gemini, diagnostic de santé financière sur 100 et simulateur What-If.',
    category: 'ai',
    addedInVersion: '1.3.0',
  },
  {
    id: 'feat-in-app-documentation',
    title: 'Documentation Interactive Intégrée (6 Sections)',
    description: 'Manuel utilisateur et technique consultable hors-ligne avec recherche instantanée.',
    category: 'ux',
    addedInVersion: '1.4.0',
  },
  {
    id: 'feat-antigravity-apk-ota-sync',
    title: 'Système Intelligent de Détection & MAJ APK (Antigravity)',
    description: 'Détection multi-canaux (Firestore Temps Réel, Serveur AI Studio & GitHub) des nouveaux changements et fonctionnalités.',
    category: 'sync',
    addedInVersion: '1.5.0',
  },
];

function collectSourceFilesRecursively(dirPath: string, baseDir: string, acc: string[] = []): string[] {
  try {
    if (!fs.existsSync(dirPath)) return acc;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        collectSourceFilesRecursively(fullPath, baseDir, acc);
      } else if (/\.(ts|tsx|css|json)$/i.test(entry.name)) {
        acc.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
      }
    }
  } catch {
    // Ignore directory read errors
  }
  return acc;
}

function formatModuleLabel(relPath: string): string {
  if (relPath === 'server.ts') return 'Serveur Express & Moteur IA (server.ts)';
  if (relPath === 'src/App.tsx') return 'Coeur Application & Synchronisation (App.tsx)';
  if (relPath === 'src/types.ts') return 'Modèles de Données & Types (types.ts)';
  if (relPath.startsWith('src/components/')) {
    const compName = path.basename(relPath, '.tsx');
    return `Module UI : ${compName}`;
  }
  if (relPath.startsWith('src/lib/')) {
    const libName = path.basename(relPath, '.ts');
    return `Service Logique : ${libName}`;
  }
  return relPath;
}

function computeCodebaseSignature(): {
  buildHash: string;
  lastModified: string;
  totalFilesScanned: number;
  modifiedModules: string[];
  autoDiscoveredFeatures: ServerFeatureItem[];
} {
  const rootDir = process.cwd();
  const srcFiles = collectSourceFilesRecursively(path.join(rootDir, 'src'), rootDir);
  const rootTracked = ['server.ts', 'package.json', 'DOCUMENTATION.md'];
  const allFiles = Array.from(new Set([...rootTracked, ...srcFiles])).sort();

  const hash = crypto.createHash('sha256');
  let latestMtime = 0;
  const fileStats: { relPath: string; mtimeMs: number }[] = [];
  const autoDiscoveredFeatures: ServerFeatureItem[] = [];

  for (const relPath of allFiles) {
    try {
      const fullPath = path.join(rootDir, relPath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
        fileStats.push({ relPath, mtimeMs: stat.mtimeMs });
        const content = fs.readFileSync(fullPath, 'utf-8');
        hash.update(`${relPath}:${content.length}:`);
        hash.update(content);

        // Automatically detect if a brand-new component was created in src/components/
        if (relPath.startsWith('src/components/') && relPath.endsWith('.tsx')) {
          const fileName = path.basename(relPath);
          if (!BASELINE_KNOWN_COMPONENTS.has(fileName)) {
            const cleanTitle = fileName.replace(/\.tsx$/, '').replace(/([A-Z])/g, ' $1').trim();
            autoDiscoveredFeatures.push({
              id: `feat-auto-${fileName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              title: `Nouveau Module : ${cleanTitle}`,
              description: `Nouveau composant fonctionnel (${fileName}) détecté automatiquement dans AI Studio.`,
              category: 'ux',
              addedInVersion: '1.5.0+',
              isNew: true,
            });
          }
        }
      }
    } catch {
      // Ignore individual file read error
    }
  }

  fileStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const modifiedModules = fileStats.slice(0, 5).map((f) => formatModuleLabel(f.relPath));

  return {
    buildHash: hash.digest('hex').substring(0, 12),
    lastModified: latestMtime > 0 ? new Date(latestMtime).toISOString() : new Date().toISOString(),
    totalFilesScanned: fileStats.length,
    modifiedModules,
    autoDiscoveredFeatures,
  };
}

const initialSig = computeCodebaseSignature();

let currentAppVersion = {
  version: '1.5.0',
  buildNumber: 150,
  buildHash: initialSig.buildHash,
  releaseDate: initialSig.lastModified,
  apkDownloadUrl: '',
  liveWebUrl: 'https://ais-pre-a6qgiudfqqbzdg5nrz5sfr-162483565558.europe-west2.run.app',
  releaseNotes: [
    'Système intelligent de détection de changements pour APK exporté via Antigravity (3 canaux : Firestore Temps Réel, Serveur AI Studio & GitHub)',
    'Scan récursif intégral de tous les fichiers source (src/ & server.ts) avec détection automatique des nouvelles fonctionnalités',
    'Support CORS complet permettant à l\'APK Android d\'interroger le serveur maître AI Studio et le Conseiller IA à distance',
    'Console de publication en 1 clic depuis AI Studio pour notifier instantanément l\'application mobile APK',
    'Documentation interactive intégrée et sauvegarde pré-mise à jour garantie sans perte de données',
  ],
  hasUpdate: false,
};

function getMergedServerFeatures(autoDiscovered: ServerFeatureItem[]): ServerFeatureItem[] {
  const map = new Map<string, ServerFeatureItem>();
  for (const f of serverFeaturesManifest) {
    map.set(f.id, f);
  }
  for (const f of autoDiscovered) {
    if (!map.has(f.id)) {
      map.set(f.id, f);
    }
  }
  return Array.from(map.values());
}

app.get('/api/app/version', (req, res) => {
  const sig = computeCodebaseSignature();
  const allFeatures = getMergedServerFeatures(sig.autoDiscoveredFeatures);
  res.json({
    ...currentAppVersion,
    buildHash: sig.buildHash,
    lastModified: sig.lastModified,
    totalFilesScanned: sig.totalFilesScanned,
    modifiedModules: sig.modifiedModules,
    features: allFeatures,
  });
});

// Check GitHub Repository, Releases & AI Studio Server Codebase for APK Updates
app.post('/api/app/check-github-update', async (req, res) => {
  try {
    const {
      repoUrl = '',
      branch = 'main',
      installedVersion = '',
      installedBuildHash = '',
      installedCommitSha = '',
      installedFeatureIds = [],
    } = req.body || {};

    const sig = computeCodebaseSignature();
    const allFeatures = getMergedServerFeatures(sig.autoDiscoveredFeatures);

    let githubCommit: {
      sha: string;
      shortSha: string;
      message: string;
      author: string;
      date: string;
      url: string;
      repoFullName: string;
      branch: string;
    } | null = null;
    let githubError: string | null = null;
    let detectedApkReleaseUrl = currentAppVersion.apkDownloadUrl || '';

    // Parse GitHub owner/repo if provided
    const trimmedRepo = String(repoUrl || '').trim();
    if (trimmedRepo) {
      let owner = '';
      let repo = '';
      const ghMatch = trimmedRepo.match(/(?:github\.com\/|^)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git|\/|$)/i);
      if (ghMatch) {
        owner = ghMatch[1];
        repo = ghMatch[2];
      }

      if (owner && repo) {
        const targetBranch = String(branch || 'main').trim() || 'main';
        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${encodeURIComponent(targetBranch)}`;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const ghRes = await fetch(apiUrl, {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'SmartBudget-Mobile-APK-Updater/1.5',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (ghRes.ok) {
            const commitData: any = await ghRes.json();
            if (commitData && commitData.sha) {
              githubCommit = {
                sha: commitData.sha,
                shortSha: String(commitData.sha).substring(0, 7),
                message: commitData.commit?.message || 'Mise à jour du code sur GitHub',
                author: commitData.commit?.author?.name || commitData.author?.login || owner,
                date: commitData.commit?.author?.date || new Date().toISOString(),
                url: commitData.html_url || `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
                repoFullName: `${owner}/${repo}`,
                branch: targetBranch,
              };
            }
          } else if (ghRes.status === 404) {
            githubError = `Dépôt ou branche introuvable (${owner}/${repo}@${targetBranch}). Vérifiez que le dépôt est public ou le nom de la branche.`;
          } else {
            githubError = `GitHub API a retourné le code ${ghRes.status}.`;
          }

          // Also check if there is a latest GitHub Release containing an .apk file
          try {
            const relRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
              {
                headers: {
                  Accept: 'application/vnd.github.v3+json',
                  'User-Agent': 'SmartBudget-Mobile-APK-Updater/1.5',
                },
              }
            );
            if (relRes.ok) {
              const relData: any = await relRes.json();
              const apkAsset = Array.isArray(relData?.assets)
                ? relData.assets.find((a: any) => String(a.name || '').toLowerCase().endsWith('.apk'))
                : null;
              if (apkAsset?.browser_download_url) {
                detectedApkReleaseUrl = apkAsset.browser_download_url;
              }
            }
          } catch {
            // Optional release check
          }
        } catch (fetchErr: any) {
          githubError = `Impossible de joindre GitHub (${fetchErr?.message || 'réseau hors-ligne'}). Vérification effectuée sur le serveur AI Studio.`;
        }
      } else {
        githubError = 'Format du dépôt GitHub invalide. Utilisez "utilisateur/depot" ou l\'URL complète GitHub.';
      }
    }

    // Differential Feature Detection: compare server features against APK's installedFeatureIds
    const clientFeatureSet = new Set(Array.isArray(installedFeatureIds) ? installedFeatureIds : []);
    const newFeaturesDetected =
      clientFeatureSet.size > 0
        ? allFeatures.filter((f) => !clientFeatureSet.has(f.id)).map((f) => ({ ...f, isNew: true }))
        : sig.autoDiscoveredFeatures;

    const versionChanged = Boolean(installedVersion && installedVersion !== currentAppVersion.version);
    const buildHashChanged = Boolean(installedBuildHash && installedBuildHash !== sig.buildHash);
    const githubShaChanged = Boolean(
      githubCommit && installedCommitSha && githubCommit.sha !== installedCommitSha
    );
    const hasNewFeatures = newFeaturesDetected.length > 0;

    const hasUpdate =
      currentAppVersion.hasUpdate ||
      versionChanged ||
      buildHashChanged ||
      githubShaChanged ||
      hasNewFeatures;

    let updateSource: 'github' | 'server' | 'firestore' | 'both' | 'none' = 'none';
    if (githubShaChanged && (versionChanged || buildHashChanged || hasNewFeatures)) {
      updateSource = 'both';
    } else if (githubShaChanged) {
      updateSource = 'github';
    } else if (versionChanged || buildHashChanged || hasNewFeatures || currentAppVersion.hasUpdate) {
      updateSource = 'server';
    }

    const dynamicNotes: string[] = [];
    for (const nf of newFeaturesDetected) {
      dynamicNotes.push(`✨ Nouvelle fonctionnalité ajoutée : ${nf.title} — ${nf.description}`);
    }
    if (githubCommit) {
      dynamicNotes.push(`GitHub [${githubCommit.repoFullName}@${githubCommit.branch}] (${githubCommit.shortSha}) : ${githubCommit.message.split('\n')[0]}`);
    }
    if (buildHashChanged) {
      dynamicNotes.push(`Changement du code source détecté dans AI Studio (Nouvelle signature #${sig.buildHash} sur ${sig.totalFilesScanned} fichiers)`);
    }
    const mergedNotes = [...dynamicNotes, ...currentAppVersion.releaseNotes];

    res.json({
      hasUpdate,
      updateSource,
      version: currentAppVersion.version,
      buildNumber: currentAppVersion.buildNumber,
      buildHash: sig.buildHash,
      lastModified: sig.lastModified,
      totalFilesScanned: sig.totalFilesScanned,
      modifiedModules: sig.modifiedModules,
      features: allFeatures,
      newFeaturesDetected,
      apkDownloadUrl: detectedApkReleaseUrl,
      liveWebUrl: currentAppVersion.liveWebUrl,
      releaseNotes: mergedNotes,
      githubCommit,
      githubError,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/app/check-github-update:', error);
    const sig = computeCodebaseSignature();
    res.status(500).json({
      hasUpdate: false,
      version: currentAppVersion.version,
      buildHash: sig.buildHash,
      error: error?.message || 'Erreur lors de la vérification des mises à jour',
    });
  }
});

app.get('/api/app/apk-config', (req, res) => {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const fullAppUrl = `${protocol}://${host}`;
  const sig = computeCodebaseSignature();

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(fullAppUrl)}`;
  const web2apkUrl = `https://www.web2apk.com/`;

  res.json({
    appName: 'SmartBudget AI',
    packageName: 'com.smartbudget.ai',
    version: currentAppVersion.version,
    buildHash: sig.buildHash,
    totalFilesScanned: sig.totalFilesScanned,
    appUrl: fullAppUrl,
    pwaBuilderUrl,
    web2apkUrl,
    downloadInstructions: [
      '1. Export vers Antigravity & APK : Le code intègre un détecteur intelligent multi-canaux (Firestore Temps Réel + Serveur Cloud AI Studio + GitHub).',
      '2. Détection Automatique des Nouvelles Fonctionnalités : Dès qu\'un changement ou une fonctionnalité est ajouté ici dans AI Studio, votre APK sur téléphone détecte la différence de signature et affiche une invitation de mise à jour.',
      '3. Sauvegarde Intégrale : Vos projets et transactions sont sauvegardés localement et sur Firebase avant chaque mise à jour.'
    ]
  });
});

// Publish a new version / new feature from AI Studio to notify all exported APK instances
app.post('/api/app/trigger-update', (req, res) => {
  const sig = computeCodebaseSignature();
  const {
    featureTitle = '',
    featureDescription = '',
    featureCategory = 'ux',
    apkDownloadUrl = '',
    note = '',
  } = req.body || {};

  const newVersion = (parseFloat(currentAppVersion.version) + 0.01).toFixed(2);

  if (featureTitle && String(featureTitle).trim()) {
    const cleanTitle = String(featureTitle).trim();
    const cleanDesc =
      String(featureDescription || '').trim() ||
      `Nouvelle fonctionnalité publiée depuis AI Studio dans la version v${newVersion}.`;
    const newFeat: ServerFeatureItem = {
      id: `feat-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      category: (['core', 'ai', 'sync', 'analytics', 'ux'].includes(featureCategory)
        ? featureCategory
        : 'ux') as any,
      addedInVersion: newVersion,
      isNew: true,
    };
    serverFeaturesManifest = [newFeat, ...serverFeaturesManifest];
  }

  const customNote =
    note && String(note).trim()
      ? String(note).trim()
      : featureTitle
      ? `Nouvelle fonctionnalité : ${featureTitle} (v${newVersion} • Build #${sig.buildHash})`
      : `Mise à jour publiée depuis AI Studio v${newVersion} (Build #${sig.buildHash})`;

  currentAppVersion = {
    ...currentAppVersion,
    version: newVersion,
    buildNumber: currentAppVersion.buildNumber + 1,
    buildHash: sig.buildHash,
    releaseDate: new Date().toISOString(),
    ...(apkDownloadUrl ? { apkDownloadUrl: String(apkDownloadUrl).trim() } : {}),
    releaseNotes: [customNote, ...currentAppVersion.releaseNotes.slice(0, 6)],
    hasUpdate: true,
  };

  const allFeatures = getMergedServerFeatures(sig.autoDiscoveredFeatures);

  res.json({
    success: true,
    message: `Nouvelle version v${newVersion} publiée ! Tous les APK connectés seront notifiés.`,
    versionData: {
      ...currentAppVersion,
      totalFilesScanned: sig.totalFilesScanned,
      modifiedModules: sig.modifiedModules,
      features: allFeatures,
    },
    notification: {
      title: '📱 SmartBudget APK - Nouvelle mise à jour disponible !',
      body: `La version v${newVersion} est prête avec de nouvelles fonctionnalités.`,
    },
  });
});

// ----------------------------------------------------
// VITE / STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
