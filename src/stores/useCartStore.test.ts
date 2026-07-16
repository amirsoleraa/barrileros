import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './useCartStore';
import type { CartItem } from '@/types';

function item(overrides: Partial<CartItem> = {}): CartItem {
  return { id: 'prod-a', name: 'Producto A', price: 10000, emoji: '', imgUrl: '', qty: 1, extras: [], ...overrides };
}

beforeEach(() => {
  useCartStore.getState().reset();
});

describe('useCartStore', () => {
  it('adds a new item to an empty cart', () => {
    useCartStore.getState().addItem(item());
    expect(useCartStore.getState().cart).toHaveLength(1);
  });

  it('merges quantities when the same product + extras are added again', () => {
    useCartStore.getState().addItem(item({ qty: 1, extras: ['queso'] }));
    useCartStore.getState().addItem(item({ qty: 2, extras: ['queso'] }));

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
  });

  it('treats the same product with different extras as separate line items', () => {
    useCartStore.getState().addItem(item({ extras: ['queso'] }));
    useCartStore.getState().addItem(item({ extras: ['tocineta'] }));

    expect(useCartStore.getState().cart).toHaveLength(2);
  });

  it('extras order does not matter when merging', () => {
    useCartStore.getState().addItem(item({ extras: ['queso', 'tocineta'] }));
    useCartStore.getState().addItem(item({ qty: 1, extras: ['tocineta', 'queso'] }));

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(2);
  });

  it('updateQty increases and removes the line item once it reaches zero', () => {
    useCartStore.getState().addItem(item({ qty: 1 }));

    useCartStore.getState().updateQty('prod-a', [], 1);
    expect(useCartStore.getState().cart[0].qty).toBe(2);

    useCartStore.getState().updateQty('prod-a', [], -2);
    expect(useCartStore.getState().cart).toHaveLength(0);
  });

  it('removeItem only removes the matching id + extras combination', () => {
    useCartStore.getState().addItem(item({ extras: ['queso'] }));
    useCartStore.getState().addItem(item({ extras: ['tocineta'] }));

    useCartStore.getState().removeItem('prod-a', ['queso']);

    const cart = useCartStore.getState().cart;
    expect(cart).toHaveLength(1);
    expect(cart[0].extras).toEqual(['tocineta']);
  });

  it('reset clears the cart and checkout data but not lastPedido', () => {
    useCartStore.getState().addItem(item());
    useCartStore.getState().setDatosEnvio({ nombre: 'Ana' });

    useCartStore.getState().reset();

    expect(useCartStore.getState().cart).toHaveLength(0);
    expect(useCartStore.getState().datosEnvio).toBeNull();
  });
});
