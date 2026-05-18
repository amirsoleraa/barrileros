import type { CartItem } from '@/types';
import type { Promocion, PromoAplicada } from '@/types';

export interface PromoResult {
  promosAplicadas: PromoAplicada[];
  descuentoProductos: number;
  descuentoDomicilio: number;
  cuponesGenerados: string[];
}

function randomCode(): string {
  return 'PROMO' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export function evaluatePromos(
  promos: Promocion[],
  cart: CartItem[],
  domicilio: number,
): PromoResult {
  const result: PromoResult = {
    promosAplicadas: [],
    descuentoProductos: 0,
    descuentoDomicilio: 0,
    cuponesGenerados: [],
  };

  const activePromos = promos.filter(p => p.activa);

  for (const promo of activePromos) {
    if (promo.tipo === 'compra_lleva') {
      const prodAId  = promo.productoAId;
      const cantA    = promo.cantidadA ?? 1;
      const prodBId  = promo.productoBId || prodAId;
      const cantB    = promo.cantidadB ?? 1;

      const itemA = prodAId
        ? cart.find(i => i.id === prodAId && i.qty >= cantA)
        : cart.find(i => i.qty >= cantA);

      if (!itemA) continue;

      const itemB = prodBId
        ? cart.find(i => i.id === prodBId)
        : itemA;

      if (!itemB) continue;

      const cantidadBReal = Math.min(cantB, itemB.qty);
      const discountAmt = itemB.price * cantidadBReal;
      result.descuentoProductos += discountAmt;
      result.promosAplicadas.push({
        promoId: promo.id,
        nombre: promo.nombre,
        tipo: promo.tipo,
        descuentoProducto: discountAmt,
        productoBNombre: itemB.name,
        cantidadBReal,
      });
    }

    else if (promo.tipo === 'compra_descuento') {
      const prodAId  = promo.productoAId;
      const cantA    = promo.cantidadA ?? 1;
      const prodBId  = promo.productoBId || prodAId;
      const descPct  = promo.descuentoBPct ?? 0;

      const itemA = prodAId
        ? cart.find(i => i.id === prodAId && i.qty >= cantA)
        : cart.find(i => i.qty >= cantA);

      if (!itemA) continue;

      const itemB = prodBId
        ? cart.find(i => i.id === prodBId)
        : itemA;

      if (!itemB) continue;

      const discountAmt = Math.round(itemB.price * (promo.cantidadB ?? 1) * descPct / 100);
      result.descuentoProductos += discountAmt;
      result.promosAplicadas.push({
        promoId: promo.id,
        nombre: promo.nombre,
        tipo: promo.tipo,
        descuentoProducto: discountAmt,
      });
    }

    else if (promo.tipo === 'domicilio_descuento' && domicilio > 0) {
      const discountAmt = promo.domicilioGratis
        ? domicilio
        : Math.round(domicilio * (promo.domicilioPct ?? 100) / 100);
      result.descuentoDomicilio += discountAmt;
      result.promosAplicadas.push({
        promoId: promo.id,
        nombre: promo.nombre,
        tipo: promo.tipo,
        descuentoDomicilio: discountAmt,
      });
    }

    else if (promo.tipo === 'compra_cupon') {
      const prodAId = promo.productoAId;
      const cantA   = promo.cantidadA ?? 1;

      const itemA = prodAId
        ? cart.find(i => i.id === prodAId && i.qty >= cantA)
        : cart.find(i => i.qty >= cantA);

      if (!itemA) continue;

      const code = randomCode();
      result.cuponesGenerados.push(code);
      result.promosAplicadas.push({
        promoId: promo.id,
        nombre: promo.nombre,
        tipo: promo.tipo,
        cuponGenerado: code,
      });
    }
  }

  return result;
}
