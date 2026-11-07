import { FeatureManifestItem } from '../types';

export const INSTALLED_APP_VERSION = '1.5.0';
export const INSTALLED_BUILD_NUMBER = 150;
export const DEFAULT_MASTER_CLOUD_URL =
  'https://ais-pre-a6qgiudfqqbzdg5nrz5sfr-162483565558.europe-west2.run.app';

/**
 * Registre des fonctionnalités embarquées dans le code au moment de l'export vers Antigravity (APK).
 * Lorsqu'une nouvelle fonctionnalité est ajoutée dans AI Studio, l'APK compare sa liste locale
 * avec celle du serveur AI Studio / Firestore pour afficher exactement les nouveautés ajoutées.
 */
export const INSTALLED_FEATURES_MANIFEST: FeatureManifestItem[] = [
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

export type RuntimeEnvironmentType = 'apk_native' | 'pwa_standalone' | 'aistudio_cloud';

export interface RuntimeEnvironmentInfo {
  type: RuntimeEnvironmentType;
  label: string;
  isApkOrHybrid: boolean;
  origin: string;
  masterServerUrl: string;
}

/**
 * Détecte intelligemment si l'application tourne dans un APK compilé (via Antigravity / Capacitor / WebView),
 * en mode PWA installée sur mobile, ou directement sur le serveur Cloud AI Studio.
 */
export function detectRuntimeEnvironment(customMasterUrl?: string): RuntimeEnvironmentInfo {
  const masterServerUrl = (customMasterUrl || DEFAULT_MASTER_CLOUD_URL).replace(/\/+$/, '');

  if (typeof window === 'undefined') {
    return {
      type: 'aistudio_cloud',
      label: 'Serveur Cloud AI Studio',
      isApkOrHybrid: false,
      origin: masterServerUrl,
      masterServerUrl,
    };
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  const ua = navigator.userAgent || '';

  const isCapacitorOrCordova =
    protocol === 'capacitor:' ||
    protocol === 'ionic:' ||
    protocol === 'file:' ||
    Boolean((window as any).Capacitor) ||
    Boolean((window as any).cordova) ||
    Boolean((window as any).AndroidBridge);

  const isAndroidWebView = /wv|Android.*Version\/[0-9.]+/i.test(ua);
  const isLocalhostWithoutDevPort =
    (hostname === 'localhost' || hostname === '127.0.0.1') && port !== '3000' && port !== '5173';

  if (isCapacitorOrCordova || isAndroidWebView || isLocalhostWithoutDevPort) {
    return {
      type: 'apk_native',
      label: 'Application APK Android (Antigravity)',
      isApkOrHybrid: true,
      origin: window.location.origin,
      masterServerUrl,
    };
  }

  const isStandalonePwa =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalonePwa) {
    return {
      type: 'pwa_standalone',
      label: 'Application Mobile Installée (PWA)',
      isApkOrHybrid: false,
      origin: window.location.origin,
      masterServerUrl,
    };
  }

  return {
    type: 'aistudio_cloud',
    label: 'Environnement Maître AI Studio (Web)',
    isApkOrHybrid: false,
    origin: window.location.origin,
    masterServerUrl,
  };
}

/**
 * Résout automatiquement l'URL d'appel API :
 * - Si l'application tourne dans l'APK Antigravity (sans serveur Express local), cible directement le serveur maître AI Studio.
 * - Si l'application tourne sur le serveur AI Studio, utilise le chemin local relatif.
 */
export function resolveApiUrl(endpointPath: string, customMasterUrl?: string): string {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const env = detectRuntimeEnvironment(customMasterUrl);

  if (env.isApkOrHybrid) {
    return `${env.masterServerUrl}${cleanPath}`;
  }
  return cleanPath;
}

/**
 * Effectue un appel fetch intelligent : essaie d'abord l'URL résolue, et en cas d'échec ou de 404
 * (par exemple dans un wrapper APK ou WebView), bascule automatiquement sur le serveur maître AI Studio distant.
 */
export async function fetchWithMasterFallback(
  endpointPath: string,
  options?: RequestInit,
  customMasterUrl?: string
): Promise<Response> {
  const cleanPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const env = detectRuntimeEnvironment(customMasterUrl);
  const primaryUrl = env.isApkOrHybrid ? `${env.masterServerUrl}${cleanPath}` : cleanPath;

  try {
    const res = await fetch(primaryUrl, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return res;
    }
    // Si on reçoit une page HTML (fallback SPA dans un APK statique) au lieu du JSON de l'API, basculer sur le serveur maître
    if (!env.isApkOrHybrid && (!res.ok || !contentType.includes('application/json'))) {
      const remoteUrl = `${env.masterServerUrl}${cleanPath}`;
      return await fetch(remoteUrl, { ...options, mode: 'cors' });
    }
    return res;
  } catch (primaryErr) {
    if (!env.isApkOrHybrid) {
      const remoteUrl = `${env.masterServerUrl}${cleanPath}`;
      return await fetch(remoteUrl, { ...options, mode: 'cors' });
    }
    throw primaryErr;
  }
}

/**
 * Compare la liste des fonctionnalités distantes (AI Studio / Firestore) avec les fonctionnalités
 * embarquées dans l'APK installé pour identifier les nouvelles fonctionnalités ajoutées.
 */
export function computeFeatureDiff(
  remoteFeatures: FeatureManifestItem[] = [],
  installedFeatureIds?: string[]
): FeatureManifestItem[] {
  const baselineIds = new Set(
    installedFeatureIds && installedFeatureIds.length > 0
      ? installedFeatureIds
      : INSTALLED_FEATURES_MANIFEST.map((f) => f.id)
  );

  return remoteFeatures
    .filter((feat) => !baselineIds.has(feat.id))
    .map((feat) => ({ ...feat, isNew: true }));
}
