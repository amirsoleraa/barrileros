import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseReady } from '@/lib/firebase';
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
    if (!firebaseReady) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setSession(null); setLoading(false); return; }
      // Check role
      try {
        const userSnap = await getDoc(doc(db, 'users', u.uid));
        const userData  = userSnap.data();
        if (userData?.role !== 'domiciliario') {
          setSession(null);
        } else {
          const domSnap = await getDoc(doc(db, 'domiciliarios', userData.domiciliarioId));
          if (domSnap.exists()) {
            setSession({ user: u, domiciliario: { id: domSnap.id, ...domSnap.data() } as Domiciliario });
          } else {
            setSession(null);
          }
        }
      } catch {
        setSession(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(usuario: string, password: string): Promise<string | null> {
    const email = `${usuario.trim().toLowerCase()}${DOM_EMAIL_DOMAIN}`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return null;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        return 'Usuario o contraseña incorrectos';
      }
      return 'Error al ingresar. Intenta de nuevo.';
    }
  }

  async function logOut(): Promise<void> {
    await signOut(auth);
  }

  return { session, loading, signIn, logOut };
}
