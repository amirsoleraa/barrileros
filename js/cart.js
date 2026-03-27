// ═══════════════════════════════════════════════
// cart.js — Carrito y resumen del pedido
// ═══════════════════════════════════════════════

import { $, fmtPrice, toast, goTo, goBack, openModal, closeModal } from './ui.js';
import {
  cart, setCart,
  CFG, CUPONES,
  datosEnvio, setDatosEnvio,
  cuponAplicado, setCuponAplicado
} from './state.js';
import { renderProds, updateCartUI } from './products.js';
import { db } from './firebase.js';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── CARRITO ──
export function renderCart() {
  const list   = $('cart-list');
  const footer = $('cart-footer');

  if (!cart.length) {
    list.innerHTML   = `<div class="empty-s" style="padding:60px 20px"><div style="font-size:48px">🛒</div><div style="font-size:15px;margin-top:12px;">Tu carrito está vacío</div></div>`;
    footer.innerHTML = `<button class="btn-s" style="padding:15px;border-radius:14px;" onclick="goBack()">← Ver productos</button>`;
    return;
  }

  list.innerHTML = cart.map((item, idx) => {
    const imgH = item.imgUrl ? `<img src="${item.imgUrl}">` : item.emoji;
    return `
    <div class="cart-item">
      <div class="ci-img">${imgH}</div>
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        ${item.extras.length ? `<div class="ci-extras">+ ${item.extras.join(', ')}</div>` : ''}
        <div class="ci-price">${fmtPrice(item.price)} c/u</div>
      </div>
      <div class="ci-qty">
        <button class="cq-btn" onclick="cartQty(${idx},-1)">−</button>
        <span class="cq-num">${item.qty}</span>
        <button class="cq-btn" onclick="cartQty(${idx},1)">+</button>
      </div>
    </div>`;
  }).join('');

  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  footer.innerHTML = `
    <div style="padding:0 0 12px;font-size:14px;color:var(--text2);display:flex;justify-content:space-between;">
      <span>Subtotal (${cart.reduce((s, i) => s + i.qty, 0)} items)</span>
      <span style="font-weight:600;color:var(--text);">${fmtPrice(sub)}</span>
    </div>
    <button class="btn-p" style="padding:15px;border-radius:14px;font-size:16px;" onclick="goTo('view-resumen')">Ir a resumen →</button>`;
}

window.cartQty = function (idx, delta) {
  const newCart = [...cart];
  newCart[idx].qty += delta;
  if (newCart[idx].qty <= 0) newCart.splice(idx, 1);
  setCart(newCart);
  renderCart();
  updateCartUI();
};

// ── RESUMEN ──
export function renderResumen() {
  const resPrds = $('res-prods');
  resPrds.innerHTML = cart.map(i => `
    <div class="res-row">
      <span>${i.name} x${i.qty}${i.extras.length ? ' <small style="color:var(--text3)">+' + i.extras.join(', ') + '</small>' : ''}</span>
      <span style="font-weight:600;">${fmtPrice(i.price * i.qty)}</span>
    </div>`).join('');

  const cardDom     = $('card-dom');
  const domValDisp  = $('dom-val-display');
  if (CFG.domicilioActivo) {
    cardDom.style.display = '';
    domValDisp.textContent = CFG.domicilioTipo === 'gratis' ? 'Gratis' : fmtPrice(CFG.domicilioValor || 0);
  } else {
    cardDom.style.display = 'none';
  }

  calcTotales();
}

export function calcTotales() {
  const sub = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let dom  = (CFG.domicilioActivo && CFG.domicilioTipo === 'fijo') ? (CFG.domicilioValor || 0) : 0;
  let desc = 0;
  if (cuponAplicado) {
    if (cuponAplicado.tipo === 'porcentaje') desc = Math.round(sub * cuponAplicado.valor / 100);
    else desc = cuponAplicado.valor;
    desc = Math.min(desc, sub);
  }
  const total = sub + dom - desc;
  $('res-totales').innerHTML = `
    <div class="res-row"><span>Subtotal</span><span>${fmtPrice(sub)}</span></div>
    ${dom  ? `<div class="res-row"><span>Domicilio</span><span>${fmtPrice(dom)}</span></div>` : ''}
    ${desc ? `<div class="res-row" style="color:var(--success)"><span>Descuento 🏷️</span><span>-${fmtPrice(desc)}</span></div>` : ''}
    <div class="res-row total"><span>Total a pagar</span><span>${fmtPrice(total)}</span></div>`;
  return { sub, dom, desc, total };
}

// ── CUPÓN ──
window.applyCoupon = function () {
  const code   = $('cupon-input').value.trim().toUpperCase();
  const status = $('cupon-status');
  if (!code) return;
  const cup = Object.values(CUPONES).find(c => c.codigo === code && c.activo !== false);
  if (!cup) {
    status.innerHTML = '<span style="color:var(--danger)">❌ Cupón inválido o expirado</span>';
    setCuponAplicado(null); calcTotales(); return;
  }
  if (cup.limite && cup.usos >= cup.limite) {
    status.innerHTML = '<span style="color:var(--danger)">❌ Cupón agotado</span>';
    setCuponAplicado(null); calcTotales(); return;
  }
  setCuponAplicado(cup);
  const label = cup.tipo === 'porcentaje' ? `${cup.valor}% de descuento` : fmtPrice(cup.valor) + ' de descuento';
  status.innerHTML = `<span style="color:var(--success)">✅ Cupón aplicado — ${label}</span>`;
  calcTotales();
};

// ── DATOS DE ENVÍO ──
window.saveDatos = function () {
  const nom = $('d-nombre').value.trim();
  const cor = $('d-correo').value.trim();
  const tel = $('d-tel').value.trim();
  const dir = $('d-dir').value.trim();
  let ok = true;
  [['e-nom', nom], ['e-cor', cor], ['e-tel', tel], ['e-dir', dir]].forEach(([eid, val]) => {
    $(eid).textContent = val ? '' : 'Este campo es obligatorio';
    if (!val) ok = false;
  });
  if (!ok) return;
  setDatosEnvio({ nombre: nom, correo: cor, tel, dir, comp: $('d-comp').value.trim(), recibe: $('d-rec').value.trim() });
  $('datos-sub').textContent = `${nom} · ${tel}`;
  closeModal('modal-datos');
  toast('✅ Datos guardados');
};

// ── CONFIRMAR PEDIDO ──
window.confirmarPedido = function () {
  if (!cart.length) { toast('Tu carrito está vacío'); return; }
  if (!datosEnvio)  { openModal('modal-datos'); return; }
  const { total } = calcTotales();
  $('conf-msg').textContent   = CFG.mensajeConfirmacion || '¡Tu pedido está listo para confirmar!';
  $('conf-total').textContent = `Total: ${fmtPrice(total)}`;
  openModal('modal-confirmar');
};

window.finalizarPedido = async function () {
  const btn = $('btn-conf');
  btn.disabled = true; btn.textContent = 'Procesando...';
  const { sub, dom, desc, total } = calcTotales();
  const numPedido = 'P' + Date.now().toString().slice(-6);
  const pedido = {
    numero: numPedido, estado: 'activos', cliente: datosEnvio,
    items: cart.map(i => ({ id: i.id, nombre: i.name, precio: i.price, qty: i.qty, extras: i.extras })),
    subtotal: sub, domicilio: dom, descuento: desc, total,
    cupon: cuponAplicado ? cuponAplicado.codigo : null,
    createdAt: serverTimestamp()
  };
  try {
    await addDoc(collection(db, 'pedidos'), pedido);
    if (cuponAplicado) {
      const cupDoc = Object.values(CUPONES).find(c => c.codigo === cuponAplicado.codigo);
      if (cupDoc) await updateDoc(doc(db, 'cupones', cupDoc.id), { usos: (cupDoc.usos || 0) + 1 });
    }
    closeModal('modal-confirmar');
    renderFactura(numPedido, pedido);
    goTo('view-factura');
    resetPedido();
  } catch (e) {
    toast('❌ Error al enviar el pedido. Intenta de nuevo.');
    console.error(e);
  }
  btn.disabled = false; btn.textContent = 'Confirmar 🎉';
};

function renderFactura(num, pedido) {
  $('f-num').textContent    = '#' + num;
  $('f-msg').textContent    = CFG.mensajeConfirmacion || 'Tu pedido está siendo preparado';
  $('f-nombre').textContent = pedido.cliente.nombre;
  $('f-tel').textContent    = pedido.cliente.tel;
  $('f-dir').textContent    = pedido.cliente.dir + (pedido.cliente.comp ? ', ' + pedido.cliente.comp : '');
  const rowRec = $('f-row-rec');
  if (pedido.cliente.recibe) {
    rowRec.style.display = '';
    $('f-rec').textContent = pedido.cliente.recibe;
  } else {
    rowRec.style.display = 'none';
  }
  $('f-items').innerHTML = pedido.items.map(i =>
    `<div class="fac-row"><span>${i.nombre} x${i.qty}${i.extras.length ? ' (+' + i.extras.join(', ') + ')' : ''}</span><span>${fmtPrice(i.precio * i.qty)}</span></div>`
  ).join('');
  $('f-totales').innerHTML = `
    <div class="fac-row"><span>Subtotal</span><span>${fmtPrice(pedido.subtotal)}</span></div>
    ${pedido.domicilio ? `<div class="fac-row"><span>Domicilio</span><span>${fmtPrice(pedido.domicilio)}</span></div>` : ''}
    ${pedido.descuento ? `<div class="fac-row" style="color:var(--success)"><span>Descuento</span><span>-${fmtPrice(pedido.descuento)}</span></div>` : ''}
    <div class="fac-row total"><span>Total</span><span>${fmtPrice(pedido.total)}</span></div>`;
}

window.resetPedido = function () {
  setCart([]);
  setDatosEnvio(null);
  setCuponAplicado(null);
  $('cupon-input').value   = '';
  $('cupon-status').textContent = '';
  $('datos-sub').textContent   = 'Toca para ingresar tus datos';
  updateCartUI();
  renderProds('todos');
};
