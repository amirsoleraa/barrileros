// ═══════════════════════════════════════════════
// lib/firebase.ts — Firebase init con VITE_* env vars
// ═══════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Definite-assignment assertions: guarded by firebaseReady before any use
export let db!:      Firestore;
export let storage!: FirebaseStorage;
export let auth!:    Auth;
// Isolated app for domiciliario portal so admin and dom sessions don't collide
export let domAuth!: Auth;
export let domDb!:   Firestore;

/** true sólo cuando Firebase se inicializó correctamente con credenciales reales */
export let firebaseReady = false;

try {
  const offlineCache = { localCache: persistentLocalCache() };

  const app = initializeApp(firebaseConfig);
  db      = initializeFirestore(app, offlineCache);
  storage = getStorage(app);
  auth    = getAuth(app);

  const domApp = initializeApp(firebaseConfig, 'domiciliario');
  domAuth = getAuth(domApp);
  domDb   = initializeFirestore(domApp, offlineCache);

  firebaseReady = true;
} catch (e) {
  console.warn('[Firebase] Sin credenciales — la app corre en modo sin conexión.');
}
