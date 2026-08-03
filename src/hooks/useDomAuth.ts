import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { domSupabase as client, supabaseReady } from '@/lib/supabase';
import { rowToApp } from '@/lib/caseConvert';
import type { Domiciliario } from '@/types';

const DOM_EMAIL_DOMAIN = '@dom.barrileros.co';

export interface DomSession {
  user: User;
  domiciliario: Domiciliario;
}

export function useDomAuth() {
  const [session, setSession]   = useState<DomSession | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }

    async function resolveSession(user: User | null) {
      if (!user) { setSession(null); setLoading(false); return; }
      try {
        const { data: profile } = await client.from('profiles').select('role, domiciliario_id').eq('id', user.id).single();
        if (profile?.role !== 'domiciliario' || !profile.domiciliario_id) {
          setSession(null);
        } else {
          const { data: domRow } = await client.from('domiciliarios').select('*').eq('id', profile.domiciliario_id).single();
          if (domRow) {
            setSession({ user, domiciliario: rowToApp<Domiciliario>(domRow) });
          } else {
            setSession(null);
          }
        }
      } catch {
        setSession(null);
      }
      setLoading(false);
    }

    client.auth.getSession().then(({ data }) => resolveSession(data.session?.user ?? null));
    const { data: sub } = client.auth.onAuthStateChange((_event, sess) => {
      setLoading(true);
      resolveSession(sess?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(usuario: string, password: string): Promise<string | null> {
    const email = `${usuario.trim().toLowerCase()}${DOM_EMAIL_DOMAIN}`;
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (!error) return null;
    if (error.message === 'Invalid login credentials') return 'Usuario o contraseña incorrectos';
    return 'Error al ingresar. Intenta de nuevo.';
  }

  async function logOut(): Promise<void> {
    await client.auth.signOut();
  }

  return { session, loading, signIn, logOut };
}
