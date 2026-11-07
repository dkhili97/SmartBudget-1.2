import fs from 'fs';
import path from 'path';

async function createReleaseAndUploadApk() {
  const token = process.env.GITHUB_TOKEN || process.argv[2];
  const repo = process.argv[3] || 'dkhili97/SmartBudget-1.2';
  const tag = process.argv[4] || 'v1.5.1';
  const apkPath = path.resolve('SmartBudget.apk');

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
      body: `### 🚀 SmartBudget ${tag} (Version 100% Hors-Ligne)

- ✨ **Écran de chargement animé (Splash Screen)**
- 💎 **Nouveau logo officiel & icônes Android adaptatives**
- ⚡ **Conseiller financier et audit mathématique 100% hors-ligne**
- 📲 **Système de mise à jour automatique intégré**`,
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
});
