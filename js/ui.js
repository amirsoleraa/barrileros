// ═══════════════════════════════════════════════
// ui.js — Utilidades de interfaz, navegación y modales
// ═══════════════════════════════════════════════

import { currentView, viewStack, setCurrentView, setViewStack, CFG } from './state.js';
import { updateCartUI } from './products.js';
import { renderCart, renderResumen } from './cart.js';


// ── UTILS BÁSICOS ──
export const $ = id => document.getElementById(id);
export const fmtPrice = n => '$' + Number(n).toLocaleString('es-CO');

export function toast(msg, ms = 2500) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

export function toggleEl(id) {
  $(id).classList.toggle('on');
}

export function isOn(id) {
  return $(id).classList.contains('on');
}

// ── NAVEGACIÓN ──
export function goTo(viewId) {
  const stack = [...viewStack];
  stack.push(currentView);
  setViewStack(stack);
  _showView(viewId);
}

export function goBack() {
  const stack = [...viewStack];
  const prev = stack.pop() || 'view-home';
  setViewStack(stack);
  _showView(prev);
}

function _showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $(viewId).classList.add('active');
  setCurrentView(viewId);
  window.scrollTo(0, 0);
  updateCartUI();
  if (viewId === 'view-resumen') renderResumen();
  if (viewId === 'view-cart')    renderCart();
  if (viewId === 'view-admin' && typeof window.refreshAdminFn === 'function') window.refreshAdminFn();
}

// ── MODALES ──
export function openModal(id)  { $(id).classList.add('open'); }
export function closeModal(id) { $(id).classList.remove('open'); }

// Cerrar modales al hacer clic fuera
document.querySelectorAll('.modal-overlay').forEach(o => {
  o.addEventListener('click', e => {
    if (e.target === o) o.classList.remove('open');
  });
});

// ── LOADING SCREEN ──
export function hideLoading() {
  const ls = $('loading-screen');
  ls.style.opacity = '0';
  ls.style.transition = 'opacity .4s';
  setTimeout(() => ls.style.display = 'none', 400);
}

// ── APLICAR CONFIG AL UI ──
export function applyConfig() {
  const logo   = $('ll-logo');
  const name   = $('ll-name');

  if (logo) {
    if (CFG.logoUrl) logo.innerHTML = `<img src="${CFG.logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;">`;
    else logo.textContent = CFG.logoEmoji || '🔥';
  }
  if (name) name.textContent = CFG.nombreComercio || 'Cargando...';

  const hdrLogo = $('hdr-logo');
  if (hdrLogo) { if (CFG.logoUrl) hdrLogo.innerHTML = `<img src="${CFG.logoUrl}">`; else hdrLogo.textContent = CFG.logoEmoji || '🔥'; }
  if ($('hdr-name')) $('hdr-name').textContent = CFG.nombreComercio || 'Asados al Barril';

  const sbLogo = $('sb-logo');
  if (sbLogo) { if (CFG.logoUrl) sbLogo.innerHTML = `<img src="${CFG.logoUrl}">`; else sbLogo.textContent = CFG.logoEmoji || '🔥'; }
  if ($('sb-name')) $('sb-name').textContent = CFG.nombreComercio || 'Asados al Barril';

  const pinLogo = $('pin-logo');
  if (pinLogo) { if (CFG.logoUrl) pinLogo.innerHTML = `<img src="${CFG.logoUrl}">`; else pinLogo.textContent = CFG.logoEmoji || '🔥'; }

  if ($('dom-tipo'))      $('dom-tipo').value       = CFG.domicilioTipo   || 'fijo';
  if ($('dom-val-input')) $('dom-val-input').value  = CFG.domicilioValor  || 0;
  if ($('dom-tog')) { if (CFG.domicilioActivo) $('dom-tog').classList.add('on'); else $('dom-tog').classList.remove('on'); }

  if ($('cfg-emoji'))   $('cfg-emoji').value   = CFG.logoEmoji           || '';
  if ($('cfg-nombre'))  $('cfg-nombre').value  = CFG.nombreComercio      || '';
  if ($('cfg-msg'))     $('cfg-msg').value      = CFG.mensajeConfirmacion || '';

  const cfgPrev = $('cfg-logo-prev');
  if (cfgPrev) {
    if (CFG.logoUrl) cfgPrev.innerHTML = `<img src="${CFG.logoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
    else             cfgPrev.textContent = CFG.logoEmoji || '🔥';
  }

  document.title = CFG.nombreComercio || 'Asados al Barril';
}

// ── EXPONER AL HTML (onclick="...") ──
window.goTo       = goTo;
window.goBack     = goBack;
window.openModal  = openModal;
window.closeModal = closeModal;
window.toggleEl   = toggleEl;
