import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let externalApp: FirebaseApp | null = null;
let externalDb: Firestore | null = null;

const externalConfig = {
  apiKey: import.meta.env.VITE_EXTERNAL_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_EXTERNAL_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_EXTERNAL_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_EXTERNAL_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_EXTERNAL_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_EXTERNAL_FIREBASE_APP_ID,
};

const envDatabaseId = import.meta.env.VITE_EXTERNAL_FIREBASE_DATABASE_ID;
// If the database ID is the same as the project ID, it's likely a misconfiguration 
const effectiveDatabaseId = (!envDatabaseId || envDatabaseId === externalConfig.projectId) ? '(default)' : envDatabaseId;

export function getExternalDb(): Firestore | null {
  // Only try to initialize if we have the minimum required config
  if (!externalConfig.apiKey || !externalConfig.projectId) {
    return null;
  }

  try {
    if (!externalApp) {
      const appName = 'external-benefit-system';
      if (getApps().find(app => app.name === appName)) {
        externalApp = getApp(appName);
      } else {
        externalApp = initializeApp(externalConfig, appName);
      }
      externalDb = getFirestore(externalApp, effectiveDatabaseId);
    }
    return externalDb;
  } catch (error) {
    console.warn("Could not connect to external Firebase:", error);
    return null;
  }
}
