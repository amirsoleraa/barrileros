// ═══════════════════════════════════════════════
// lib/supabase.ts — Supabase init con VITE_* env vars
// ═══════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export let supabase!: SupabaseClient;
// Cliente aislado del portal de domiciliario para que su sesión no choque
// con la del admin ni la del cliente en el mismo navegador.
export let domSupabase!: SupabaseClient;
// Cliente aislado de la cuenta del cliente (login/historial/direcciones), misma razón.
export let clienteSupabase!: SupabaseClient;

/** true sólo cuando Supabase se inicializó correctamente con credenciales reales */
export let supabaseReady = false;

try {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-admin-auth' },
  });
  domSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-dom-auth' },
  });
  clienteSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { storageKey: 'sb-cliente-auth' },
  });

  supabaseReady = true;
} catch (e) {
  console.warn('[Supabase] Sin credenciales — la app corre en modo sin conexión.');
}
