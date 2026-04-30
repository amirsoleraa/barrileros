// ═══════════════════════════════════════════════
// stores/useAppStore.ts — Config + Catálogo
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import type { AppConfig, Producto, Categoria, Cupon, Novedad, Publicidad } from '@/types';

const DEFAULT_CFG: AppConfig = {
  nombreComercio: 'Barrileros',
  logoEmoji: '🔥',
  logoUrl: '',
  domicilioActivo: true,
  domicilioTipo: 'fijo',
  domicilioValor: 5000,
  mensajeConfirmacion: 'Tu pedido está siendo preparado. ¡Gracias por tu compra!',
  whatsappNumero: '',
};

const DEFAULT_CATEGORIAS = {
  asados: { id: 'asados', nombre: 'Asados', color: '#F4521E', orden: 10 },
  acompañamientos: { id: 'acompañamientos', nombre: 'Acompañamientos', color: '#F9A826', orden: 20 },
  bebidas: { id: 'bebidas', nombre: 'Bebidas', color: '#2D8FDD', orden: 30 },
};

const DEFAULT_PRODUCTOS: Record<string, import('@/types').Producto> = {
  asado_tira: {
    id: 'asado_tira',
    nombre: 'Asado de tira',
    descripcion: 'Corte jugoso con costra dorada y toque ahumado',
    precio: 26000,
    categoriaId: 'asados',
    tipo: 'comestible',
    ingredientes: ['Asado', 'Sal parrillera', 'Chimichurri'],
    adicionales: ['Papas fritas', 'Ensalada', 'Pan de la casa'],
    activo: true,
    emoji: '🥩',
    imgUrl: 'https://salroche.com/cdn/shop/articles/asado-perfecto-1.jpg?v=1574172033',
  },
  chorizo_ahumado: {
    id: 'chorizo_ahumado',
    nombre: 'Chorizo ahumado',
    descripcion: 'Delicioso chorizo con sabor casero y toque picante',
    precio: 8500,
    categoriaId: 'asados',
    tipo: 'comestible',
    ingredientes: ['Chorizo', 'Pimentón', 'Ajo'],
    adicionales: ['Pan', 'Salsa chimichurri'],
    activo: true,
    emoji: '🌭',
    imgUrl: 'https://colanta.com/aprende-de/wp-content/uploads/2019/03/Tipos-de-asados1.jpg',
  },
  papas_fritas: {
    id: 'papas_fritas',
    nombre: 'Papas fritas',
    descripcion: 'Papas crujientes con toque de especias',
    precio: 7000,
    categoriaId: 'acompañamientos',
    tipo: 'comestible',
    ingredientes: ['Papas', 'Aceite', 'Sal'],
    adicionales: ['Kétchup', 'Mayonesa', 'Ají'],
    activo: true,
    emoji: '🍟',
    imgUrl: 'https://chefmont.com/wp-content/uploads/2019/09/asados.jpg',
  },
  gaseosa_litro: {
    id: 'gaseosa_litro',
    nombre: 'Gaseosa 1L',
    descripcion: 'Refresco frío ideal para compartir',
    precio: 6500,
    categoriaId: 'bebidas',
    tipo: 'comestible',
    ingredientes: ['Agua carbonatada', 'Azúcar', 'Aromas'],
    adicionales: ['Hielo extra'],
    activo: true,
    emoji: '🥤',
    imgUrl: 'https://www.elespectador.com/resizer/v2/QLA7BACJXJGAPNEU6L4GR5CZ4E.jpg?auth=91804129bf445a99bd1eff4aa2aa24dc347b909e40c2241fd5d0eb90db443310&width=1200&height=675&smart=true&quality=80',
  },
};

interface ToastState {
  message: string;
  visible: boolean;
  type: 'default' | 'success' | 'error' | 'info';
}

interface AppState {
  cfg: AppConfig;
  productos: Record<string, Producto>;
  categorias: Record<string, Categoria>;
  cupones: Record<string, Cupon>;
  novedades: Record<string, Novedad>;
  publicidades: Publicidad[];
  isLoading: boolean;
  toast: ToastState;
  setCfg: (data: Partial<AppConfig>) => void;
  setProductos: (data: Record<string, Producto>) => void;
  setCategorias: (data: Record<string, Categoria>) => void;
  setCupones: (data: Record<string, Cupon>) => void;
  setNovedades: (data: Record<string, Novedad>) => void;
  setPublicidades: (data: Publicidad[]) => void;
  setLoading: (v: boolean) => void;
  showToast: (message: string, type?: 'default' | 'success' | 'error' | 'info') => void;
}

export const useAppStore = create<AppState>((set) => ({
  cfg: DEFAULT_CFG,
  productos: DEFAULT_PRODUCTOS,
  categorias: DEFAULT_CATEGORIAS,
  cupones: {},
  novedades: {},
  publicidades: [],
  isLoading: true,
  toast: { message: '', visible: false, type: 'default' as const },

  setCfg: (data) => set((s) => ({ cfg: { ...s.cfg, ...data } })),
  setProductos: (data) => set({ productos: data }),
  setCategorias: (data) => set({ categorias: data }),
  setCupones: (data) => set({ cupones: data }),
  setNovedades: (data) => set({ novedades: data }),
  setPublicidades: (data) => set({ publicidades: data }),
  setLoading: (v) => set({ isLoading: v }),
  showToast: (message, type = 'default') => {
    set({ toast: { message, visible: true, type } });
    setTimeout(() => set((s) => ({ toast: { ...s.toast, visible: false } })), 2800);
  },
}));
