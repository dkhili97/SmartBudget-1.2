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
  apkDownloadUrl?: string;
  htmlUrl: string;
}

/**
 * Compare deux versions (ex: "1.5.1" vs "1.5.0", ou "v1.5.1" vs "1.5.0")
 * Retourne true si remoteVersion > currentVersion
 */
export function isNewerVersion(remoteVersion: string, currentVersion: string): boolean {
  const cleanRemote = remoteVersion.replace(/^v/i, '').trim();
  const cleanCurrent = currentVersion.replace(/^v/i, '').trim();

  if (cleanRemote === cleanCurrent) return false;

  const remoteParts = cleanRemote.split('.').map((p) => parseInt(p, 10) || 0);
  const currentParts = cleanCurrent.split('.').map((p) => parseInt(p, 10) || 0);

  const length = Math.max(remoteParts.length, currentParts.length);
  for (let i = 0; i < length; i++) {
    const r = remoteParts[i] || 0;
    const c = currentParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }

  return cleanRemote !== cleanCurrent;
}

/**
 * Vérifie directement auprès de l'API GitHub si une nouvelle Release APK est disponible.
 */
export async function checkGitHubReleases(
  currentVersion: string,
  repo: string = 'dkhili97/SmartBudget-1.2'
): Promise<GitHubReleaseInfo | null> {
  const cleanRepo = repo
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .trim();

  const apiUrl = `https://api.github.com/repos/${cleanRepo}/releases/latest`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.warn('No GitHub releases published yet for repo:', cleanRepo);
        return null;
      }
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    const release = await res.json();
    const tagName = release.tag_name || '';
    const version = tagName.replace(/^v/i, '');

    // Trouver l'asset APK dans les fichiers attachés à la release
    const apkAsset = Array.isArray(release.assets)
      ? release.assets.find((asset: any) => asset.name && asset.name.toLowerCase().endsWith('.apk'))
      : null;

    const hasUpdate = isNewerVersion(version, currentVersion);

    return {
      hasUpdate,
      tagName,
      version,
      name: release.name || tagName,
      body: release.body || 'Nouvelle version de SmartBudget disponible.',
      publishedAt: release.published_at || new Date().toISOString(),
      apkDownloadUrl: apkAsset ? apkAsset.browser_download_url : undefined,
      htmlUrl: release.html_url || `https://github.com/${cleanRepo}/releases`,
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
      if (onProgress) onProgress("Vérification des autorisations d'installation...");

      // Vérifier si l'autorisation d'installer des sources inconnues est accordée
      try {
        const perm = await ApkInstaller.checkInstallPermission();
        if (!perm.canInstall) {
          if (onProgress) onProgress("Demande d'autorisation système...");
          await ApkInstaller.openInstallPermissionSettings();
        }
      } catch (permErr) {
        console.warn('Permission check skipped/failed:', permErr);
      }

      if (onProgress) onProgress("Téléchargement de l'APK SmartBudget en cours...");
      const result = await ApkInstaller.downloadAndInstall({
        url: apkUrl,
        filename: 'SmartBudget-update.apk',
      });

      return result;
    } catch (nativeErr: any) {
      console.warn('Native installer error, falling back to Browser:', nativeErr);
      // Fallback si erreur native
      await Browser.open({ url: apkUrl });
      return { success: true, message: 'Ouverture du téléchargement dans le navigateur' };
    }
  } else {
    // Mode Web classique
    window.open(apkUrl, '_blank');
    return { success: true, message: 'Téléchargement lancé dans le navigateur' };
  }
}

