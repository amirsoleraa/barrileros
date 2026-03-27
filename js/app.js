// ═══════════════════════════════════════════════
// app.js — Punto de entrada principal
// ═══════════════════════════════════════════════

import { db } from './firebase.js';
import { setCFG, PRODUCTOS, CATEGORIAS, PEDIDOS, CUPONES, NOVEDADES } from './state.js';
import { applyConfig, hideLoading, toast } from './ui.js';
import { renderCats, renderProds, updateCartUI } from './products.js';
import { renderPedidosBadge, refreshAdmin } from './admin.js';
import {
  getDoc, getDocs, collection, doc, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Importar módulos para que registren sus window.* handlers
import './cart.js';

async function initApp() {
  try {
    // Cargar configuración
    const cfgDoc = await getDoc(doc(db, 'config', 'main'));
    if (cfgDoc.exists()) setCFG(cfgDoc.data());
    applyConfig();

    // Cargar catálogo
    const catSnap  = await getDocs(collection(db, 'categorias'));
    catSnap.forEach(d  => { CATEGORIAS[d.id] = { id: d.id, ...d.data() }; });

    const prodSnap = await getDocs(collection(db, 'productos'));
    prodSnap.forEach(d => { PRODUCTOS[d.id]  = { id: d.id, ...d.data() }; });

    const cupSnap  = await getDocs(collection(db, 'cupones'));
    cupSnap.forEach(d  => { CUPONES[d.id]    = { id: d.id, ...d.data() }; });

    const novSnap  = await getDocs(collection(db, 'novedades'));
    novSnap.forEach(d  => { NOVEDADES[d.id]  = { id: d.id, ...d.data() }; });

    // Renderizar tienda
    renderCats();
    renderProds('todos');
    updateCartUI();

    // Listener en tiempo real para pedidos (panel admin)
    const pedQ = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
    onSnapshot(pedQ, snap => {
      snap.forEach(d => { PEDIDOS[d.id] = { id: d.id, ...d.data() }; });
      snap.docChanges().forEach(ch => { if (ch.type === 'removed') delete PEDIDOS[ch.doc.id]; });
      renderPedidosBadge();
    });

    hideLoading();
  } catch (e) {
    console.error('Error al inicializar la app:', e);
    renderCats();
    renderProds('todos');
    hideLoading();
    toast('⚠️ Sin conexión — modo offline');
  }
}

initApp();
