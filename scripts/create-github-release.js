import fs from 'fs';
import path from 'path';

async function createReleaseAndUploadApk() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  const repo = process.argv[3] || 'dkhili97/SmartBudget-1.2';
  const tag = process.argv[4] || 'v1.6.0';
  const apkPath = fs.existsSync('release-artifacts/SmartBudget.apk')
    ? path.resolve('release-artifacts/SmartBudget.apk')
    : path.resolve('SmartBudget.apk');

  if (!token) {
    console.log('Usage: node scripts/create-github-release.js <GITHUB_TOKEN> [repo] [tag]');
    process.exit(1);
  }

  if (!fs.existsSync(apkPath)) {
    console.error('APK file not found at:', apkPath);
    process.exit(1);
  }

  const apkStats = fs.statSync(apkPath);
  console.log(`Creating GitHub Release ${tag} for ${repo}...`);

  // 1. Create Release
  const releaseRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'SmartBudget-Deployer',
    },
    body: JSON.stringify({
      tag_name: tag,
      name: `SmartBudget ${tag}`,
      body: `### 🌟 SmartBudget ${tag} (Mise à Jour Majeure UX & Hors-Ligne)

- 📱 **Navigation Optimisée (5 Onglets)** : Interface allégée, fluide et ergonomique pour smartphone (Budget, Dépenses, Objectifs, Analyses, Conseiller).
- 🚀 **Guide de Démarrage à Vide** : Assistant interactif d'onboarding permettant de choisir sa devise, son revenu et de démarrer immédiatement avec un budget vierge ou de démonstration.
- ⚡ **Écran de Chargement Simplifié & Minimaliste** : Transition instantanée (~700ms) avec barre de chargement élégante.
- 🔄 **Module de Mise à Jour 100% Automatique** : Écran épuré affichant uniquement la détection automatique et le bouton "Télécharger & Installer".
- 🤖 **Conseiller IA & Diagnostic de Santé Fusionnés** : Score de santé financière, diagnostic mathématique autonome, simulateur "Et si..." et chat IA 100% hors-ligne.
- 💾 **Sauvegarde Locale & Zéro Dépendance Serveur** : Vos données restent strictement sur votre appareil.`,
      draft: false,
      prerelease: false,
    }),
  });

  if (!releaseRes.ok) {
    const errText = await releaseRes.text();
    console.error('Failed to create release:', releaseRes.status, errText);
    process.exit(1);
  }

  const releaseData = await releaseRes.json();
  console.log('Release created successfully! ID:', releaseData.id);
  console.log('Release URL:', releaseData.html_url);

  // 2. Upload APK Asset
  const uploadUrl = releaseData.upload_url.replace('{?name,label}', '?name=SmartBudget.apk');
  console.log(`Uploading ${apkPath} (${(apkStats.size / 1024 / 1024).toFixed(2)} MB)...`);

  const apkBuffer = fs.readFileSync(apkPath);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': apkStats.size.toString(),
      'User-Agent': 'SmartBudget-Deployer',
    },
    body: apkBuffer,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('Failed to upload APK asset:', uploadRes.status, errText);
    process.exit(1);
  }

  const assetData = await uploadRes.json();
  console.log('✅ APK uploaded successfully!');
  console.log('Download URL:', assetData.browser_download_url);
}

createReleaseAndUploadApk().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
