import { useEffect } from 'react';
import { getDoc, getDocs, doc, collection } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { applyThemeColors } from '@/lib/utils';
import type { AppConfig, Producto, Categoria, Cupon, Novedad, Publicidad, Adicional } from '@/types';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), ms)
    ),
  ]);
}

export function useFirebaseInit() {
  const { setCfg, setProductos, setCategorias, setCupones, setNovedades, setPublicidades, setAdicionales, setLoading } = useAppStore();

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }

    async function init() {
      try {
        // Config se carga por separado — si falla (sin red o permisos) no bloquea el catálogo
        getDoc(doc(db, 'config', 'main')).then(d => {
          if (d.exists()) setCfg(d.data() as Partial<AppConfig>);
        }).catch(() => {});

        getDoc(doc(db, 'config', 'colores')).then(d => {
          if (d.exists()) {
            applyThemeColors(d.data() as Record<string, string>);
          } else {
            try {
              const saved = localStorage.getItem('theme-colors');
              if (saved) applyThemeColors(JSON.parse(saved));
            } catch (_) {}
          }
        }).catch(() => {
          try {
            const saved = localStorage.getItem('theme-colors');
            if (saved) applyThemeColors(JSON.parse(saved));
          } catch (_) {}
        });

        // Catálogo crítico — timeout de 8 s
        const [catSnap, prodSnap, cupSnap] = await withTimeout(
          Promise.all([
            getDocs(collection(db, 'categorias')),
            getDocs(collection(db, 'productos')),
            getDocs(collection(db, 'cupones')),
          ]),
          8000
        );

        const cats: Record<string, Categoria> = {};
        const prods: Record<string, Producto> = {};
        const cups: Record<string, Cupon>     = {};

        catSnap.forEach(d  => { cats[d.id]  = { id: d.id, ...d.data() } as Categoria; });
        prodSnap.forEach(d => { prods[d.id] = { id: d.id, ...d.data() } as Producto; });
        cupSnap.forEach(d  => { cups[d.id]  = { id: d.id, ...d.data() } as Cupon; });

        setCategorias(cats);
        setProductos(prods);
        setCupones(cups);

        // No bloqueantes
        getDocs(collection(db, 'adicionales')).then(snap => {
          const ads: Record<string, Adicional> = {};
          snap.forEach(d => { ads[d.id] = { id: d.id, ...d.data() } as Adicional; });
          setAdicionales(ads);
        }).catch(() => {});

        // No bloqueantes
        getDocs(collection(db, 'novedades')).then(snap => {
          const novs: Record<string, Novedad> = {};
          snap.forEach(d => { novs[d.id] = { id: d.id, ...d.data() } as Novedad; });
          setNovedades(novs);
        }).catch(() => {});

        getDocs(collection(db, 'publicidades')).then(snap => {
          const pubs: Publicidad[] = [];
          snap.forEach(d => pubs.push({ id: d.id, ...d.data() } as Publicidad));
          pubs.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          setPublicidades(pubs.filter(p => p.activa));
        }).catch(() => {});

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('offline') || msg.includes('timeout') || msg.includes('unavailable')) {
          console.warn('[Firebase] Sin conexión — la tienda carga vacía.');
        } else {
          console.error('[Firebase] Error al cargar datos:', e);
        }
      } finally {
        await new Promise(r => setTimeout(r, 2800));
        setLoading(false);
      }
    }

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
