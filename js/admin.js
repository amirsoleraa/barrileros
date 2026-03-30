// ═══════════════════════════════════════════════
// admin.js — Panel de administración completo
// ═══════════════════════════════════════════════

import { $, fmtPrice, toast, goTo, openModal, closeModal, isOn, toggleEl, applyConfig } from './ui.js';
import {
  CFG, setCFG,
  PRODUCTOS, CATEGORIAS, PEDIDOS, CUPONES, NOVEDADES,
  activePedidoTab, setActivePedidoTab,
  pedidosFiltro, setPedidosFiltro,
  productosFiltro, setProductosFiltro,
  sidebarCollapsed, setSidebarCollapsed,
  pendingLogoFile, setPendingLogoFile,
  pendingProdImgFile, setPendingProdImgFile,
  tmpIngrTags, setTmpIngrTags,
  tmpExtTags, setTmpExtTags
} from './state.js';
import { renderCats, renderProds } from './products.js';
import { db, storage } from './firebase.js';
import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// ── PIN ──
let pinVal = '';
window.openAdmin = function () { pinVal = ''; updatePinDots(); $('pin-screen').style.display = 'flex'; };
window.logoutAdmin = function () { goTo('view-home'); };
window.pinKey = function (k) {
  if (pinVal.length >= 6) return;
  pinVal += k; updatePinDots();
  if (pinVal.length === 6) checkPin();
};
window.pinDel = function () { pinVal = pinVal.slice(0, -1); updatePinDots(); };

function updatePinDots() {
  document.querySelectorAll('.pin-dot').forEach((d, i) => d.classList.toggle('filled', i < pinVal.length));
}
function checkPin() {
  if (pinVal === (CFG.pinAdmin || '123456')) {
    $('pin-screen').style.display = 'none';
    goTo('view-admin');
    refreshAdmin();
  } else {
    $('pin-err').classList.add('show');
    setTimeout(() => { $('pin-err').classList.remove('show'); pinVal = ''; updatePinDots(); }, 1500);
  }
}

// ── NAVEGACIÓN ADMIN ──
export function refreshAdmin() {
  renderPedidosTable(); renderProductosAdmin(); renderCatsAdmin();
  renderDashboard(); renderCupones(); renderNovedades();
  renderSeguimiento(); applyConfig();
}

window.aPanel = function (name, el) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const panel = $('panel-' + name);
  if (panel) panel.classList.add('active');
  const titles = { pedidos: 'Pedidos', productos: 'Productos', categorias: 'Categorías', dashboard: 'Dashboard', seguimiento: 'Seguimiento', novedades: 'Novedades', domicilio: 'Domicilio', descuentos: 'Descuentos', colores: '🎨 Colores del tema', config: 'Configuración' };
  $('a-title').textContent = titles[name] || name;
  if (name === 'pedidos')    renderPedidosTable();
  if (name === 'productos')  renderProductosAdmin();
  if (name === 'categorias') renderCatsAdmin();
  if (name === 'dashboard')  renderDashboard();
  if (name === 'seguimiento')renderSeguimiento();
  if (name === 'novedades')  renderNovedades();
  if (name === 'descuentos') renderCupones();
  if (name === 'config')     applyConfig();
  if (name === 'colores')    initColorEditor();
  closeMobSidebar();
};

// ── SIDEBAR PIN (hover-expand / fixed) ──
window.toggleSidebarPin = function () {
  const sb = $('admin-sidebar');
  const pinned = sb.classList.toggle('pinned');
  const btn = $('sb-pin-btn');
  if (btn) btn.title = pinned ? 'Desfijar menú' : 'Fijar menú';
  localStorage.setItem('sb-pinned', pinned ? '1' : '0');
};
// Restore pin state on load
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('sb-pinned') === '1') {
    const sb = $('admin-sidebar');
    if (sb) { sb.classList.add('pinned'); const btn = $('sb-pin-btn'); if (btn) btn.title = 'Desfijar menú'; }
  }
});
window.toggleSidebar   = window.toggleSidebarPin; // legacy compat
window.openMobSidebar  = function () { $('admin-sidebar').classList.add('mob-open'); $('mob-overlay').classList.add('open'); };
window.closeMobSidebar = function () { $('admin-sidebar').classList.remove('mob-open'); $('mob-overlay').classList.remove('open'); };

// ══════════════════════════════════════════════
// COLOR THEME EDITOR
// ══════════════════════════════════════════════
const COLOR_VARS = ['--brand','--brand-dark','--brand-light','--bg','--text','--accent'];
const COLOR_INPUT_MAP = {
  '--brand':       { input: 'ci-brand',      dot: 'cp-brand' },
  '--brand-dark':  { input: 'ci-brand-dark', dot: 'cp-brand-dark' },
  '--brand-light': { input: 'ci-brand-light',dot: 'cp-brand-light' },
  '--bg':          { input: 'ci-bg',         dot: 'cp-bg' },
  '--text':        { input: 'ci-text',       dot: 'cp-text' },
  '--accent':      { input: 'ci-accent',     dot: 'cp-accent' },
};

const PRESETS = {
  fuego:  { '--brand':'#B22000','--brand-dark':'#4D1A00','--brand-light':'#fdf0e8','--bg':'#FDF8F3','--text':'#4D1A00','--accent':'#D89D5D' },
  carbon: { '--brand':'#E63E11','--brand-dark':'#9A2000','--brand-light':'#2a1a14','--bg':'#1a1a1a','--text':'#f0e8e0','--accent':'#FF6B3D' },
  selva:  { '--brand':'#1B6B3A','--brand-dark':'#0D3D21','--brand-light':'#E8F5EC','--bg':'#F0F8F2','--text':'#0D3D21','--accent':'#5DAD6F' },
  noche:  { '--brand':'#7C3AED','--brand-dark':'#4C1D95','--brand-light':'#1e1530','--bg':'#0f0f18','--text':'#e8e0f8','--accent':'#A78BFA' },
  ocean:  { '--brand':'#0369A1','--brand-dark':'#01344F','--brand-light':'#E0F2FE','--bg':'#F0F9FF','--text':'#01344F','--accent':'#38BDF8' },
};

function getCSSVar(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function rgbToHex(str) {
  // Handles both #hex and rgb(...)
  if (!str) return '#000000';
  if (str.startsWith('#')) { if (str.length === 4) return '#' + str[1]+str[1]+str[2]+str[2]+str[3]+str[3]; return str; }
  const m = str.match(/\d+/g);
  if (!m || m.length < 3) return '#000000';
  return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
}

window.initColorEditor = function () {
  COLOR_VARS.forEach(v => {
    const map = COLOR_INPUT_MAP[v];
    if (!map) return;
    const hex = rgbToHex(getCSSVar(v));
    const inp = $(map.input);
    const dot = $(map.dot);
    if (inp) inp.value = hex;
    if (dot) dot.style.background = hex;
  });
};

window.liveColor = function (cssVar, val, inputId, dotId) {
  document.documentElement.style.setProperty(cssVar, val);
  const dot = $(dotId);
  if (dot) dot.style.background = val;
  // Deselect presets
  document.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
};

window.applyPreset = function (btn, name) {
  const preset = PRESETS[name];
  if (!preset) return;
  document.querySelectorAll('.theme-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  Object.entries(preset).forEach(([v, val]) => {
    document.documentElement.style.setProperty(v, val);
    const map = COLOR_INPUT_MAP[v];
    if (!map) return;
    const inp = $(map.input);
    const dot = $(map.dot);
    if (inp) inp.value = val;
    if (dot) dot.style.background = val;
  });
};

window.saveColores = async function () {
  const colores = {};
  COLOR_VARS.forEach(v => {
    colores[v.replace('--','')] = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  });
  try {
    const { doc: fsDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    await setDoc(fsDoc(db, 'config', 'colores'), colores);
    toast('🎨 Colores guardados');
  } catch(e) {
    // Fallback: save to localStorage for offline/demo
    localStorage.setItem('theme-colors', JSON.stringify(colores));
    toast('🎨 Colores guardados (local)');
  }
};

window.resetColores = function () {
  applyPreset(document.querySelector('[data-preset="fuego"]'), 'fuego');
  toast('↺ Colores restablecidos');
};

// Load saved colors on init
async function loadSavedColors() {
  try {
    const { getDoc: fsGetDoc, doc: fsDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await fsGetDoc(fsDoc(db, 'config', 'colores'));
    if (snap.exists()) {
      const data = snap.data();
      Object.entries(data).forEach(([k, v]) => {
        document.documentElement.style.setProperty('--' + k, v);
      });
      return;
    }
  } catch(e) { /* ignore */ }
  // Fallback localStorage
  try {
    const saved = localStorage.getItem('theme-colors');
    if (saved) {
      const data = JSON.parse(saved);
      Object.entries(data).forEach(([k, v]) => {
        document.documentElement.style.setProperty('--' + k, v);
      });
    }
  } catch(e) { /* ignore */ }
}
loadSavedColors();

// ── PEDIDOS ──
export function renderPedidosBadge() {
  const activos = Object.values(PEDIDOS).filter(p => p.estado === 'activos').length;
  const badge = $('n-badge');
  if (activos > 0) { badge.style.display = ''; badge.textContent = activos; }
  else badge.style.display = 'none';
}

window.pTab = function (tab, el) {
  setActivePedidoTab(tab);
  document.querySelectorAll('#panel-pedidos .admin-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const titles = { activos: 'Pedidos activos', preparando: 'En preparación', camino: 'En camino', entregado: 'Entregados', cancelado: 'Cancelados' };
  $('p-tab-title').textContent = titles[tab] || tab;
  renderPedidosTable();
};

window.filterPedidos = function (val) { setPedidosFiltro(val.toLowerCase()); renderPedidosTable(); };

function renderPedidosTable() {
  const tbody = $('p-tbody');
  let pedidos = Object.values(PEDIDOS).filter(p => p.estado === activePedidoTab);
  if (pedidosFiltro) pedidos = pedidos.filter(p => (p.cliente?.nombre || '').toLowerCase().includes(pedidosFiltro) || (p.numero || '').toLowerCase().includes(pedidosFiltro));
  pedidos.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (!pedidos.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text3);">No hay pedidos</td></tr>`; return; }
  const statusMap = { activos: ['sp sp-a', 'Activo'], preparando: ['sp sp-p', 'Preparando'], camino: ['sp sp-c', 'En camino'], entregado: ['sp sp-e', 'Entregado'], cancelado: ['sp sp-x', 'Cancelado'] };
  tbody.innerHTML = pedidos.map(p => {
    const [cls, lbl] = statusMap[p.estado] || ['sp', '—'];
    const items = (p.items || []).map(i => `${i.nombre} x${i.qty}`).join(', ');
    return `<tr>
      <td><strong>${p.numero || p.id.slice(-6)}</strong></td>
      <td>${p.cliente?.nombre || '—'}<br><small style="color:var(--text3)">${p.cliente?.tel || ''}</small></td>
      <td style="max-width:160px;font-size:12px;">${items}</td>
      <td><strong>${fmtPrice(p.total || 0)}</strong></td>
      <td><span class="${cls}">${lbl}</span></td>
      <td style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="ab ab-b" onclick="verPedido('${p.id}')">Ver</button>
        <button class="ab ab-e" onclick="openSegModal('${p.id}')">Estado</button>
        <button class="ab ab-d" onclick="deletePedido('${p.id}')">✕</button>
      </td>
    </tr>`;
  }).join('');
}

window.verPedido = function (id) {
  const p = PEDIDOS[id]; if (!p) return;
  const items = (p.items || []).map(i => `<div class="fac-row"><span>${i.nombre} x${i.qty}${i.extras?.length ? ' (+' + i.extras.join(', ') + ')' : ''}</span><span>${fmtPrice((i.precio || 0) * i.qty)}</span></div>`).join('');
  $('ped-det-body').innerHTML = `
    <div style="margin-bottom:14px;"><strong>${p.numero || p.id.slice(-6)}</strong> · <small style="color:var(--text3)">${new Date((p.createdAt?.seconds || 0) * 1000).toLocaleString('es-CO')}</small></div>
    <div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;">
      <strong>${p.cliente?.nombre || '—'}</strong><br>📱 ${p.cliente?.tel || '—'}<br>📍 ${p.cliente?.dir || '—'}${p.cliente?.comp ? ', ' + p.cliente.comp : ''} ${p.cliente?.recibe ? '<br>👤 Recibe: ' + p.cliente.recibe : ''}
    </div>
    ${items}
    <div style="border-top:1px solid var(--border);padding-top:10px;margin-top:8px;">
      <div class="fac-row"><span>Subtotal</span><span>${fmtPrice(p.subtotal || 0)}</span></div>
      ${p.domicilio ? `<div class="fac-row"><span>Domicilio</span><span>${fmtPrice(p.domicilio)}</span></div>` : ''}
      ${p.descuento ? `<div class="fac-row"><span>Descuento</span><span>-${fmtPrice(p.descuento)}</span></div>` : ''}
      <div class="fac-row" style="font-weight:700;font-size:16px;color:var(--brand)"><span>Total</span><span>${fmtPrice(p.total || 0)}</span></div>
    </div>`;
  $('ped-det-footer').innerHTML = `<button class="ab ab-e" style="flex:1;" onclick="openSegModal('${id}');closeModal('modal-ped-det')">Cambiar estado</button><button class="ab ab-d" onclick="deletePedido('${id}');closeModal('modal-ped-det')">Eliminar</button>`;
  openModal('modal-ped-det');
};

window.openSegModal = function (id) {
  $('seg-id').value = id;
  $('seg-num').textContent = PEDIDOS[id]?.numero || id;
  openModal('modal-seg');
};
window.setEstado = async function (estado) {
  const id = $('seg-id').value; if (!id) return;
  try {
    await updateDoc(doc(db, 'pedidos', id), { estado });
    PEDIDOS[id].estado = estado;
    closeModal('modal-seg'); renderPedidosTable(); renderSeguimiento(); renderPedidosBadge(); renderDashboard();
    toast('✅ Estado actualizado');
  } catch (e) { toast('❌ Error al actualizar'); }
};
window.deletePedido = async function (id) {
  if (!confirm('¿Eliminar este pedido?')) return;
  try { await deleteDoc(doc(db, 'pedidos', id)); delete PEDIDOS[id]; renderPedidosTable(); renderDashboard(); renderPedidosBadge(); toast('Pedido eliminado'); }
  catch (e) { toast('❌ Error'); }
};

// ── SEGUIMIENTO ──
function renderSeguimiento() {
  const tbody = $('seg-tbody');
  const pedidos = Object.values(PEDIDOS).filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado');
  if (!pedidos.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text3)">Sin pedidos activos</td></tr>`; return; }
  const statusMap = { activos: '📋 Activo', preparando: '🔥 Preparando', camino: '🛵 En camino' };
  tbody.innerHTML = pedidos.map(p => `<tr>
    <td><strong>${p.numero || p.id.slice(-6)}</strong></td>
    <td>${p.cliente?.nombre || '—'}</td>
    <td>${statusMap[p.estado] || p.estado}</td>
    <td><button class="ab ab-b" onclick="openSegModal('${p.id}')">Actualizar</button></td>
  </tr>`).join('');
}

// ── PRODUCTOS ADMIN ──
function renderProductosAdmin() {
  const grid = $('prods-admin');
  let prods = Object.values(PRODUCTOS);
  if (productosFiltro) prods = prods.filter(p => p.nombre.toLowerCase().includes(productosFiltro));
  if (!prods.length) { grid.innerHTML = `<div class="empty-s"><div style="font-size:36px">🍖</div><div style="margin-top:8px;">No hay productos</div></div>`; return; }
  grid.innerHTML = prods.map(p => {
    const imgH = p.imgUrl ? `<img src="${p.imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">` : (p.emoji || '🍖');
    const cat = CATEGORIAS[p.categoriaId];
    return `<div class="pac">
      <div class="pac-img">${imgH}</div>
      <div class="pac-name">${p.nombre}</div>
      <div class="pac-price">${fmtPrice(p.precio)}</div>
      <div class="pac-cat">${cat?.nombre || '—'}</div>
      <div class="pac-actions">
        <button class="ab ab-e" style="flex:1;" onclick="editProd('${p.id}')">✏️</button>
        <button class="ab ab-d" onclick="deleteProd('${p.id}')">🗑️</button>
      </div>
      <div class="toggle-wrap" style="margin-top:8px;" onclick="toggleProdActivo('${p.id}')">
        <div class="tog-track ${p.activo !== false ? 'on' : ''}" id="pt-${p.id}"><div class="tog-thumb"></div></div>
        <span style="font-size:12px;">Visible</span>
      </div>
    </div>`;
  }).join('');
}

window.filterProductos = function (val) { setProductosFiltro(val.toLowerCase()); renderProductosAdmin(); };
window.toggleProdActivo = async function (id) {
  const p = PRODUCTOS[id]; p.activo = !p.activo;
  await updateDoc(doc(db, 'productos', id), { activo: p.activo });
  $('pt-' + id).classList.toggle('on', p.activo);
};

window.openProdModal = function () {
  $('mp-title').textContent = 'Nuevo producto';
  $('pe-id').value = ''; $('pe-nom').value = ''; $('pe-desc').value = '';
  $('pe-precio').value = ''; $('pe-costo').value = '';
  $('pe-emoji').value = ''; $('pe-img-url').value = '';
  $('pe-img-prev').textContent = '📦';
  setTmpIngrTags([]); setTmpExtTags([]); renderTags();
  setTipo('comestible');
  $('pe-cat').innerHTML = '<option value="">Selecciona categoría</option>' + Object.values(CATEGORIAS).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  $('pe-activo').classList.add('on');
  $('gan-badge').innerHTML = '💡 Ganancia: <strong>$0 (0%)</strong>';
  setPendingProdImgFile(null);
  openModal('modal-prod');
};

window.editProd = function (id) {
  const p = PRODUCTOS[id];
  $('mp-title').textContent = 'Editar producto';
  $('pe-id').value = id; $('pe-nom').value = p.nombre; $('pe-desc').value = p.descripcion || '';
  $('pe-precio').value = p.precio; $('pe-costo').value = p.costo || '';
  $('pe-emoji').value = p.emoji || ''; $('pe-img-url').value = p.imgUrl || '';
  const prev = $('pe-img-prev');
  if (p.imgUrl) prev.innerHTML = `<img src="${p.imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
  else prev.textContent = p.emoji || '📦';
  setTmpIngrTags([...(p.ingredientes || [])]);
  setTmpExtTags([...(p.adicionales || [])]);
  renderTags();
  setTipo(p.tipo || 'comestible');
  $('pe-cat').innerHTML = '<option value="">Selecciona categoría</option>' + Object.values(CATEGORIAS).map(c => `<option value="${c.id}" ${c.id === p.categoriaId ? 'selected' : ''}>${c.nombre}</option>`).join('');
  if (p.activo !== false) $('pe-activo').classList.add('on'); else $('pe-activo').classList.remove('on');
  calcGan(); setPendingProdImgFile(null);
  openModal('modal-prod');
};

window.setTipo = function (tipo) {
  $('pe-tipo').value = tipo;
  $('tb-com').className = tipo === 'comestible' ? 'btn-p' : 'btn-s';
  $('tb-com').style.cssText = 'padding:11px;width:auto;font-size:14px;';
  $('tb-no').className = tipo === 'nocomestible' ? 'btn-p' : 'btn-s';
  $('tb-no').style.cssText = 'padding:11px;width:auto;font-size:14px;';
  $('pe-ingr-wrap').style.display = tipo === 'comestible' ? '' : 'none';
};

window.calcGan = function () {
  const c = parseFloat($('pe-costo').value) || 0, p = parseFloat($('pe-precio').value) || 0;
  const gan = p - c, pct = c ? Math.round((gan / c) * 100) : 0;
  $('gan-badge').innerHTML = `💡 Ganancia: <strong>${fmtPrice(gan)} (${pct}%)</strong>`;
};

window.prevProdEmoji = function (val) { if (!val) return; $('pe-img-prev').textContent = val; $('pe-img-url').value = ''; };
window.prevProdFile  = function (inp) {
  const f = inp.files[0]; if (!f) return;
  setPendingProdImgFile(f);
  const r = new FileReader(); r.onload = e => { $('pe-img-prev').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`; }; r.readAsDataURL(f);
};
window.prevLogoEmoji = function (val) { if (!val) return; $('cfg-logo-prev').textContent = val; };
window.prevLogoFile  = function (inp) {
  const f = inp.files[0]; if (!f) return;
  setPendingLogoFile(f);
  const r = new FileReader(); r.onload = e => { $('cfg-logo-prev').innerHTML = `<img src="${e.target.result}" style="width:60px;height:60px;object-fit:cover;border-radius:14px;">`; }; r.readAsDataURL(f);
};

window.addTag = function (type) {
  const inp = $(type === 'ingr' ? 'pe-ingr-input' : 'pe-ext-input');
  const val = inp.value.trim(); if (!val) return;
  if (type === 'ingr') setTmpIngrTags([...tmpIngrTags, val]);
  else setTmpExtTags([...tmpExtTags, val]);
  inp.value = ''; renderTags();
};
function renderTags() {
  $('pe-ingr-tags').innerHTML = tmpIngrTags.map((t, i) => `<div class="tag-item">${t}<button onclick="rmTag('ingr',${i})">✕</button></div>`).join('');
  $('pe-ext-tags').innerHTML  = tmpExtTags.map((t, i) => `<div class="tag-item">${t}<button onclick="rmTag('ext',${i})">✕</button></div>`).join('');
}
window.rmTag = function (type, idx) {
  if (type === 'ingr') { const arr = [...tmpIngrTags]; arr.splice(idx, 1); setTmpIngrTags(arr); }
  else { const arr = [...tmpExtTags]; arr.splice(idx, 1); setTmpExtTags(arr); }
  renderTags();
};

window.saveProd = async function () {
  const nom = $('pe-nom').value.trim(), precio = parseFloat($('pe-precio').value) || 0, catId = $('pe-cat').value;
  if (!nom)   { toast('⚠️ El nombre es obligatorio'); return; }
  if (!precio){ toast('⚠️ El precio es obligatorio'); return; }
  if (!catId) { toast('⚠️ Selecciona una categoría'); return; }
  let imgUrl = $('pe-img-url').value || '';
  if (pendingProdImgFile) {
    try {
      const storRef = ref(storage, `productos/${Date.now()}_${pendingProdImgFile.name}`);
      await uploadBytes(storRef, pendingProdImgFile);
      imgUrl = await getDownloadURL(storRef);
    } catch (e) { toast('⚠️ No se pudo subir la imagen'); console.error(e); }
  }
  const data = {
    nombre: nom, descripcion: $('pe-desc').value.trim(), precio, costo: parseFloat($('pe-costo').value) || 0,
    emoji: $('pe-emoji').value.trim(), imgUrl, categoriaId: catId, tipo: $('pe-tipo').value,
    ingredientes: tmpIngrTags, adicionales: tmpExtTags, activo: isOn('pe-activo')
  };
  const id = $('pe-id').value;
  try {
    if (id) { await updateDoc(doc(db, 'productos', id), data); Object.assign(PRODUCTOS[id], data); }
    else { const r = await addDoc(collection(db, 'productos'), data); PRODUCTOS[r.id] = { id: r.id, ...data }; }
    closeModal('modal-prod'); renderProductosAdmin(); renderProds('todos'); renderCats();
    toast('✅ Producto guardado');
  } catch (e) { toast('❌ Error al guardar'); console.error(e); }
};

window.deleteProd = async function (id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try { await deleteDoc(doc(db, 'productos', id)); delete PRODUCTOS[id]; renderProductosAdmin(); renderProds('todos'); toast('Producto eliminado'); }
  catch (e) { toast('❌ Error'); }
};

// ── CATEGORÍAS ADMIN ──
function renderCatsAdmin() {
  const tbody = $('cats-tbody');
  const cats = Object.values(CATEGORIAS);
  if (!cats.length) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text3)">Sin categorías</td></tr>`; return; }
  tbody.innerHTML = cats.map(c => {
    const count = Object.values(PRODUCTOS).filter(p => p.categoriaId === c.id).length;
    return `<tr>
      <td><div style="width:24px;height:24px;background:${c.color || '#ccc'};border-radius:6px;"></div></td>
      <td><strong>${c.nombre}</strong></td>
      <td>${count} productos</td>
      <td style="display:flex;gap:6px;">
        <button class="ab ab-e" onclick="editCat('${c.id}')">✏️</button>
        <button class="ab ab-d" onclick="deleteCat('${c.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

window.openCatModal = function () {
  $('mc-title').textContent = 'Nueva categoría';
  $('ce-id').value = ''; $('ce-nom').value = ''; $('ce-color').value = '#C8401A';
  document.querySelectorAll('.color-sw').forEach(s => { s.classList.remove('sel'); s.style.borderColor = 'transparent'; });
  document.querySelector('.color-sw').classList.add('sel');
  openModal('modal-cat');
};
window.editCat = function (id) {
  const c = CATEGORIAS[id];
  $('mc-title').textContent = 'Editar categoría'; $('ce-id').value = id; $('ce-nom').value = c.nombre; $('ce-color').value = c.color || '#C8401A';
  document.querySelectorAll('.color-sw').forEach(s => { s.classList.remove('sel'); s.style.borderColor = 'transparent'; if (s.dataset.color === c.color) { s.classList.add('sel'); s.style.borderColor = 'var(--text)'; } });
  openModal('modal-cat');
};
window.pickColor = function (el) {
  document.querySelectorAll('.color-sw').forEach(s => { s.classList.remove('sel'); s.style.borderColor = 'transparent'; });
  el.classList.add('sel'); el.style.borderColor = 'var(--text)';
  $('ce-color').value = el.dataset.color;
};
window.pickColorCustom = function (val) { $('ce-color').value = val; document.querySelectorAll('.color-sw').forEach(s => { s.classList.remove('sel'); s.style.borderColor = 'transparent'; }); };
window.saveCat = async function () {
  const nom = $('ce-nom').value.trim(), color = $('ce-color').value;
  if (!nom) { toast('⚠️ El nombre es obligatorio'); return; }
  const id = $('ce-id').value;
  const data = { nombre: nom, color };
  try {
    if (id) { await updateDoc(doc(db, 'categorias', id), data); Object.assign(CATEGORIAS[id], data); }
    else { const r = await addDoc(collection(db, 'categorias'), data); CATEGORIAS[r.id] = { id: r.id, ...data }; }
    closeModal('modal-cat'); renderCatsAdmin(); renderCats(); toast('✅ Categoría guardada');
  } catch (e) { toast('❌ Error'); console.error(e); }
};
window.deleteCat = async function (id) {
  if (!confirm('¿Eliminar esta categoría?')) return;
  try { await deleteDoc(doc(db, 'categorias', id)); delete CATEGORIAS[id]; renderCatsAdmin(); renderCats(); toast('Categoría eliminada'); }
  catch (e) { toast('❌ Error'); }
};

// ── DASHBOARD ──
function renderDashboard() {
  const all = Object.values(PEDIDOS);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayPeds = all.filter(p => (p.createdAt?.seconds || 0) * 1000 >= today.getTime());
  $('s-hoy').textContent = todayPeds.length;
  $('s-ing').textContent = fmtPrice(todayPeds.reduce((s, p) => s + (p.total || 0), 0));
  $('s-tot').textContent = all.length;
  $('s-cam').textContent = all.filter(p => p.estado === 'camino').length;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const n = new Date(d); n.setDate(n.getDate() + 1);
    const count = all.filter(p => { const t = (p.createdAt?.seconds || 0) * 1000; return t >= d.getTime() && t < n.getTime(); }).length;
    days.push({ label: d.toLocaleDateString('es-CO', { weekday: 'short' }), count });
  }
  const max = Math.max(...days.map(d => d.count), 1);
  $('bar-chart').innerHTML = days.map(d => `<div class="bar-wrap"><div class="bar-val">${d.count || ''}</div><div class="bar" style="height:${Math.round((d.count / max) * 80)}px;"></div><div class="bar-lbl">${d.label}</div></div>`).join('');
  const counts = {};
  all.forEach(p => (p.items || []).forEach(i => { counts[i.nombre] = (counts[i.nombre] || 0) + i.qty; }));
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $('top-prods').innerHTML = sorted.length ? sorted.map(([n, c]) => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${n}</span><span style="font-weight:700;color:var(--brand)">${c} uds</span></div>`).join('') : '<div style="color:var(--text3);font-size:14px;">Sin datos aún</div>';
}

// ── NOVEDADES ──
function renderNovedades() {
  const list = $('nov-list');
  const novs = Object.values(NOVEDADES).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  if (!novs.length) { list.innerHTML = `<div class="empty-s"><div style="font-size:36px">🔔</div><div style="margin-top:8px;">Sin novedades</div></div>`; return; }
  list.innerHTML = novs.map(n => `
    <div class="admin-card" style="padding:16px 18px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><div style="font-weight:700;font-size:15px;">${n.titulo}</div><div style="font-size:13px;color:var(--text2);margin-top:4px;">${n.descripcion || ''}</div></div>
        <button class="ab ab-d" style="margin-left:12px;flex-shrink:0;" onclick="deleteNov('${n.id}')">✕</button>
      </div>
    </div>`).join('');
}
window.saveNov = async function () {
  const tit = $('nov-tit').value.trim();
  if (!tit) { toast('⚠️ El título es obligatorio'); return; }
  try {
    const r = await addDoc(collection(db, 'novedades'), { titulo: tit, descripcion: $('nov-desc').value.trim(), createdAt: serverTimestamp() });
    NOVEDADES[r.id] = { id: r.id, titulo: tit, descripcion: $('nov-desc').value.trim() };
    $('nov-tit').value = ''; $('nov-desc').value = '';
    closeModal('modal-nov'); renderNovedades(); toast('✅ Novedad publicada');
  } catch (e) { toast('❌ Error'); console.error(e); }
};
window.deleteNov = async function (id) {
  if (!confirm('¿Eliminar esta novedad?')) return;
  try { await deleteDoc(doc(db, 'novedades', id)); delete NOVEDADES[id]; renderNovedades(); } catch (e) { toast('❌ Error'); }
};

// ── DOMICILIO ──
window.toggleDomWrap = function () { $('dom-wrap').style.display = $('dom-tipo').value === 'gratis' ? 'none' : ''; };
window.saveDomicilio = async function () {
  const tipo = $('dom-tipo').value, val = parseFloat($('dom-val-input').value) || 0, activo = isOn('dom-tog');
  setCFG({ domicilioTipo: tipo, domicilioValor: val, domicilioActivo: activo });
  try { await setDoc(doc(db, 'config', 'main'), { ...CFG }, { merge: true }); toast('✅ Domicilio guardado'); }
  catch (e) { toast('❌ Error'); console.error(e); }
};

// ── CUPONES ──
function renderCupones() {
  const tbody = $('cup-tbody');
  const cups = Object.values(CUPONES);
  if (!cups.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text3)">Sin cupones</td></tr>`; return; }
  tbody.innerHTML = cups.map(c => `<tr>
    <td><strong style="font-family:monospace">${c.codigo}</strong></td>
    <td>${c.tipo === 'porcentaje' ? c.valor + '%' : '$' + c.valor}</td>
    <td>${c.usos || 0}${c.limite ? ' / ' + c.limite : ' (ilimitado)'}</td>
    <td><span class="sp ${c.activo !== false ? 'sp-e' : 'sp-x'}">${c.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
    <td style="display:flex;gap:6px;">
      <button class="ab ab-e" onclick="editCupon('${c.id}')">✏️</button>
      <button class="ab ab-d" onclick="deleteCupon('${c.id}')">🗑️</button>
    </td>
  </tr>`).join('');
}
window.openCuponModal = function () {
  $('mcu-title').textContent = 'Generar cupón';
  $('cue-id').value = ''; $('cue-cod').value = ''; $('cue-val').value = ''; $('cue-lim').value = '0';
  $('cue-tipo').value = 'porcentaje'; $('cue-activo').classList.add('on');
  openModal('modal-cupon');
};
window.editCupon = function (id) {
  const c = CUPONES[id];
  $('mcu-title').textContent = 'Editar cupón'; $('cue-id').value = id;
  $('cue-cod').value = c.codigo; $('cue-tipo').value = c.tipo; $('cue-val').value = c.valor; $('cue-lim').value = c.limite || 0;
  if (c.activo !== false) $('cue-activo').classList.add('on'); else $('cue-activo').classList.remove('on');
  openModal('modal-cupon');
};
window.genCuponCode = function () {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  $('cue-cod').value = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
window.saveCupon = async function () {
  const cod = $('cue-cod').value.trim().toUpperCase(), val = parseFloat($('cue-val').value) || 0;
  if (!cod) { toast('⚠️ El código es obligatorio'); return; }
  if (!val) { toast('⚠️ El descuento debe ser mayor a 0'); return; }
  const id = $('cue-id').value;
  const data = { codigo: cod, tipo: $('cue-tipo').value, valor: val, limite: parseInt($('cue-lim').value) || 0, activo: isOn('cue-activo'), usos: id ? CUPONES[id].usos || 0 : 0 };
  try {
    if (id) { await updateDoc(doc(db, 'cupones', id), data); Object.assign(CUPONES[id], data); }
    else { const r = await addDoc(collection(db, 'cupones'), data); CUPONES[r.id] = { id: r.id, ...data }; }
    closeModal('modal-cupon'); renderCupones(); toast('✅ Cupón guardado');
  } catch (e) { toast('❌ Error'); console.error(e); }
};
window.deleteCupon = async function (id) {
  if (!confirm('¿Eliminar este cupón?')) return;
  try { await deleteDoc(doc(db, 'cupones', id)); delete CUPONES[id]; renderCupones(); } catch (e) { toast('❌ Error'); }
};

// ── CONFIG ──
window.saveConfig = async function () {
  const nom = $('cfg-nombre').value.trim(), pin = $('cfg-pin').value.trim();
  if (nom) setCFG({ nombreComercio: nom });
  if (pin) {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) { toast('⚠️ El PIN debe tener 6 dígitos numéricos'); return; }
    setCFG({ pinAdmin: pin });
  }
  const msg = $('cfg-msg').value.trim();
  if (msg) setCFG({ mensajeConfirmacion: msg });
  const emoji = $('cfg-emoji').value.trim();
  if (emoji) setCFG({ logoEmoji: emoji });
  if (pendingLogoFile) {
    try {
      const r = ref(storage, `logo/${Date.now()}_${pendingLogoFile.name}`);
      await uploadBytes(r, pendingLogoFile);
      setCFG({ logoUrl: await getDownloadURL(r) });
    } catch (e) { toast('⚠️ No se pudo subir el logo'); }
  }
  try {
    await setDoc(doc(db, 'config', 'main'), CFG, { merge: true });
    applyConfig(); toast('✅ Configuración guardada'); setPendingLogoFile(null);
  } catch (e) { toast('❌ Error al guardar'); console.error(e); }
};
