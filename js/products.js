// ═══════════════════════════════════════════════
// products.js — Catálogo, búsqueda y detalle
// ═══════════════════════════════════════════════

import { $, fmtPrice, toast, goTo, goBack } from './ui.js';
import {
  PRODUCTOS, CATEGORIAS,
  cart, setCart,
  currentView,
  detailProdId, setDetailProdId,
  detailQtyVal, setDetailQtyVal,
  detailExtras, setDetailExtras
} from './state.js';

// ── CATEGORÍAS ──
export function renderCats() {
  const bar = $('cats-bar');
  const cats = Object.values(CATEGORIAS).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  bar.innerHTML = `<div class="cat-pill active" style="background:var(--brand);border-color:var(--brand);" onclick="filterCat('todos',this)">Todos</div>`;
  cats.forEach(c => {
    const pill = document.createElement('div');
    pill.className = 'cat-pill';
    pill.style.cssText = 'background:var(--surface);border-color:var(--border);color:var(--text2);';
    pill.dataset.catId = c.id;
    pill.textContent = c.nombre;
    pill.onclick = function () { filterCat(c.id, this); };
    bar.appendChild(pill);
  });
}

window.filterCat = function (catId, el) {
  document.querySelectorAll('.cat-pill').forEach(p => {
    p.classList.remove('active');
    p.style.background   = 'var(--surface)';
    p.style.borderColor  = 'var(--border)';
    p.style.color        = 'var(--text2)';
  });
  el.classList.add('active');
  const color = catId === 'todos' ? 'var(--brand)' : (CATEGORIAS[catId]?.color || 'var(--brand)');
  el.style.background  = color;
  el.style.borderColor = color;
  el.style.color       = '#fff';
  $('sec-title').textContent = catId === 'todos' ? 'Todo el menú' : (CATEGORIAS[catId]?.nombre || 'Menú');
  renderProds(catId);
};

// ── PRODUCTOS ──
export function renderProds(catId) {
  const grid = $('prods-grid');
  let prods = Object.values(PRODUCTOS).filter(p => p.activo !== false);
  if (catId !== 'todos') prods = prods.filter(p => p.categoriaId === catId);

  if (!prods.length) {
    grid.innerHTML = `<div class="empty-s"><div style="font-size:36px">🍖</div><div style="font-size:14px;margin-top:8px;">No hay productos en esta categoría</div></div>`;
    return;
  }

  grid.innerHTML = prods.map(p => {
    const imgH     = p.imgUrl ? `<img src="${p.imgUrl}" alt="${p.nombre}">` : (p.emoji || '🍖');
    const inCart   = cart.find(i => i.id === p.id);
    const qtyVisible = inCart ? 'visible' : '';
    const qtyNum   = inCart ? inCart.qty : 1;
    const qaDisplay = inCart ? 'display:none;' : '';
    return `
    <div class="prod-card" onclick="openDetail('${p.id}')">
      <div class="prod-img">${imgH}</div>
      <div class="prod-info">
        <div class="prod-name">${p.nombre}</div>
        ${p.descripcion ? `<div class="prod-desc">${p.descripcion}</div>` : ''}
        <div class="prod-price">${fmtPrice(p.precio)}</div>
      </div>
      <button class="quick-add" style="${qaDisplay}" onclick="quickAdd(event,'${p.id}')">+</button>
      <div class="qty-control ${qtyVisible}" id="qc-${p.id}">
        <button class="qty-btn" onclick="qtyChange(event,'${p.id}',-1)">−</button>
        <span class="qty-num" id="qn-${p.id}">${qtyNum}</span>
        <button class="qty-btn" onclick="qtyChange(event,'${p.id}',1)">+</button>
      </div>
    </div>`;
  }).join('');
}

// ── QUICK ADD / QTY ──
window.quickAdd = function (e, id) {
  e.stopPropagation();
  const qa = e.currentTarget;
  qa.style.display = 'none';
  const qc = $('qc-' + id);
  if (qc) qc.classList.add('visible');
  const newCart = [...cart];
  const existing = newCart.find(i => i.id === id);
  if (!existing) {
    const p = PRODUCTOS[id];
    newCart.push({ id: p.id, name: p.nombre, price: p.precio, emoji: p.emoji || '🍖', imgUrl: p.imgUrl || '', qty: 1, extras: [] });
  } else {
    existing.qty++;
  }
  setCart(newCart);
  updateCartUI();
};

window.qtyChange = function (e, id, delta) {
  e.stopPropagation();
  const newCart = [...cart];
  const item = newCart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    setCart(newCart.filter(i => i.id !== id));
    const qc = $('qc-' + id);
    if (qc) qc.classList.remove('visible');
    const qa = document.querySelector(`.prod-card .quick-add`);
    if (qa) qa.style.display = '';
  } else {
    setCart(newCart);
    const qn = $('qn-' + id);
    if (qn) qn.textContent = item.qty;
  }
  updateCartUI();
};

// ── CART BADGE / BOTÓN FLOTANTE ──
export function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const badge = $('cart-badge');
  badge.textContent = count;
  badge.classList.toggle('visible', count > 0);
  const gcBtn = $('goto-cart-btn');
  if (count > 0 && currentView === 'view-home') {
    gcBtn.classList.add('visible');
    $('goto-cart-total').textContent = fmtPrice(total);
  } else {
    gcBtn.classList.remove('visible');
  }
}

// ── DETALLE ──
window.openDetail = function (id) {
  const p = PRODUCTOS[id];
  if (!p) return;
  setDetailProdId(id);
  setDetailQtyVal(1);
  setDetailExtras([]);

  const dImg = $('d-img');
  if (p.imgUrl) dImg.innerHTML = `<img src="${p.imgUrl}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;">`;
  else dImg.textContent = p.emoji || '🍖';

  $('d-name').textContent  = p.nombre;
  $('d-desc').textContent  = p.descripcion || '';
  $('d-price').textContent = fmtPrice(p.precio);
  $('d-qty').textContent   = 1;
  $('d-total').textContent = fmtPrice(p.precio);

  const ingrs = p.ingredientes || [];
  if (ingrs.length) {
    $('d-ingr-title').style.display = '';
    $('d-ingr').innerHTML = ingrs.map(i => `<span class="ingr-tag">${i}</span>`).join('');
  } else {
    $('d-ingr-title').style.display = 'none';
    $('d-ingr').innerHTML = '';
  }

  const extras = p.adicionales || [];
  if (extras.length) {
    $('d-extras-title').style.display = '';
    $('d-extras').innerHTML = extras.map(x => `<span class="extra-tag" onclick="toggleExtra(this,'${x}')">${x}</span>`).join('');
  } else {
    $('d-extras-title').style.display = 'none';
    $('d-extras').innerHTML = '';
  }

  goTo('view-detail');
};

window.toggleExtra = function (el, name) {
  el.classList.toggle('sel');
  const extras = [...detailExtras];
  if (el.classList.contains('sel')) {
    if (!extras.includes(name)) extras.push(name);
  } else {
    setDetailExtras(extras.filter(e => e !== name));
    return;
  }
  setDetailExtras(extras);
};

window.dQty = function (delta) {
  const newQty = Math.max(1, detailQtyVal + delta);
  setDetailQtyVal(newQty);
  $('d-qty').textContent   = newQty;
  $('d-total').textContent = fmtPrice(PRODUCTOS[detailProdId].precio * newQty);
};

window.addAndBack = function () { addDetailToCart(); goBack(); };
window.addAndCart = function () { addDetailToCart(); goTo('view-cart'); };

function addDetailToCart() {
  const p = PRODUCTOS[detailProdId];
  const newCart = [...cart];
  const existing = newCart.find(i => i.id === p.id && JSON.stringify(i.extras) === JSON.stringify(detailExtras));
  if (existing) {
    existing.qty += detailQtyVal;
  } else {
    newCart.push({ id: p.id, name: p.nombre, price: p.precio, emoji: p.emoji || '🍖', imgUrl: p.imgUrl || '', qty: detailQtyVal, extras: [...detailExtras] });
  }
  setCart(newCart);
  const qn = $('qn-' + p.id);
  const totalInCart = newCart.filter(i => i.id === p.id).reduce((s, i) => s + i.qty, 0);
  if (qn) qn.textContent = totalInCart;
  const qc = $('qc-' + p.id);
  if (qc) qc.classList.add('visible');
  updateCartUI();
  toast('✅ Producto agregado al carrito');
}

// ── BÚSQUEDA ──
window.openSearch = function () {
  $('search-overlay').classList.add('open');
  setTimeout(() => $('search-input').focus(), 100);
};
window.closeSearch = function () {
  $('search-overlay').classList.remove('open');
  $('search-input').value = '';
};
window.doSearch = function (val) {
  const q = val.toLowerCase().trim();
  const res = $('search-results');
  if (!q) {
    res.innerHTML = `<div class="empty-s"><div style="font-size:36px">🔍</div><div style="font-size:14px;margin-top:8px;">Escribe para buscar</div></div>`;
    return;
  }
  const found = Object.values(PRODUCTOS).filter(p =>
    p.activo !== false &&
    (p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q))
  );
  if (!found.length) {
    res.innerHTML = `<div class="empty-s"><div style="font-size:36px">😕</div><div style="font-size:14px;margin-top:8px;">Sin resultados</div></div>`;
    return;
  }
  res.innerHTML = found.map(p => {
    const imgH = p.imgUrl
      ? `<img src="${p.imgUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
      : (p.emoji || '🍖');
    return `<div class="s-item" onclick="closeSearch();openDetail('${p.id}')">
      <div class="s-img">${imgH}</div>
      <div>
        <div style="font-weight:500;font-size:14px;">${p.nombre}</div>
        <div style="font-size:13px;color:var(--text2);">${fmtPrice(p.precio)}</div>
      </div>
    </div>`;
  }).join('');
};
