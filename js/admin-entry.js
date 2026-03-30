// ═══════════════════════════════════════════════
// admin-entry.js — Punto de entrada (admin)
// ═══════════════════════════════════════════════

import { db, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase.js';
import { setCFG, PRODUCTOS, CATEGORIAS, PEDIDOS, CUPONES, NOVEDADES } from './state.js';
import { applyConfig, toast } from './ui.js';
import { renderCats } from './products.js';
import { refreshAdmin, renderPedidosBadge } from './admin.js';
import {
  getDoc, getDocs, collection, doc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const $ = id => document.getElementById(id);

// ── LOGIN ADMIN ──
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

window.logoutAdmin = async function () {
  await signOut(auth);
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
  const loginView = $('view-login');
  const adminView = $('view-admin');
  const loading   = $('loading-screen');

  if (user) {
    if (loginView) loginView.classList.remove('active');
    if (loading) { loading.style.opacity='0'; loading.style.transition='opacity .4s'; setTimeout(()=>loading.style.display='none',400); }
    await initAdminApp();
    if (adminView) { adminView.classList.add('active'); }
    refreshAdmin();
  } else {
    if (loading) { loading.style.opacity='0'; loading.style.transition='opacity .4s'; setTimeout(()=>loading.style.display='none',400); }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (loginView) loginView.classList.add('active');
  }
});

async function initAdminApp() {
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

    const pedQ = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    onSnapshot(pedQ, snap => {
      snap.forEach(d => { PEDIDOS[d.id] = { id: d.id, ...d.data() }; });
      snap.docChanges().forEach(ch => { if (ch.type === 'removed') delete PEDIDOS[ch.doc.id]; });
      renderPedidosBadge();
    });
  } catch (e) {
    console.error('Error al inicializar admin:', e);
    toast('⚠️ Error al cargar datos');
  }
}
