// ═══════════════════════════════════════════════
// stores/useAdminStore.ts — Estado del panel admin
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import type { Pedido, PedidoTab } from '@/types';

interface AdminState {
  pedidos: Record<string, Pedido>;
  activeTab: PedidoTab;
  pedidosFiltro: string;
  productosFiltro: string;
  pendingLogoFile: File | null;
  pendingProdImgFile: File | null;
  tmpIngrTags: string[];
  tmpExtTags: string[];

  setPedidos: (updater: (prev: Record<string, Pedido>) => Record<string, Pedido>) => void;
  updatePedido: (id: string, data: Partial<Pedido>) => void;
  deletePedidoLocal: (id: string) => void;
  setActiveTab: (tab: PedidoTab) => void;
  setPedidosFiltro: (v: string) => void;
  setProductosFiltro: (v: string) => void;
  setPendingLogoFile: (f: File | null) => void;
  setPendingProdImgFile: (f: File | null) => void;
  setTmpIngrTags: (tags: string[]) => void;
  setTmpExtTags: (tags: string[]) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  pedidos: {},
  activeTab: 'activos',
  pedidosFiltro: '',
  productosFiltro: '',
  pendingLogoFile: null,
  pendingProdImgFile: null,
  tmpIngrTags: [],
  tmpExtTags: [],

  setPedidos: (updater) => set((s) => ({ pedidos: updater(s.pedidos) })),
  updatePedido: (id, data) => set((s) => ({
    pedidos: { ...s.pedidos, [id]: { ...s.pedidos[id], ...data } },
  })),
  deletePedidoLocal: (id) => set((s) => {
    const next = { ...s.pedidos };
    delete next[id];
    return { pedidos: next };
  }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPedidosFiltro: (v) => set({ pedidosFiltro: v }),
  setProductosFiltro: (v) => set({ productosFiltro: v }),
  setPendingLogoFile: (f) => set({ pendingLogoFile: f }),
  setPendingProdImgFile: (f) => set({ pendingProdImgFile: f }),
  setTmpIngrTags: (tags) => set({ tmpIngrTags: tags }),
  setTmpExtTags: (tags) => set({ tmpExtTags: tags }),
}));
