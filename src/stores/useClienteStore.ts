// ═══════════════════════════════════════════════
// stores/useClienteStore.ts — Sesión y perfil del cliente (login opcional)
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { clienteDb } from '@/lib/firebase';
import type { ClienteProfile } from '@/types';

interface ClienteState {
  cliente: ClienteProfile | null;
  loading: boolean;
  setCliente: (data: ClienteProfile | null) => void;
  setLoading: (v: boolean) => void;
  toggleFavorito: (productId: string) => Promise<void>;
}

export const useClienteStore = create<ClienteState>((set, get) => ({
  cliente: null,
  loading: true,
  setCliente: (data) => set({ cliente: data }),
  setLoading: (v) => set({ loading: v }),

  toggleFavorito: async (productId) => {
    const { cliente } = get();
    if (!cliente) return;
    const isFav = cliente.favoritos.includes(productId);
    const next = isFav
      ? cliente.favoritos.filter(id => id !== productId)
      : [...cliente.favoritos, productId];

    set({ cliente: { ...cliente, favoritos: next } });
    try {
      await updateDoc(doc(clienteDb, 'clientes', cliente.id), {
        favoritos: isFav ? arrayRemove(productId) : arrayUnion(productId),
      });
    } catch {
      set({ cliente });
    }
  },
}));
