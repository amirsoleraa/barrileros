import { describe, it, expect } from 'vitest';
import { evaluatePromos } from './promos';
import type { CartItem, Producto, Promocion } from '@/types';

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return { id: 'prod-a', name: 'Producto A', price: 10000, emoji: '', imgUrl: '', qty: 1, extras: [], ...overrides };
}

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    id: 'prod-b', nombre: 'Producto B', precio: 8000, categoriaId: 'cat',
    tipo: 'comestible', ingredientes: [], adicionales: [], activo: true, ...overrides,
  };
}

function promo(overrides: Partial<Promocion> = {}): Promocion {
  return { id: 'promo-1', nombre: 'Promo', tipo: 'compra_lleva', activa: true, ...overrides };
}

describe('evaluatePromos', () => {
  it('ignores inactive promotions', () => {
    const result = evaluatePromos(
      [promo({ activa: false, productoAId: 'prod-a', productoBId: 'prod-a' })],
      [cartItem({ qty: 2 })],
      0,
    );
    expect(result.promosAplicadas).toHaveLength(0);
  });

  describe('compra_lleva', () => {
    it('discounts product B when it is already in the cart', () => {
      const promos = [promo({
        productoAId: 'prod-a', cantidadA: 2,
        productoBId: 'prod-b', cantidadB: 1,
      })];
      const cart = [cartItem({ id: 'prod-a', qty: 2 }), cartItem({ id: 'prod-b', name: 'Producto B', price: 8000, qty: 1 })];

      const result = evaluatePromos(promos, cart, 0);

      expect(result.descuentoProductos).toBe(8000);
      expect(result.promosAplicadas[0].isVirtualGift).toBe(false);
    });

    it('does not apply when product A quantity requirement is not met', () => {
      const promos = [promo({ productoAId: 'prod-a', cantidadA: 3, productoBId: 'prod-a' })];
      const cart = [cartItem({ qty: 2 })];

      const result = evaluatePromos(promos, cart, 0);

      expect(result.promosAplicadas).toHaveLength(0);
      expect(result.descuentoProductos).toBe(0);
    });

    it('grants product B as a virtual gift (no discount amount) when B is not in the cart', () => {
      const promos = [promo({
        productoAId: 'prod-a', cantidadA: 1,
        productoBId: 'prod-b', cantidadB: 1,
      })];
      const cart = [cartItem({ id: 'prod-a', qty: 1 })];
      const products = { 'prod-b': producto() };

      const result = evaluatePromos(promos, cart, 0, products);

      expect(result.descuentoProductos).toBe(0);
      expect(result.promosAplicadas[0].isVirtualGift).toBe(true);
      expect(result.promosAplicadas[0].productoBNombre).toBe('Producto B');
    });
  });

  describe('compra_descuento', () => {
    it('applies a percentage discount on product B', () => {
      const promos = [promo({
        tipo: 'compra_descuento',
        productoAId: 'prod-a', cantidadA: 1,
        productoBId: 'prod-b', cantidadB: 1, descuentoBPct: 50,
      })];
      const cart = [cartItem({ id: 'prod-a', qty: 1 }), cartItem({ id: 'prod-b', name: 'Producto B', price: 8000, qty: 1 })];

      const result = evaluatePromos(promos, cart, 0);

      expect(result.descuentoProductos).toBe(4000);
    });
  });

  describe('domicilio_descuento', () => {
    it('waives the full delivery fee when domicilioGratis is set', () => {
      const promos = [promo({ tipo: 'domicilio_descuento', domicilioGratis: true })];

      const result = evaluatePromos(promos, [], 6000);

      expect(result.descuentoDomicilio).toBe(6000);
    });

    it('applies a partial percentage discount on the delivery fee', () => {
      const promos = [promo({ tipo: 'domicilio_descuento', domicilioPct: 50 })];

      const result = evaluatePromos(promos, [], 6000);

      expect(result.descuentoDomicilio).toBe(3000);
    });

    it('does nothing when there is no delivery fee to discount', () => {
      const promos = [promo({ tipo: 'domicilio_descuento', domicilioGratis: true })];

      const result = evaluatePromos(promos, [], 0);

      expect(result.descuentoDomicilio).toBe(0);
      expect(result.promosAplicadas).toHaveLength(0);
    });
  });

  describe('compra_cupon', () => {
    it('generates one coupon code when the purchase requirement is met', () => {
      const promos = [promo({ tipo: 'compra_cupon', productoAId: 'prod-a', cantidadA: 1, cuponPct: 15 })];
      const cart = [cartItem({ id: 'prod-a', qty: 1 })];

      const result = evaluatePromos(promos, cart, 0);

      expect(result.cuponesGenerados).toHaveLength(1);
      expect(result.promosAplicadas[0].cuponPct).toBe(15);
    });
  });
});
