// ═══════════════════════════════════════════════
// hooks/useClienteAuth.ts — Firebase Auth del cliente (login opcional)
// ═══════════════════════════════════════════════

import { useState, useEffect } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, updateProfile, signOut, type User,
} from 'firebase/auth';
import { clienteAuth, firebaseReady } from '@/lib/firebase';

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential':   'Correo o contraseña incorrectos',
  'auth/user-not-found':       'Correo o contraseña incorrectos',
  'auth/wrong-password':       'Correo o contraseña incorrectos',
  'auth/invalid-email':        'Correo electrónico inválido',
  'auth/too-many-requests':    'Demasiados intentos. Intenta más tarde',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo',
  'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres',
  'auth/popup-closed-by-user': 'Ventana cerrada antes de terminar',
};

export function useClienteAuth() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseReady) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(clienteAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    try {
      await signInWithEmailAndPassword(clienteAuth, email, password);
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      return AUTH_ERRORS[code] ?? 'Error al ingresar. Intenta de nuevo.';
    }
  }

  async function signUp(nombre: string, email: string, password: string): Promise<string | null> {
    try {
      const cred = await createUserWithEmailAndPassword(clienteAuth, email, password);
      if (nombre.trim()) await updateProfile(cred.user, { displayName: nombre.trim() });
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      return AUTH_ERRORS[code] ?? 'Error al crear la cuenta. Intenta de nuevo.';
    }
  }

  async function signInWithGoogle(): Promise<string | null> {
    try {
      await signInWithPopup(clienteAuth, new GoogleAuthProvider());
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      return AUTH_ERRORS[code] ?? 'Error al ingresar con Google. Intenta de nuevo.';
    }
  }

  async function logOut(): Promise<void> {
    await signOut(clienteAuth);
  }

  return { user, loading, signIn, signUp, signInWithGoogle, logOut };
}
