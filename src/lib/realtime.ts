// ═══════════════════════════════════════════════
// lib/realtime.ts — helper genérico sobre Supabase Realtime
//
// Reemplaza el patrón onSnapshot(...) + docChanges().forEach(added/modified/
// removed) que se repetía en cada hook/panel con onSnapshot de Firestore.
// A diferencia de onSnapshot, Realtime NO entrega un snapshot inicial —
// solo los cambios a partir de la suscripción — así que cada caller debe
// hacer un `select()` inicial antes de llamar a subscribeTable().
//
// Los payloads llegan en snake_case (columnas de Postgres tal cual); cada
// caller aplica rowToApp()/toCamel() de caseConvert.ts sobre payload.new/old.
// ═══════════════════════════════════════════════

import type { SupabaseClient } from '@supabase/supabase-js';

interface SubscribeOptions<T> {
  /** Filtro postgres_changes, ej. "estado=eq.activa" */
  filter?: string;
  onInsert?: (row: T) => void;
  onUpdate?: (row: T) => void;
  onDelete?: (oldRow: T) => void;
}

export function subscribeTable<T = Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  opts: SubscribeOptions<T>,
): () => void {
  const channelName = `${table}-${Math.random().toString(36).slice(2)}`;
  const channel = client.channel(channelName);

  if (opts.onInsert) {
    channel.on(
      'postgres_changes' as never,
      { event: 'INSERT', schema: 'public', table, filter: opts.filter } as never,
      (payload: { new: T }) => opts.onInsert!(payload.new),
    );
  }
  if (opts.onUpdate) {
    channel.on(
      'postgres_changes' as never,
      { event: 'UPDATE', schema: 'public', table, filter: opts.filter } as never,
      (payload: { new: T }) => opts.onUpdate!(payload.new),
    );
  }
  if (opts.onDelete) {
    channel.on(
      'postgres_changes' as never,
      { event: 'DELETE', schema: 'public', table, filter: opts.filter } as never,
      (payload: { old: T }) => opts.onDelete!(payload.old),
    );
  }

  channel.subscribe();
  return () => { client.removeChannel(channel); };
}
