// ═══════════════════════════════════════════════
// firebase.js — Configuración e inicialización
// ═══════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const FB = {
  apiKey:            "AIzaSyCv9Vh-5vrQGP-N73s8iN5dyLe9u1xf83U",
  authDomain:        "asados-barril.firebaseapp.com",
  projectId:         "asados-barril",
  storageBucket:     "asados-barril.firebasestorage.app",
  messagingSenderId: "1039961774178",
  appId:             "1:1039961774178:web:df5454c07fa0d447eb993b"
};

const app = initializeApp(FB);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export const auth    = getAuth(app);
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
