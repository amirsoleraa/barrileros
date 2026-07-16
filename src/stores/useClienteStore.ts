// ═══════════════════════════════════════════════
// stores/useClienteStore.ts — Sesión y perfil del cliente (login opcional)
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import type { ClienteProfile } from '@/types';

interface ClienteState {
  cliente: ClienteProfile | null;
  loading: boolean;
  setCliente: (data: ClienteProfile | null) => void;
  setLoading: (v: boolean) => void;
}

export const useClienteStore = create<ClienteState>((set) => ({
  cliente: null,
  loading: true,
  setCliente: (data) => set({ cliente: data }),
  setLoading: (v) => set({ loading: v }),
}));
