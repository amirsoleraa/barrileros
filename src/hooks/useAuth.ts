// ═══════════════════════════════════════════════
// hooks/useAuth.ts — Firebase Auth state
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/user-not-found':     'Correo o contraseña incorrectos',
  'auth/wrong-password':     'Correo o contraseña incorrectos',
  'auth/invalid-email':      'Correo electrónico inválido',
  'auth/too-many-requests':  'Demasiados intentos. Intenta más tarde',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      return AUTH_ERRORS[code] ?? 'Error al ingresar. Intenta de nuevo.';
    }
  }

  async function logOut(): Promise<void> {
    await signOut(auth);
  }

  return { user, loading, signIn, logOut };
}
