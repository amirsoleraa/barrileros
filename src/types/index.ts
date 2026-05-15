// ═══════════════════════════════════════════════
// types/index.ts — Tipos TypeScript del dominio
// ═══════════════════════════════════════════════

export interface CamposFormulario {
  correo?: boolean;
  tel?: boolean;
  dir?: boolean;
  barrio?: boolean;
  comp?: boolean;
  recibe?: boolean;
}

export interface AppConfig {
  nombreComercio: string;
  logoEmoji: string;
  logoUrl: string;
  domicilioActivo: boolean;
  domicilioTipo: 'fijo' | 'gratis';
  domicilioValor: number;
  mensajeConfirmacion: string;
  whatsappNumero?: string;
  camposFormulario?: CamposFormulario;
  historialPin?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  color: string;
  orden?: number;
}

export interface Adicional {
  id: string;
  nombre: string;
  precio: number;
  costo: number;
  activo: boolean;
}

export interface ProductoAdicional {
  adicionalId: string;
  cantidadMax: number;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo?: number;
  emoji?: string;
  imgUrl?: string;
  categoriaId: string;
  tipo: 'comestible' | 'nocomestible';
  ingredientes: string[];
  adicionales: ProductoAdicional[];
  activo: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  imgUrl: string;
  qty: number;
  extras: string[];
}

export interface DatosEnvio {
  nombre: string;
  correo?: string;
  tel?: string;
  dir?: string;
  barrio?: string;
  comp?: string;
  recibe?: string;
}

export interface PedidoItem {
  id: string;
  nombre: string;
  precio: number;
  qty: number;
  extras: string[];
}

export interface Pedido {
  id: string;
  numero: string;
  estado: 'activos' | 'preparando' | 'camino' | 'entregado' | 'cancelado';
  cliente: DatosEnvio;
  items: PedidoItem[];
  subtotal: number;
  domicilio: number;
  descuento: number;
  total: number;
  cupon: string | null;
  mensajeConfirmacion: string;
  createdAt?: { seconds: number; nanoseconds: number };
  rutaNombre?: string;
  repartidorNombre?: string;
  notaPendiente?: string;
}

export interface RutaEntrega {
  id: string;
  nombre: string;
  repartidor?: string;
  pedidoIds: string[];
  estado: 'activa' | 'completada';
  createdAt?: { seconds: number; nanoseconds: number };
  completadaEn?: { seconds: number; nanoseconds: number };
  pedidosSnapshot?: Pedido[];
}

export interface HistorialDia {
  id: string;
  fecha: string;
  fechaLabel: string;
  pedidos: Pedido[];
  totalEntregados: number;
  totalCancelados: number;
  totalRecaudo: number;
  creadoEn?: { seconds: number; nanoseconds: number };
}

export interface Publicidad {
  id: string;
  titulo: string;
  descripcion?: string;
  imgUrl?: string;
  activa: boolean;
  orden: number;
  createdAt?: { seconds: number; nanoseconds: number };
}

export interface Cupon {
  id: string;
  codigo: string;
  tipo: 'porcentaje' | 'fijo';
  valor: number;
  limite: number;
  usos: number;
  activo: boolean;
}

export interface Novedad {
  id: string;
  titulo: string;
  descripcion?: string;
  imgUrl?: string;
  activa?: boolean;
  createdAt?: { seconds: number; nanoseconds: number };
}

export interface ThemeColors {
  brand?: string;
  'brand-dark'?: string;
  'brand-light'?: string;
  bg?: string;
  text?: string;
  accent?: string;
}

export type PedidoTab = 'activos' | 'preparando' | 'camino' | 'entregado' | 'cancelado';
