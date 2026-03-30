// ═══════════════════════════════════════════════
// app.js — Punto de entrada (cliente)
// ═══════════════════════════════════════════════

import { db, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';
import { setCFG, PRODUCTOS, CATEGORIAS, PEDIDOS, CUPONES, NOVEDADES } from './state.js';
import { applyConfig, hideLoading, toast } from './ui.js';
import { renderCats, renderProds, updateCartUI } from './products.js';
import {
  getDoc, getDocs, collection, doc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import './cart.js';

// ── LOGIN ──
const $ = id => document.getElementById(id);

window.doLogin = async function () {
  const email = $('login-email').value.trim();
  const pass  = $('login-pass').value;
  const err   = $('login-err');
  const btn   = $('login-btn');
  err.textContent = '';
  if (!email || !pass) { err.textContent = 'Completa todos los campos'; return; }
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    const msgs = {
      'auth/invalid-credential': 'Correo o contraseña incorrectos',
      'auth/user-not-found':     'Correo o contraseña incorrectos',
      'auth/wrong-password':     'Correo o contraseña incorrectos',
      'auth/invalid-email':      'Correo electrónico inválido',
      'auth/too-many-requests':  'Demasiados intentos. Intenta más tarde',
    };
    err.textContent = msgs[e.code] || 'Error al ingresar. Intenta de nuevo.';
  }
  btn.disabled = false; btn.textContent = 'Ingresar';
};

// Permitir Enter en los inputs de login
document.addEventListener('DOMContentLoaded', () => {
  ['login-email','login-pass'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); });
  });
});

// ── AUTH STATE ──
onAuthStateChanged(auth, async user => {
  if (user) {
    // Sesión activa → cargar app
    $('view-login')?.classList.remove('active');
    await initApp();
  } else {
    // Sin sesión → mostrar login
    hideLoadingScreen();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    $('view-login')?.classList.add('active');
  }
});

function hideLoadingScreen() {
  const ls = $('loading-screen');
  if (!ls) return;
  ls.style.opacity = '0';
  ls.style.transition = 'opacity .4s';
  setTimeout(() => ls.style.display = 'none', 400);
}

async function initApp() {
  try {
    const cfgDoc = await getDoc(doc(db, 'config', 'main'));
    if (cfgDoc.exists()) setCFG(cfgDoc.data());
    applyConfig();

    const catSnap  = await getDocs(collection(db, 'categorias'));
    catSnap.forEach(d  => { CATEGORIAS[d.id] = { id: d.id, ...d.data() }; });

    const prodSnap = await getDocs(collection(db, 'productos'));
    prodSnap.forEach(d => { PRODUCTOS[d.id]  = { id: d.id, ...d.data() }; });

    const cupSnap  = await getDocs(collection(db, 'cupones'));
    cupSnap.forEach(d  => { CUPONES[d.id]    = { id: d.id, ...d.data() }; });

    const novSnap  = await getDocs(collection(db, 'novedades'));
    novSnap.forEach(d  => { NOVEDADES[d.id]  = { id: d.id, ...d.data() }; });

    renderCats();
    renderProds('todos');
    updateCartUI();

    hideLoading();
    showView('view-home');
  } catch (e) {
    console.error('Error al inicializar la app:', e);
    renderCats();
    renderProds('todos');
    hideLoading();
    showView('view-home');
    toast('⚠️ Sin conexión — modo offline');
  }
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = $(id);
  if (el) el.classList.add('active');
}
