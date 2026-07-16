import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();

interface PedidoItem {
  id: string;
  nombre: string;
  precio: number;
  qty: number;
}

interface Verificacion {
  ok: boolean;
  motivo?: string;
  subtotalReal?: number;
}

// Margen de redondeo en pesos (los precios se manejan como enteros)
const TOLERANCIA = 1;

/**
 * Recalcula el pedido contra datos que el cliente NO controla (catálogo de
 * productos y cupones reales) para detectar manipulación del carrito hecha
 * directamente contra Firestore (saltándose la UI de la tienda).
 *
 * No cancela ni corrige el pedido automáticamente — solo lo marca para que
 * el admin lo revise, porque un falso positivo (ej. un producto borrado
 * después de hacer el pedido) no debe bloquear a un cliente real.
 */
async function verificarPedido(pedido: FirebaseFirestore.DocumentData): Promise<Verificacion> {
  const items = (pedido.items ?? []) as PedidoItem[];
  if (items.length === 0) return { ok: false, motivo: 'Pedido sin items' };

  const ids = [...new Set(items.map((i) => i.id))].filter(Boolean);
  const snaps = await db.getAll(...ids.map((id) => db.doc(`productos/${id}`)));
  const precios = new Map<string, number>();
  snaps.forEach((s) => { if (s.exists) precios.set(s.id, (s.data()!.precio as number) ?? 0); });

  let subtotalReal = 0;
  for (const it of items) {
    const precioReal = precios.get(it.id);
    if (precioReal === undefined) {
      return { ok: false, motivo: `El producto "${it.nombre}" (${it.id}) ya no existe en el catálogo` };
    }
    if (Math.abs(precioReal - it.precio) > TOLERANCIA) {
      return {
        ok: false,
        motivo: `Precio de "${it.nombre}" no coincide: catálogo dice ${precioReal}, el pedido dice ${it.precio}`,
      };
    }
    subtotalReal += precioReal * it.qty;
  }

  if (Math.abs(subtotalReal - ((pedido.subtotal as number) ?? 0)) > TOLERANCIA) {
    return {
      ok: false,
      motivo: `Subtotal no coincide: real ${subtotalReal}, el pedido dice ${pedido.subtotal}`,
      subtotalReal,
    };
  }

  // Si se usó un cupón, verificar que existe, está activo y no se agotó
  const cuponCodigo = pedido.cupon as string | null | undefined;
  if (cuponCodigo) {
    const cuponSnap = await db.doc(`cupones/${cuponCodigo}`).get();
    if (!cuponSnap.exists) return { ok: false, motivo: `El cupón "${cuponCodigo}" no existe`, subtotalReal };
    const cup = cuponSnap.data()!;
    if (cup.activo !== true) return { ok: false, motivo: `El cupón "${cuponCodigo}" está inactivo`, subtotalReal };
    if ((cup.usos ?? 0) >= (cup.limite ?? 1)) {
      return { ok: false, motivo: `El cupón "${cuponCodigo}" ya se agotó`, subtotalReal };
    }
  }

  // El total debe cuadrar con lo que el propio pedido declara (subtotal real +
  // domicilio - descuento). Esto atrapa el caso más simple de manipulación:
  // dejar todo lo demás intacto y solo cambiar `total` a un valor bajo.
  const totalEsperado = subtotalReal + ((pedido.domicilio as number) ?? 0) - ((pedido.descuento as number) ?? 0);
  if (Math.abs(totalEsperado - ((pedido.total as number) ?? 0)) > TOLERANCIA) {
    return {
      ok: false,
      motivo: `Total no cuadra: subtotal ${subtotalReal} + domicilio ${pedido.domicilio ?? 0} - descuento ${pedido.descuento ?? 0} = ${totalEsperado}, pero el pedido dice ${pedido.total}`,
      subtotalReal,
    };
  }

  return { ok: true, subtotalReal };
}

/**
 * Trigger: se ejecuta cuando se crea un pedido nuevo.
 * 1. Incrementa usos del cupón de forma atómica (transacción Firestore).
 * 2. Crea una notificación en cada perfil de domiciliario activo.
 * 3. Verifica el pedido contra el catálogo real y marca `verificacion` si algo no cuadra.
 */
export const onNuevoPedido = onDocumentCreated('pedidos/{pedidoId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const pedido = snap.data();
  const { pedidoId } = event.params;

  // ── 1. Incremento atómico del cupón ───────────────────────────────────────
  const cupon = pedido.cupon as string | null | undefined;
  if (cupon) {
    const cuponRef = db.doc(`cupones/${cupon}`);
    await db
      .runTransaction(async (tx) => {
        const cuponSnap = await tx.get(cuponRef);
        if (!cuponSnap.exists) return;
        const usos = (cuponSnap.data()!.usos as number | undefined) ?? 0;
        tx.update(cuponRef, { usos: usos + 1 });
      })
      .catch((e: unknown) => console.error('[onNuevoPedido] coupon increment error:', e));
  }

  // ── 2. Notificaciones a domiciliarios ─────────────────────────────────────
  const domSnap = await db.collection('domiciliarios').get().catch(() => null);
  if (domSnap && !domSnap.empty) {
    const batch = db.batch();
    domSnap.forEach((domDoc) => {
      const notifRef = db
        .collection('notificaciones')
        .doc(domDoc.id)
        .collection('items')
        .doc();
      batch.set(notifRef, {
        tipo: 'nuevo_pedido',
        pedidoId,
        numero: String(pedido.numero ?? ''),
        clienteNombre: String((pedido.cliente as Record<string, unknown>)?.nombre ?? ''),
        createdAt: new Date(),
        leida: false,
      });
    });

    await batch
      .commit()
      .catch((e: unknown) => console.error('[onNuevoPedido] notifications error:', e));
  }

  // ── 3. Verificación anti-manipulación ─────────────────────────────────────
  try {
    const resultado = await verificarPedido(pedido);
    await snap.ref.update({
      verificacion: {
        ...resultado,
        verificadoEn: FieldValue.serverTimestamp(),
      },
    });
    if (!resultado.ok) {
      console.warn(`[onNuevoPedido] Pedido ${pedidoId} sospechoso: ${resultado.motivo}`);
    }
  } catch (e: unknown) {
    console.error('[onNuevoPedido] verification error:', e);
  }
});
