# Plan d'Implémentation : Système Intelligent de Mise à Jour pour APK (Export Antigravity)

## 1. Diagnostic Technique : Pourquoi un APK exporté a besoin d'une architecture dédiée
Lorsque le projet est exporté vers **Antigravity** et compilé en **APK Android** :
1. **Absence du serveur Node/Express en local dans l'APK** : L'APK s'exécute localement sur le téléphone (`capacitor://localhost`, `http://localhost` ou `file://`). Les appels relatifs actuels (`fetch('/api/app/check-github-update')`) échouent dans un APK compilé car ils cherchent un serveur local inexistant sur le téléphone.
2. **Blocage CORS** : Le serveur distant AI Studio (`server.ts`) n'autorise pas encore les requêtes Cross-Origin provenant de la WebView d'un APK Android.
3. **Absence d'empreinte figée dans le client (`Client Baked Manifest`)** : Le code React compilé dans l'APK doit conserver en mémoire la liste exacte des fonctionnalités et le hash du code au moment où il a été exporté vers Antigravity, afin de pouvoir les comparer avec les évolutions faites ultérieurement ici dans AI Studio.

---

## 2. Architecture Proposée : Détection Intelligente Multi-Canaux (3 Niveaux)

### A. Manifeste Embarqué & Registre des Fonctionnalités (`src/lib/versionManifest.ts`)
Création d'un module centralisé embarqué dans le build de l'APK contenant :
- **`INSTALLED_APP_VERSION` & `INSTALLED_BUILD_NUMBER`** : Version figée au moment de l'export vers Antigravity.
- **`INSTALLED_FEATURES_MANIFEST`** : Catalogue structuré des fonctionnalités présentes dans l'application (avec identifiant, nom, catégorie et version d'introduction).
- **`MASTER_CLOUD_URL`** : L'URL de production de votre serveur AI Studio (`https://ais-pre-a6qgiudfqqbzdg5nrz5sfr-162483565558.europe-west2.run.app`).
- **Comparateur Différentiel Intelligent** : Compare les fonctionnalités de l'APK installé avec celles du serveur AI Studio pour afficher exactement **quelles nouvelles fonctionnalités** ont été ajoutées ici depuis la création de l'APK.

### B. Canal 1 (Temps Réel & Zéro-Config) : Synchronisation de Release via Firebase Firestore
Puisque votre espace AI Studio et votre APK partagent déjà la même base **Firebase Firestore** :
- Ajout d'une collection dédiée `/appReleases/latest` dans `firestore.rules` (lecture autorisée pour l'application, écriture depuis l'environnement maître / utilisateur authentifié).
- Dès qu'une modification ou une nouvelle fonctionnalité est ajoutée ici dans AI Studio (ou lorsque vous cliquez sur **"Publier vers l'APK"**), l'application met à jour `/appReleases/latest` avec :
  - le nouveau `buildHash` (calculé sur **tous** les fichiers de `src/` et `server.ts`),
  - la liste des **nouvelles fonctionnalités ajoutées** (`features`),
  - les notes de mise à jour (`releaseNotes`),
  - l'URL de téléchargement de l'APK ou du mode Live OTA.
- **Sur votre téléphone (APK)** : Un écouteur temps réel (`onSnapshot`) détecte **instantanément** le changement fait ici dans AI Studio et affiche une notification de mise à jour, même si le serveur est en veille ou que GitHub n'est pas configuré.

### C. Canal 2 (API Distante AI Studio avec CORS) : Scan Dynamique de Tous les Fichiers Source
- **Activation du CORS sur `server.ts`** pour accepter les requêtes provenant de l'APK Android (`capacitor://localhost`, `http://localhost`, etc.).
- **Scan Récursif Complet (`computeCodebaseSignature`)** : Au lieu de ne vérifier que 7 fichiers, `server.ts` scannera automatiquement **tous les fichiers `.ts` et `.tsx`** du dossier `src/` ainsi que `server.ts` et `package.json`. Le moindre ajout d'un composant ou d'une fonctionnalité ici modifiera immédiatement la signature du serveur et la liste des modules détectés.
- **Routage Hybride Client (`src/lib/updateService.ts`)** : Dans l'APK, les requêtes API (Vérification de mise à jour, Conseiller IA, Audit IA) utiliseront automatiquement `MASTER_CLOUD_URL` lorsque l'application détecte qu'elle tourne dans un environnement APK/Antigravity.

### D. Canal 3 : Liaison GitHub (Commits & Releases APK)
- Maintien et enrichissement de la détection des commits GitHub et prise en charge des **GitHub Releases** (détection automatique d'un fichier `.apk` attaché à une Release GitHub s'il existe).

---

## 3. Expérience Utilisateur & Modes de Mise à Jour dans l'APK

1. **Alerte Intelligente de Nouvelles Fonctionnalités (`UpdateNotificationBanner` & `ApkUpdateModal`)** :
   - Affiche clairement : *"Nouveau changement détecté sur AI Studio !"* avec la liste des **nouvelles fonctionnalités ajoutées** (ex: badge `NOUVEAU`) et des fichiers modifiés.
2. **Deux Options de Mise à Jour sur le Téléphone** :
   - **Option 1 — Mise à jour Live / OTA Instantanée (Sans réinstaller l'APK)** : Sauvegarde vos données dans Firestore + LocalStorage et bascule/actualise vers la dernière version Live hébergée afin d'utiliser immédiatement la nouvelle fonctionnalité sur le téléphone.
   - **Option 2 — Téléchargement du Nouvel APK / Export Antigravity** : Permet de télécharger directement le nouveau fichier `.apk` (si un lien APK est renseigné) ou d'exporter le code mis à jour vers Antigravity.
3. **Console "Publier une Mise à Jour vers l'APK" (dans `ApkUpdateModal`)** :
   - Permet depuis AI Studio d'ajouter le titre d'une nouvelle fonctionnalité ou une note de version et de **diffuser en 1 clic** l'alerte de mise à jour vers votre téléphone.

---

## 4. Fichiers qui seront créés ou modifiés après votre confirmation
- `src/lib/versionManifest.ts` *(Nouveau)* : Manifeste embarqué, registre des fonctionnalités, détection de l'environnement APK/Antigravity et comparateur différentiel.
- `server.ts` : Ajout des en-têtes CORS pour l'APK, scan récursif de tous les fichiers `src/` pour détecter tout changement de code/composant, et enrichissement de `/api/app/version` et `/api/app/check-github-update`.
- `firestore.rules` & `src/lib/firebase.ts` : Ajout de la lecture/écriture sécurisée du manifeste `/appReleases/latest` et écouteur temps réel pour l'APK.
- `src/components/ApkUpdateModal.tsx` & `src/components/UpdateNotificationBanner.tsx` : Interface de détection des nouvelles fonctionnalités, console de publication vers l'APK et modes de mise à jour (OTA Live vs APK).
- `src/App.tsx` : Intégration de la détection multi-canaux (Firestore + Serveur Maître AI Studio + GitHub) et routage API intelligent pour l'APK.
