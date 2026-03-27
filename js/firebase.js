// ═══════════════════════════════════════════════
// firebase.js — Configuración e inicialización
// ═══════════════════════════════════════════════
// ⚠️  IMPORTANTE: Reemplaza los valores de FB con
//     los de TU proyecto en la consola de Firebase.
//     Ve a: Firebase Console → Configuración del proyecto → Tus apps
// ═══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const FB = {
  apiKey:            "PEGA_AQUI_TU_API_KEY",
  authDomain:        "PEGA_AQUI_TU_AUTH_DOMAIN",
  projectId:         "PEGA_AQUI_TU_PROJECT_ID",
  storageBucket:     "PEGA_AQUI_TU_STORAGE_BUCKET",
  messagingSenderId: "PEGA_AQUI_TU_SENDER_ID",
  appId:             "PEGA_AQUI_TU_APP_ID"
};

const app     = initializeApp(FB);
export const db      = getFirestore(app);
export const storage = getStorage(app);
