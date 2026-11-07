# Documentation Complète — LexBudget (SmartBudget Mobile v1.4.0)

**LexBudget / SmartBudget Mobile** est une application web progressive (PWA) de gestion budgétaire personnelle et familiale conçue pour un usage mobile local et synchronisé dans le Cloud. Elle repose sur la méthodologie financière **50/30/20** (Besoins, Envies, Épargne), la gestion multi-projets mensuels avec report de soldes, et un moteur d'audit et de conseil financier assisté par Intelligence Artificielle (Gemini).

---

## Table des Matières
1. [Présentation Générale & Philosophie](#1-présentation-générale--philosophie)
2. [Tableau de Bord & Indicateurs Clés](#2-tableau-de-bord--indicateurs-clés)
3. [Gestion des Projets Budgétaires (Mois & Périodes)](#3-gestion-des-projets-budgétaires-mois--périodes)
4. [Guide des 7 Onglets Fonctionnels](#4-guide-des-7-onglets-fonctionnels)
   - [4.1 Plan (Planification & Charges Fixes)](#41-plan-planification--charges-fixes)
   - [4.2 Suivi (Transactions & Portefeuilles)](#42-suivi-transactions--portefeuilles)
   - [4.3 Objectifs (Cagnottes & Épargne)](#43-objectifs-cagnottes--épargne)
   - [4.4 Analyses (Graphiques & Rythme Quotidien)](#44-analyses-graphiques--rythme-quotidien)
   - [4.5 Activités (Journal Global & Traçabilité)](#45-activités-journal-global--traçabilité)
   - [4.6 Conseiller IA (Coaching Financier)](#46-conseiller-ia-coaching-financier)
   - [4.7 Audit IA & Simulateur "What-If"](#47-audit-ia--simulateur-what-if)
5. [Système de Report Budgétaire (Rollover)](#5-système-de-report-budgétaire-rollover)
6. [Synchronisation Cloud (Firebase) & Sauvegardes Automatiques](#6-synchronisation-cloud-firebase--sauvegardes-automatiques)
7. [Système de Mise à Jour GitHub & Usage Mobile Local](#7-système-de-mise-à-jour-github--usage-mobile-local)
8. [Architecture Technique & Structure du Code](#8-architecture-technique--structure-du-code)
9. [Installation Locale & Déploiement](#9-installation-locale--déploiement)

---

## 1. Présentation Générale & Philosophie

LexBudget aide l'utilisateur à piloter ses finances personnelles selon trois piliers :
1. **Planifier avant de dépenser** : Répartir le revenu disponible entre **Besoins Essentiels (Needs)**, **Envies & Loisirs (Wants)** et **Épargne & Investissement (Savings)**.
2. **Suivre en temps réel sur mobile** : Enregistrer chaque dépense ou revenu en moins de 5 secondes grâce au bouton flottant (`+`) et aux préréglages rapides (*Presets*).
3. **Optimiser en continu** : Reporter les reliquats non dépensés d'un mois sur l'autre, simuler des économies avec le simulateur *What-If*, et auditer sa santé financière.

---

## 2. Tableau de Bord & Indicateurs Clés

Situé en haut de l'application (`DashboardHeader`), le tableau de bord affiche en permanence l'état du projet actif :
- **Revenu Disponible** : Somme du revenu mensuel de base, des revenus additionnels enregistrés dans le mois et du report global éventuel du mois précédent. Modifiable directement en un clic sur l'icône crayon.
- **Total Dépensé** : Somme des dépenses effectuées sur la période active, accompagnée du pourcentage du revenu consommé.
- **Reste à Vivre & "Safe-to-Spend" Quotidien (`~X TND/j`)** :
  - Indique le solde restant disponible.
  - Calcule automatiquement le **budget journalier sécurisé** (`Reste à vivre ÷ Jours restants dans le mois`) pour savoir immédiatement combien dépenser par jour sans dépasser son budget.
- **Barre de Progression Budgétaire** :
  - **Émeraude (`< 80%`)** : Rythme sain.
  - **Ambre (`80% – 100%`)** : Seuil de vigilance atteint.
  - **Rose (`> 100%`)** : Dépassement budgétaire.

---

## 3. Gestion des Projets Budgétaires (Mois & Périodes)

LexBudget gère chaque période mensuelle (ex. `2026-08`, `2026-09`) comme un **Projet Budgétaire indépendant** tout en conservant un historique unifié :
- **Sélecteur rapide (Pills)** : En haut du tableau de bord, basculez instantanément entre vos différents mois.
- **Gestionnaire de Projets (`Projets`)** : Affiche l'ensemble des périodes créées ou archivées avec leurs statistiques (Revenu, Budget Planifié, Réel Dépensé, Solde Net, Nombre d'opérations).
- **Création d'un Nouveau Projet (`+ Nouveau`)** :
  - Permet d'initialiser un nouveau mois (ex. Septembre 2026).
  - Remet les compteurs de dépenses (`actual`) à zéro pour la nouvelle période tout en conservant la structure de vos postes budgétaires.
  - Offre 3 options de démarrage :
    1. **Nouveau départ (0 report)** : Repart uniquement sur le revenu de base.
    2. **Reporter le solde global** : Ajoute l'excédent (ou déduit le déficit) du mois précédent au revenu disponible.
    3. **Reporter poste par poste** : Conserve les reliquats de chaque enveloppe (ex. +40 TND non utilisés sur *Alimentation*).

---

## 4. Guide des 7 Onglets Fonctionnels

### 4.1 Plan (Planification & Charges Fixes)
- **Sélecteur de Stratégie Budgétaire** :
  - `Équilibré (50/30/20)` : 50% Besoins, 30% Envies, 20% Épargne.
  - `Épargne Intensive (50/20/30)` : Priorité à l'épargne et au désendettement.
  - `Agressif / Frugal (40/20/40)` : Maximisation du capital investi.
  - `Personnalisé` : Réglage manuel des curseurs au pourcentage près (total = 100%).
- **Charges Fixes Mensuelles (`FixedChargesSection`)** :
  - Regroupe les factures récurrentes (Loyer, STEG, SONEDE, Internet, Salle de sport, etc.) avec leur **jour d'échéance**.
  - Affiche le statut (`Payée`, `En retard`, `Proche`, `À venir`) et permet de valider le paiement en 1 clic (`Payer`), ce qui crée automatiquement la transaction correspondante.
- **Postes Budgétaires (Enveloppes)** :
  - Ajout, modification du plafond prévu (`planned`) et suppression de postes dans chaque catégorie (*Besoins*, *Envies*, *Épargne*).

### 4.2 Suivi (Transactions & Portefeuilles)
- **Portefeuilles Multi-Comptes (`Wallets`)** :
  - Suivi des soldes réels par support : *Espèces (Cash)*, *Compte Courant*, *Carte Ticket Restaurant*, *Compte Épargne*, etc.
  - Option **"Exclure des analyses"** sur un portefeuille spécifique (utile pour les comptes de transit ou cagnottes externes).
  - **Virement Inter-Portefeuilles (`Virement`)** : Transfère des fonds d'un compte à un autre avec traçabilité complète.
- **Enregistrement Rapide (`QuickAddModal`)** :
  - Saisie d'une **Dépense (-)** ou d'un **Revenu (+)**.
  - Préréglages rapides (*Presets*) personnalisables en 1 tap (ex. *Café 3.5 TND*, *Courses 45 TND*, *Carburant 60 TND*).
  - Filtres par catégorie, recherche textuelle et modification/suppression directe de chaque opération.

### 4.3 Objectifs (Cagnottes & Épargne)
- Création et suivi de projets d'épargne à moyen/long terme (*Fonds d'urgence*, *Vacances*, *Achat Véhicule*, etc.).
- Calcul automatique du **montant mensuel requis** selon la date d'échéance cible.
- Bouton de versement rapide qui crédite la cagnotte et enregistre simultanément l'opération dans le suivi budgétaire.

### 4.4 Analyses (Graphiques & Rythme Quotidien)
- **Score d'Efficience Budgétaire (`/100`)** : Évalue la discipline budgétaire, le taux d'épargne et l'absence de dépassement.
- **Rythme Quotidien des Dépenses (`AreaChart`)** : Visualise jour par jour les sorties d'argent et identifie immédiatement le jour de pic de consommation.
- **Répartition par Catégorie (`PieChart`)** : Compare le poids réel des Besoins, Envies et Épargne.
- **Prévu vs Réel par Poste (`BarChart`)** : Compare les plafonds alloués aux dépenses effectives sur les principaux postes.

### 4.5 Activités (Journal Global & Traçabilité)
- Centralise toute l'activité de l'application :
  1. **Opérations Financières** : Recherche avancée par mot-clé, filtre par projet mensuel ou vue globale tous mois confondus, tri par date ou par montant.
  2. **Projets & Archives** : Accès rapide à l'historique des périodes.
  3. **Journal IA (Conseils & Audits)** : Historique horodaté des recommandations IA appliquées et des audits effectués.

### 4.6 Conseiller IA (Coaching Financier)
- Posez des questions en langage naturel sur votre budget (ex. *"Comment réduire mes dépenses alimentaires de 15% ?"*, *"Puis-je me permettre un achat de 250 TND ce mois-ci ?"*).
- Propose des **actions applicables en 1 clic** : ajustement des ratios 50/30/20, modification du plafond d'un poste ou virement vers l'épargne.

### 4.7 Audit IA & Simulateur "What-If"
- **Diagnostic IA Complet** : Génère un score de santé financière (`/100`), détecte les anomalies de consommation et propose des plafonds optimisés applicables directement.
- **Simulateur Interactif d'Optimisation ("What-If")** :
  - Permet de tester en direct une réduction de `5% à 50%` sur les *Envies* et de `0% à 25%` sur les *Besoins*.
  - Calcule instantanément le **gain d'épargne mensuel**, la **projection sur 12 mois (1 an)** et le nouveau ratio d'épargne cible, avec un bouton pour appliquer immédiatement cette répartition au budget.

---

## 5. Système de Report Budgétaire (Rollover)

Accessible via le bouton **`Report postes`** du tableau de bord (`PosteRolloverModal`) :
- Compare pour chaque poste d'un mois source (ex. Août) le budget prévu et le réel dépensé.
- Permet de sélectionner les postes dont on souhaite reporter l'écart (positif ou négatif) vers le mois actif.
- Le montant reporté apparaît sous forme de badge `Report +X TND` sur le poste concerné et s'ajoute à son budget disponible (`Prévu + Report`).

---

## 6. Synchronisation Cloud (Firebase) & Sauvegardes Automatiques

LexBudget garantit zéro perte de données grâce à une architecture **Offline-First + Cloud Sync** :
1. **Stockage Local Instantané (`localStorage`)** : Toutes les modifications sont enregistrées immédiatement sur l'appareil, permettant un fonctionnement 100% hors-ligne.
2. **Synchronisation Temps Réel Firebase Firestore** :
   - En vous connectant via le bouton **Cloud** (`AuthModal`), vos données sont synchronisées en temps réel avec Firestore.
   - **Fusion Intelligente Sans Perte (Smart Merge)** : Lors de la synchronisation entre téléphone et PC, les transactions et les projets mensuels (`monthlyReports`) sont fusionnés par identifiant unique (`id` / `periodMonth`) pour qu'aucun projet ni aucune dépense ne soit jamais écrasé.
3. **Sauvegardes Automatiques 12h (`BackupManagerModal`)** :
   - L'application crée automatiquement un instantané de sauvegarde toutes les 12 heures ainsi qu'avant chaque mise à jour ou changement de période.
   - Vous pouvez restaurer n'importe quel point de sauvegarde ou exporter/importer un fichier JSON/CSV/PDF via le menu **Exporter le rapport**.

---

## 7. Système de Mise à Jour GitHub & Usage Mobile Local

Conçu spécifiquement pour un usage local sur smartphone connecté à un dépôt GitHub :
- **Bouton `Update` dans l'en-tête** : Permet de vérifier à tout moment si le code source ou le dépôt GitHub a évolué.
- **Double vérification intelligente** :
  1. **Signature du Code Serveur (SHA-256)** : Détecte toute modification des fichiers du serveur ou de l'interface.
  2. **API GitHub en direct (`repos/:owner/:repo/commits/:branch`)** : Compare le dernier commit SHA de votre branche GitHub avec le commit actuellement installé sur votre téléphone (fonctionne même sans serveur intermédiaire grâce au mode direct client).
- **Mise à jour sécurisée en 1 clic (`Mettre à jour maintenant`)** :
  - Sauvegarde automatiquement l'intégralité de vos données dans `localStorage`.
  - Met à jour le Service Worker, purge les caches PWA obsolètes (`window.caches`), enregistre le nouveau commit SHA et recharge l'application avec les dernières fonctionnalités.

---

## 8. Architecture Technique & Structure du Code

### Stack Technique
- **Frontend** : React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts (visualisation de données).
- **Backend** : Node.js, Express (`server.ts` sur le port `3000`), intégration SDK officiel `@google/genai` (modèle `gemini-3-flash-preview`).
- **Base de données & Auth** : Firebase Authentication & Cloud Firestore + persistance locale `localStorage`.
- **PWA** : Manifest Web App, Service Worker et support de l'installation native Android/iOS (`beforeinstallprompt`).

### Arborescence Principale
```text
├── server.ts                         # Serveur Express, API Gemini (/api/ai/*) & Signature/GitHub Update (/api/app/*)
├── src/
│   ├── types.ts                      # Modèles de données TypeScript (BudgetState, Transaction, GitHubUpdateConfig...)
│   ├── App.tsx                       # Composant racine, synchronisation Firebase, gestion multi-projets & mises à jour
│   ├── lib/
│   │   ├── storage.ts                # Persistance locale, fusion des projets, sauvegardes 12h & Clean App Update
│   │   └── firebase.ts               # Initialisation Firebase Auth & Firestore temps réel
│   └── components/
│       ├── MobileHeader.tsx          # Barre supérieure, bouton Check Update, Virement, Cloud & Menu
│       ├── DashboardHeader.tsx       # Sélecteur de projets, KPIs financiers & indicateur Safe-to-Spend/jour
│       ├── Navigation.tsx            # Barre de navigation inférieure à 7 onglets
│       ├── TabPlanning.tsx           # Planification 50/30/20, curseurs & enveloppes budgétaires
│       ├── FixedChargesSection.tsx   # Suivi et paiement en 1 clic des factures et charges fixes
│       ├── TabTracking.tsx           # Liste des transactions, filtres & portefeuilles
│       ├── TabGoals.tsx              # Objectifs d'épargne & cagnottes
│       ├── TabAnalytics.tsx          # Graphiques Recharts (Rythme quotidien, Répartition, Prévu vs Réel)
│       ├── TabActivities.tsx         # Journal global multi-mois et historique d'activité
│       ├── TabAdvisor.tsx            # Conseiller financier IA interactif
│       ├── TabAudit.tsx              # Audit IA & Simulateur d'optimisation "What-If"
│       ├── ApkUpdateModal.tsx        # Centre de mise à jour GitHub & installation mobile PWA
│       ├── ProjectsManagerModal.tsx  # Gestionnaire global de tous les projets mensuels
│       ├── NewPeriodModal.tsx        # Assistant de création d'une nouvelle période mensuelle
│       ├── PosteRolloverModal.tsx    # Report sélectif des reliquats poste par poste
│       ├── BackupManagerModal.tsx    # Gestion des sauvegardes automatiques et restauration
│       ├── ExportModal.tsx           # Export PDF/CSV/JSON et import de sauvegarde
│       └── DocumentationModal.tsx    # Guide utilisateur interactif intégré à l'application
```

---

## 9. Installation Locale & Déploiement

### Prérequis
- **Node.js** v18+ (ou Bun)
- Une clé API Gemini (`GEMINI_API_KEY`) configurée dans `.env` (optionnelle : l'application dispose d'un moteur d'audit et de conseil local de secours si hors-ligne).

### Commandes
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en mode développement (Port 3000)
npm run dev

# 3. Vérifier le typage TypeScript
npm run lint

# 4. Compiler pour la production
npm run build
```
