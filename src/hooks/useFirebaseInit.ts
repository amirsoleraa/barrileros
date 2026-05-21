import { useEffect } from 'react';
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, firebaseReady } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { applyThemeColors } from '@/lib/utils';
import type { AppConfig, Producto, Categoria, Novedad, Publicidad, Adicional, Barrio, Domiciliario, Promocion } from '@/types';

export function useFirebaseInit() {
  const { setCfg, setProductos, setCategorias, setNovedades, setPublicidades, setAdicionales, setBarrios, setDomiciliarios, setPromociones, setLoading } = useAppStore();

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    // Track first-load of the 2 critical collections before hiding loading screen
    let criticalReady = 0;
    let loadingDone = false;
    function markCritical() {
      criticalReady++;
      if (criticalReady >= 2 && !loadingDone) {
        loadingDone = true;
        setTimeout(() => setLoading(false), 500);
      }
    }

    const unsubs: (() => void)[] = [];

    // Config principal
    unsubs.push(
      onSnapshot(doc(db, 'config', 'main'),
        d => { if (d.exists()) setCfg(d.data() as Partial<AppConfig>); },
        () => {}
      )
    );

    // Colores / tema
    unsubs.push(
      onSnapshot(doc(db, 'config', 'colores'),
        d => {
          if (d.exists()) {
            applyThemeColors(d.data() as Record<string, string>);
          } else {
            try {
              const saved = localStorage.getItem('theme-colors');
              if (saved) applyThemeColors(JSON.parse(saved));
            } catch (_) {}
          }
        },
        () => {
          try {
            const saved = localStorage.getItem('theme-colors');
            if (saved) applyThemeColors(JSON.parse(saved));
          } catch (_) {}
        }
      )
    );

    // Categorías — crítica
    unsubs.push(
      onSnapshot(collection(db, 'categorias'),
        snap => {
          const cats: Record<string, Categoria> = {};
          snap.forEach(d => { cats[d.id] = { id: d.id, ...d.data() } as Categoria; });
          setCategorias(cats);
          markCritical();
        },
        () => markCritical()
      )
    );

    // Productos — crítica
    unsubs.push(
      onSnapshot(collection(db, 'productos'),
        snap => {
          const prods: Record<string, Producto> = {};
          snap.forEach(d => { prods[d.id] = { id: d.id, ...d.data() } as Producto; });
          setProductos(prods);
          markCritical();
        },
        () => markCritical()
      )
    );

    // Adicionales
    unsubs.push(
      onSnapshot(collection(db, 'adicionales'),
        snap => {
          const ads: Record<string, Adicional> = {};
          snap.forEach(d => { ads[d.id] = { id: d.id, ...d.data() } as Adicional; });
          setAdicionales(ads);
        },
        () => {}
      )
    );

    // Novedades
    unsubs.push(
      onSnapshot(collection(db, 'novedades'),
        snap => {
          const novs: Record<string, Novedad> = {};
          snap.forEach(d => { novs[d.id] = { id: d.id, ...d.data() } as Novedad; });
          setNovedades(novs);
        },
        () => {}
      )
    );

    // Publicidades
    unsubs.push(
      onSnapshot(collection(db, 'publicidades'),
        snap => {
          const pubs: Publicidad[] = [];
          snap.forEach(d => pubs.push({ id: d.id, ...d.data() } as Publicidad));
          pubs.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          setPublicidades(pubs.filter(p => p.activa));
        },
        () => {}
      )
    );

    // Barrios
    unsubs.push(
      onSnapshot(collection(db, 'barrios'),
        snap => {
          const bs: Record<string, Barrio> = {};
          snap.forEach(d => { bs[d.id] = { id: d.id, ...d.data() } as Barrio; });
          setBarrios(bs);
        },
        () => {}
      )
    );

    // Domiciliarios — solo para usuarios autenticados (admin o domiciliario)
    let domUnsub: (() => void) | null = null;
    const authUnsub = onAuthStateChanged(auth, user => {
      if (domUnsub) { domUnsub(); domUnsub = null; }
      if (user) {
        domUnsub = onSnapshot(collection(db, 'domiciliarios'),
          snap => {
            const ds: Record<string, Domiciliario> = {};
            snap.forEach(d => { ds[d.id] = { id: d.id, ...d.data() } as Domiciliario; });
            setDomiciliarios(ds);
          },
          () => {}
        );
      }
    });
    unsubs.push(() => { authUnsub(); if (domUnsub) domUnsub(); });

    // Promociones
    unsubs.push(
      onSnapshot(collection(db, 'promociones'),
        snap => {
          const ps: Promocion[] = [];
          snap.forEach(d => ps.push({ id: d.id, ...d.data() } as Promocion));
          ps.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          setPromociones(ps.filter(p => p.activa));
        },
        () => {}
      )
    );

    return () => unsubs.forEach(u => u());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
