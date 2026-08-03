// ═══════════════════════════════════════════════
// hooks/useClienteAuth.ts — Supabase Auth del cliente (login opcional)
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { clienteSupabase as client, supabaseReady } from '@/lib/supabase';

const AUTH_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Invalid email':             'Correo electrónico inválido',
  'User already registered':   'Ya existe una cuenta con ese correo',
  'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
};

export function useClienteAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }
    client.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (!error) return null;
    return AUTH_ERRORS[error.message] ?? 'Error al ingresar. Intenta de nuevo.';
  }

  async function signUp(nombre: string, email: string, password: string): Promise<string | null> {
    const { error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: nombre.trim() } },
    });
    if (!error) return null;
    return AUTH_ERRORS[error.message] ?? 'Error al crear la cuenta. Intenta de nuevo.';
  }

  async function signInWithGoogle(): Promise<string | null> {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      console.error('[signInWithGoogle]', error);
      return `Error al ingresar con Google (${error.message})`;
    }
    return null; // el navegador redirige a Google; el flujo continúa al volver
  }

  async function logOut(): Promise<void> {
    await client.auth.signOut();
  }

  return { user, loading, signIn, signUp, signInWithGoogle, logOut };
}
