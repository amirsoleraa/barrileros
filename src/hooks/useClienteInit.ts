import { useEffect } from 'react';
import { clienteSupabase as client, supabaseReady } from '@/lib/supabase';
import { subscribeTable } from '@/lib/realtime';
import { rowToApp } from '@/lib/caseConvert';
import { useClienteStore } from '@/stores/useClienteStore';
import type { ClienteProfile } from '@/types';
import type { User } from '@supabase/supabase-js';

/** Sincroniza clientes/{uid} con la sesión de clienteSupabase — crea la fila la primera vez que alguien inicia sesión. */
export function useClienteInit() {
  const { setCliente, setLoading } = useClienteStore();

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }

    let rowUnsub: (() => void) | null = null;

    async function loadOrCreate(user: User) {
      const { data } = await client.from('clientes').select('*').eq('id', user.id).single();
      if (data) {
        setCliente(rowToApp<ClienteProfile>(data, ['createdAt']));
      } else {
        const nombre = (user.user_metadata?.full_name as string | undefined)
          ?? (user.user_metadata?.name as string | undefined)
          ?? '';
        const { data: created } = await client.from('clientes').insert({
          id: user.id,
          nombre,
          correo: user.email ?? '',
          telefono: user.phone ?? '',
          favoritos: [],
        }).select().single();
        if (created) setCliente(rowToApp<ClienteProfile>(created, ['createdAt']));
      }
      setLoading(false);

      rowUnsub = subscribeTable<Record<string, unknown>>(client, 'clientes', {
        filter: `id=eq.${user.id}`,
        onUpdate: (r) => setCliente(rowToApp<ClienteProfile>(r, ['createdAt'])),
      });
    }

    async function resolveSession(user: User | null) {
      if (rowUnsub) { rowUnsub(); rowUnsub = null; }
      if (!user) { setCliente(null); setLoading(false); return; }
      await loadOrCreate(user);
    }

    client.auth.getSession().then(({ data }) => resolveSession(data.session?.user ?? null));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      resolveSession(session?.user ?? null);
    });

    return () => { sub.subscription.unsubscribe(); if (rowUnsub) rowUnsub(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
