// ═══════════════════════════════════════════════
// stores/useCartStore.ts — Carrito + Checkout
// Persiste en sessionStorage (sobrevive recarga, limpia al cerrar pestaña)
// ═══════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, DatosEnvio, Cupon, Pedido, LocationData } from '@/types';

interface CartState {
  cart: CartItem[];
  datosEnvio: DatosEnvio | null;
  locationData: LocationData | null;
  cuponAplicado: Cupon | null;
  lastPedido: Pedido | null;
  cartOpen: boolean;

  addItem: (item: CartItem) => void;
  updateQty: (id: string, extras: string[], delta: number) => void;
  removeItem: (id: string, extras: string[]) => void;
  setDatosEnvio: (datos: DatosEnvio) => void;
  setLocationData: (location: LocationData | null) => void;
  setCuponAplicado: (cupon: Cupon | null) => void;
  setLastPedido: (pedido: Pedido) => void;
  setCartOpen: (open: boolean) => void;
  reset: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      datosEnvio: null,
      locationData: null,
      cuponAplicado: null,
      lastPedido: null,
      cartOpen: false,

      addItem: (incoming) => {
        const existing = get().cart.find(
          (i) => i.id === incoming.id &&
            JSON.stringify(i.extras.slice().sort()) === JSON.stringify(incoming.extras.slice().sort())
        );
        if (existing) {
          set((s) => ({
            cart: s.cart.map((i) =>
              i === existing ? { ...i, qty: i.qty + incoming.qty } : i
            ),
          }));
        } else {
          set((s) => ({ cart: [...s.cart, incoming] }));
        }
      },

      updateQty: (id, extras, delta) =>
        set((s) => ({
          cart: s.cart
            .map((i) =>
              i.id === id &&
              JSON.stringify(i.extras.slice().sort()) === JSON.stringify(extras.slice().sort())
                ? { ...i, qty: i.qty + delta }
                : i
            )
            .filter((i) => i.qty > 0),
        })),

      removeItem: (id, extras) =>
        set((s) => ({
          cart: s.cart.filter(
            (i) => !(i.id === id &&
              JSON.stringify(i.extras.slice().sort()) === JSON.stringify(extras.slice().sort()))
          ),
        })),

      setDatosEnvio: (datos) => set({ datosEnvio: datos }),
      setLocationData: (location) => set({ locationData: location }),
      setCuponAplicado: (cupon) => set({ cuponAplicado: cupon }),
      setLastPedido: (pedido) => set({ lastPedido: pedido }),
      setCartOpen: (open) => set({ cartOpen: open }),

      reset: () => set({ cart: [], datosEnvio: null, locationData: null, cuponAplicado: null }),
    }),
    {
      name: 'ab_cart',
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ cart: s.cart, datosEnvio: s.datosEnvio, locationData: s.locationData, cuponAplicado: s.cuponAplicado }),
      migrate: () => ({ cart: [], datosEnvio: null, locationData: null, cuponAplicado: null }),
    }
  )
);
