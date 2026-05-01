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
  productos: {},
  categorias: {},
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
