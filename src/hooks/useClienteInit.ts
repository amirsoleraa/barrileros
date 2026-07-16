import { useEffect } from 'react';
import { onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { clienteAuth, clienteDb, firebaseReady } from '@/lib/firebase';
import { useClienteStore } from '@/stores/useClienteStore';
import type { ClienteProfile } from '@/types';

/** Sincroniza clientes/{uid} con la sesión de clienteAuth — crea el doc la primera vez que alguien inicia sesión. */
export function useClienteInit() {
  const { setCliente, setLoading } = useClienteStore();

  useEffect(() => {
    if (!firebaseReady) { setLoading(false); return; }

    let docUnsub: (() => void) | null = null;
    const authUnsub = onAuthStateChanged(clienteAuth, user => {
      if (docUnsub) { docUnsub(); docUnsub = null; }
      if (!user) { setCliente(null); setLoading(false); return; }

      const ref = doc(clienteDb, 'clientes', user.uid);
      docUnsub = onSnapshot(ref,
        snap => {
          if (snap.exists()) {
            setCliente({ id: snap.id, ...snap.data() } as ClienteProfile);
          } else {
            setDoc(ref, {
              nombre: user.displayName ?? '',
              correo: user.email ?? '',
              telefono: user.phoneNumber ?? '',
              favoritos: [],
              createdAt: serverTimestamp(),
            }).catch(() => {});
          }
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => { authUnsub(); if (docUnsub) docUnsub(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
