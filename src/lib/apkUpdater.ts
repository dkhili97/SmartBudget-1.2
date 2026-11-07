import { Capacitor, registerPlugin } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export interface ApkInstallerPluginType {
  checkInstallPermission(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; filename?: string }): Promise<{ success: boolean; message: string }>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginType>('ApkInstaller');

export interface GitHubReleaseInfo {
  hasUpdate: boolean;
  tagName: string;
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  apkDownloadUrl: string;
  htmlUrl: string;
}

/**
 * Compare deux versions (ex: "1.6.8" vs "1.6.0", "v1.6.0-build.5" vs "1.6.0", ou "1.6.0" vs "1.5.1")
 * Retourne true si remoteVersion > currentVersion
 */
export function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  if (!remoteVersion || !currentVersion) return false;

  const cleanRemote = remoteVersion.replace(/^v/i, '').trim();
  const cleanCurrent = currentVersion.replace(/^v/i, '').trim();

  if (cleanRemote === cleanCurrent) return false;

  const parseParts = (v: string): number[] => {
    return v
      .split(/[\.\-_]/)
      .map((part) => parseInt(part, 10))
      .filter((n) => !isNaN(n));
  };

  const remoteParts = parseParts(cleanRemote);
  const currentParts = parseParts(cleanCurrent);

  const length = Math.max(remoteParts.length, currentParts.length);
  for (let i = 0; i < length; i++) {
    const r = remoteParts[i] ?? 0;
    const c = currentParts[i] ?? 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  // Si les chiffres sont identiques mais le tag distant a un build suffix différent
  return cleanRemote !== cleanCurrent && cleanRemote.length > cleanCurrent.length;
}

/**
 * Vérifie directement auprès de l'API GitHub si une nouvelle Release APK est disponible.
 * Scanne l'ensemble des releases récentes pour trouver la version la plus haute avec un APK.
 */
export async function checkGitHubReleases(
  currentVersion: string,
  repo: string = 'dkhili97/SmartBudget-1.2'
): Promise<GitHubReleaseInfo | null> {
  const cleanRepo = repo
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .trim() || 'dkhili97/SmartBudget-1.2';

  const defaultApkUrl = `https://github.com/${cleanRepo}/releases/latest/download/SmartBudget.apk`;

  try {
    // 1. Essayer de récupérer la liste des releases pour trouver la version la plus haute
    const listRes = await fetch(`https://api.github.com/repos/${cleanRepo}/releases?per_page=10`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let releasesList: any[] = [];
    if (listRes.ok) {
      releasesList = await listRes.json();
    } else {
      // Fallback vers /releases/latest
      const latestRes = await fetch(`https://api.github.com/repos/${cleanRepo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
      if (latestRes.ok) {
        releasesList = [await latestRes.json()];
      }
    }

    if (!Array.isArray(releasesList) || releasesList.length === 0) {
      console.warn('No GitHub releases found for repo:', cleanRepo);
      return null;
    }

    // Trouver la release avec la version la plus élevée
    let bestRelease = releasesList[0];
    let bestVersion = (bestRelease.tag_name || '').replace(/^v/i, '');

    for (const rel of releasesList) {
      const relVer = (rel.tag_name || '').replace(/^v/i, '');
      if (isNewerVersion(relVer, bestVersion)) {
        bestRelease = rel;
        bestVersion = relVer;
      }
    }

    const tagName = bestRelease.tag_name || 'v1.6.0';
    const version = bestVersion || tagName.replace(/^v/i, '');

    // Trouver l'asset APK attaché à cette release
    const apkAsset = Array.isArray(bestRelease.assets)
      ? bestRelease.assets.find((asset: any) => asset.name && asset.name.toLowerCase().endsWith('.apk'))
      : null;

    const apkDownloadUrl = apkAsset
      ? apkAsset.browser_download_url
      : `https://github.com/${cleanRepo}/releases/download/${tagName}/SmartBudget.apk` || defaultApkUrl;

    const hasUpdate = isNewerVersion(version, currentVersion);

    return {
      hasUpdate,
      tagName,
      version,
      name: bestRelease.name || tagName,
      body: bestRelease.body || 'Nouvelle version de SmartBudget disponible.',
      publishedAt: bestRelease.published_at || new Date().toISOString(),
      apkDownloadUrl,
      htmlUrl: bestRelease.html_url || `https://github.com/${cleanRepo}/releases`,
    };
  } catch (err) {
    console.warn('Failed to check GitHub releases:', err);
    return null;
  }
}

/**
 * Déclenche le téléchargement et l'installation automatique de l'APK.
 * - Sur Android natif : télécharge l'APK et lance l'intent système d'installation.
 * - Sur le Web / fallback : ouvre directement l'URL de téléchargement.
 */
export async function triggerApkDownloadAndInstall(
  apkUrl: string,
  onProgress?: (status: string) => void
): Promise<{ success: boolean; message: string }> {
  if (!apkUrl) {
    throw new Error("L'URL de téléchargement de l'APK est introuvable.");
  }

  if (Capacitor.isNativePlatform()) {
    try {
      if (onProgress) onProgress("Vérification des autorisations système...");

      // Vérifier si l'autorisation d'installer des sources inconnues est accordée
      try {
        const perm = await ApkInstaller.checkInstallPermission();
        if (!perm.canInstall) {
          if (onProgress) onProgress("Veuillez autoriser l'installation dans les Paramètres Android...");
          await ApkInstaller.openInstallPermissionSettings();
        }
      } catch (permErr) {
        console.warn('Permission check notice:', permErr);
      }

      if (onProgress) onProgress("Téléchargement du nouvel APK SmartBudget...");
      const result = await ApkInstaller.downloadAndInstall({
        url: apkUrl,
        filename: 'SmartBudget-update.apk',
      });

      if (onProgress) onProgress("Lancement de l'installateur de paquets...");
      return result;
    } catch (nativeErr: any) {
      console.warn('Native installer error, trying system browser fallback:', nativeErr);
      if (onProgress) onProgress("Ouverture du téléchargement dans le navigateur...");
      await Browser.open({ url: apkUrl });
      return { success: true, message: 'Ouverture du téléchargement dans le navigateur' };
    }
  } else {
    // Mode Web / PWA
    window.open(apkUrl, '_blank');
    return { success: true, message: 'Téléchargement lancé dans le navigateur' };
  }
}
