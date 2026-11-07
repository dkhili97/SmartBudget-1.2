import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { BudgetState, FeatureManifestItem } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connection verification
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or not connected yet.');
    }
    return false;
  }
}

// Google Authentication
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Auth error:', error);
    throw error;
  }
}

// Email Authentication
export async function loginWithEmail(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Email Login error:', error);
    throw error;
  }
}

export async function registerWithEmail(email: string, pass: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Email Register error:', error);
    throw error;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// Firestore Database Sync
export async function saveUserBudgetToFirestore(userId: string, state: BudgetState): Promise<void> {
  const docPath = `userBudgets/${userId}`;
  try {
    const payload = {
      ...state,
      userAccount: {
        ...state.userAccount,
        syncMode: 'cloud',
      },
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(doc(db, 'userBudgets', userId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function loadUserBudgetFromFirestore(userId: string): Promise<BudgetState | null> {
  const docPath = `userBudgets/${userId}`;
  try {
    const docRef = doc(db, 'userBudgets', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as BudgetState;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

export function subscribeToUserBudget(
  userId: string,
  onUpdate: (state: BudgetState) => void,
  onError?: (error: any) => void
) {
  const docPath = `userBudgets/${userId}`;
  const docRef = doc(db, 'userBudgets', userId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as BudgetState);
      }
    },
    (error) => {
      console.error('Real-time Firestore listener error:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}

export interface CloudReleaseManifest {
  version: string;
  buildNumber: number;
  buildHash: string;
  releaseNotes: string[];
  features: FeatureManifestItem[];
  modifiedModules?: string[];
  totalFilesScanned?: number;
  apkDownloadUrl?: string;
  liveWebUrl?: string;
  updatedAt: string;
}

export async function publishReleaseManifestToFirestore(
  manifest: CloudReleaseManifest
): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }
  const docPath = 'appReleases/latest';
  try {
    await setDoc(doc(db, 'appReleases', 'latest'), {
      ...manifest,
      updatedAt: manifest.updatedAt || new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.warn('Could not publish release manifest to Firestore:', error);
    return false;
  }
}

export function subscribeToAppReleaseManifest(
  onReleaseUpdate: (manifest: CloudReleaseManifest) => void,
  onError?: (error: any) => void
) {
  const docRef = doc(db, 'appReleases', 'latest');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onReleaseUpdate(snapshot.data() as CloudReleaseManifest);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export { onAuthStateChanged };
export type { FirebaseUser };
