// ═══════════════════════════════════════════════
// lib/firebase.ts — Firebase init con VITE_* env vars
// ═══════════════════════════════════════════════

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// App Check (reCAPTCHA v3): exige un token válido para leer/escribir en
// Firestore, para frenar bots/scripts que abusen de pedidos o cupones sin
// necesitar login. Opcional — sin VITE_RECAPTCHA_SITE_KEY, la app funciona
// igual, solo sin esta capa extra. Ver SECURITY.md para activarlo.
function setupAppCheck(app: FirebaseApp): void {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) return;
  if (import.meta.env.DEV) {
    // En desarrollo local, usa un token de depuración en vez de resolver
    // el challenge real (regístralo en Firebase Console si haces enforce).
    (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

try {
  const offlineCache = { localCache: persistentLocalCache() };

  const app = initializeApp(firebaseConfig);
  setupAppCheck(app);
  db      = initializeFirestore(app, offlineCache);
  storage = getStorage(app);
  auth    = getAuth(app);

  const domApp = initializeApp(firebaseConfig, 'domiciliario');
  setupAppCheck(domApp);
  domAuth = getAuth(domApp);
  domDb   = initializeFirestore(domApp, offlineCache);

  firebaseReady = true;
} catch (e) {
  console.warn('[Firebase] Sin credenciales — la app corre en modo sin conexión.');
}
