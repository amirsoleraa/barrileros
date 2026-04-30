// ═══════════════════════════════════════════════
// lib/email.ts — Confirmación de pedido por EmailJS
// ═══════════════════════════════════════════════

import emailjs from '@emailjs/browser';
import type { Pedido } from '@/types';

const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? '';
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '';

let initialized = false;

function init() {
  if (initialized) return;
  if (PUBLIC_KEY && !PUBLIC_KEY.startsWith('__')) {
    emailjs.init({ publicKey: PUBLIC_KEY });
    initialized = true;
  }
}

export async function sendOrderConfirmation(pedido: Pedido, comercioNombre: string): Promise<void> {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    console.warn('📧 EmailJS no configurado — saltando envío');
    return;
  }
  if (!pedido.cliente?.correo) {
    console.warn('📧 Pedido sin correo del cliente — saltando envío');
    return;
  }

  init();

  const itemsList = (pedido.items || [])
    .map(i => {
      const extras = i.extras?.length ? ` (+ ${i.extras.join(', ')})` : '';
      return `• ${i.nombre} x${i.qty}${extras}: $${((i.precio || 0) * i.qty).toLocaleString('es-CO')}`;
    })
    .join('\n');

  const params = {
    to_email:     pedido.cliente.correo,
    to_name:      pedido.cliente.nombre || 'Cliente',
    comercio:     comercioNombre || 'Asados al Barril',
    order_number: pedido.numero,
    items:        itemsList,
    subtotal:     '$' + (pedido.subtotal  || 0).toLocaleString('es-CO'),
    domicilio:    pedido.domicilio ? '$' + pedido.domicilio.toLocaleString('es-CO') : 'Gratis',
    descuento:    pedido.descuento ? '-$' + pedido.descuento.toLocaleString('es-CO') : '$0',
    total:        '$' + (pedido.total     || 0).toLocaleString('es-CO'),
    direccion:    (pedido.cliente.dir || '') + (pedido.cliente.comp ? ', ' + pedido.cliente.comp : ''),
    mensaje:      pedido.mensajeConfirmacion || '¡Tu pedido está siendo preparado con todo el amor!',
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params);
    console.log('📧 Confirmación enviada a', pedido.cliente.correo);
  } catch (e) {
    console.error('❌ Error al enviar email:', e);
  }
}
