// ═══════════════════════════════════════════════
// lib/utils.ts — Helpers de la aplicación
// ═══════════════════════════════════════════════

/** Formatea número como moneda colombiana: $1.234.567 */
export function fmtPrice(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO');
}

/** Genera número de pedido criptográficamente seguro (ej: AB3F2E) */
export function generarNumeroPedido(): string {
  const array = new Uint8Array(3);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

/** Mapeo de estados de pedido a etiquetas y colores CSS */
export const ESTADO_INFO: Record<string, { label: string; css: string }> = {
  activos:     { label: 'Activo',       css: 'sp-a' },
  preparando:  { label: 'Preparando',   css: 'sp-p' },
  camino:      { label: 'En camino',    css: 'sp-c' },
  entregado:   { label: 'Entregado',    css: 'sp-e' },
  cancelado:   { label: 'Cancelado',    css: 'sp-x' },
};

/** Valida email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Valida teléfono colombiano (10 dígitos, opcionalmente +57) */
export function isValidPhone(tel: string): boolean {
  return /^(\+57)?[0-9]{10}$/.test(tel.replace(/\s/g, ''));
}

/** Aplica colores CSS personalizados al DOM (document.documentElement) */
export function applyThemeColors(colors: Record<string, string>): void {
  Object.entries(colors).forEach(([k, v]) => {
    document.documentElement.style.setProperty('--' + k, v);
  });
}

/** Presets de temas de color */
export const COLOR_PRESETS: Record<string, Record<string, string>> = {
  fuego: {
    brand: '#F4521E', 'brand-dark': '#C93D0F', 'brand-light': '#FFF0EB',
    bg: '#F7F7F5', text: '#111111', accent: '#FF7A45',
  },
  carbon: {
    brand: '#EF4444', 'brand-dark': '#B91C1C', 'brand-light': '#FEF2F2',
    bg: '#1A1A1A', text: '#F5F5F5', accent: '#F87171',
  },
  selva: {
    brand: '#16A34A', 'brand-dark': '#15803D', 'brand-light': '#F0FDF4',
    bg: '#F7FAF7', text: '#14532D', accent: '#4ADE80',
  },
  noche: {
    brand: '#7C3AED', 'brand-dark': '#6D28D9', 'brand-light': '#F5F3FF',
    bg: '#0F0F1A', text: '#F1F0FF', accent: '#A78BFA',
  },
  oceano: {
    brand: '#0EA5E9', 'brand-dark': '#0284C7', 'brand-light': '#F0F9FF',
    bg: '#F0F9FF', text: '#0C4A6E', accent: '#38BDF8',
  },
};
