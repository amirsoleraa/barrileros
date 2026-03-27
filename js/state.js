// ═══════════════════════════════════════════════
// state.js — Estado global de la aplicación
// ═══════════════════════════════════════════════

// Configuración del comercio (se sobreescribe desde Firestore)
export let CFG = {
  nombreComercio: 'Asados al Barril',
  logoEmoji: '🔥',
  logoUrl: '',
  pinAdmin: '123456',
  domicilioActivo: true,
  domicilioTipo: 'fijo',
  domicilioValor: 5000,
  mensajeConfirmacion: 'Tu pedido está siendo preparado. ¡Gracias por tu compra!'
};
export function setCFG(data) { Object.assign(CFG, data); }

// Datos del catálogo
export let PRODUCTOS  = {};
export let CATEGORIAS = {};
export let PEDIDOS    = {};
export let CUPONES    = {};
export let NOVEDADES  = {};

// Carrito y navegación
export let cart          = [];
export let currentView   = 'view-home';
export let viewStack     = [];
export let datosEnvio    = null;
export let cuponAplicado = null;

// Detalle de producto
export let detailProdId  = null;
export let detailQtyVal  = 1;
export let detailExtras  = [];

// Admin
export let activePedidoTab  = 'activos';
export let pedidosFiltro    = '';
export let productosFiltro  = '';
export let sidebarCollapsed = false;
export let pendingLogoFile    = null;
export let pendingProdImgFile = null;
export let tmpIngrTags = [];
export let tmpExtTags  = [];

// Setters para mutar el estado desde otros módulos
export function setCart(v)           { cart = v; }
export function setCurrentView(v)    { currentView = v; }
export function setViewStack(v)      { viewStack = v; }
export function setDatosEnvio(v)     { datosEnvio = v; }
export function setCuponAplicado(v)  { cuponAplicado = v; }
export function setDetailProdId(v)   { detailProdId = v; }
export function setDetailQtyVal(v)   { detailQtyVal = v; }
export function setDetailExtras(v)   { detailExtras = v; }
export function setActivePedidoTab(v){ activePedidoTab = v; }
export function setPedidosFiltro(v)  { pedidosFiltro = v; }
export function setProductosFiltro(v){ productosFiltro = v; }
export function setSidebarCollapsed(v){ sidebarCollapsed = v; }
export function setPendingLogoFile(v)   { pendingLogoFile = v; }
export function setPendingProdImgFile(v){ pendingProdImgFile = v; }
export function setTmpIngrTags(v)    { tmpIngrTags = v; }
export function setTmpExtTags(v)     { tmpExtTags = v; }
