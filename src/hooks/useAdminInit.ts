// ═══════════════════════════════════════════════
// hooks/useAdminInit.ts — Carga admin + onSnapshot pedidos
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { getDoc, getDocs, doc, collection, onSnapshot } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { applyThemeColors } from '@/lib/utils';
import type { AppConfig, AdminSettings, Producto, Categoria, Cupon, Novedad, Pedido, Adicional, Barrio, Domiciliario, Promocion } from '@/types';

export function useAdminInit() {
  const { setCfg, setProductos, setCategorias, setCupones, setNovedades, setAdicionales, setBarrios, setDomiciliarios, setPromociones, showToast } = useAppStore();
  const { setPedidos, setAdminSettings } = useAdminStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseReady) {
      setReady(true);
      return;
    }

    let isFirstLoad = true;

    async function init() {
      try {
        const [cfgDoc, colorDoc, catSnap, prodSnap, cupSnap, novSnap, adminSettingsDoc] = await Promise.all([
          getDoc(doc(db, 'config', 'main')),
          getDoc(doc(db, 'config', 'colores')),
          getDocs(collection(db, 'categorias')),
          getDocs(collection(db, 'productos')),
          getDocs(collection(db, 'cupones')),
          getDocs(collection(db, 'novedades')),
          getDoc(doc(db, 'config', 'adminSettings')),
        ]);

        if (cfgDoc.exists()) setCfg(cfgDoc.data() as Partial<AppConfig>);
        if (colorDoc.exists()) applyThemeColors(colorDoc.data() as Record<string, string>);
        if (adminSettingsDoc.exists()) setAdminSettings(adminSettingsDoc.data() as AdminSettings);

        const cats:  Record<string, Categoria>   = {};
        const prods: Record<string, Producto>    = {};
        const cups:  Record<string, Cupon>       = {};
        const novs:  Record<string, Novedad>     = {};

        catSnap.forEach(d  => { cats[d.id]  = { id: d.id, ...d.data() } as Categoria; });
        prodSnap.forEach(d => { prods[d.id] = { id: d.id, ...d.data() } as Producto; });
        cupSnap.forEach(d  => { cups[d.id]  = { id: d.id, ...d.data() } as Cupon; });
        novSnap.forEach(d  => { novs[d.id]  = { id: d.id, ...d.data() } as Novedad; });

        setCategorias(cats);
        setProductos(prods);
        setCupones(cups);
        setNovedades(novs);

        // Adicionales — no bloquea el resto si la colección no existe aún
        try {
          const adSnap = await getDocs(collection(db, 'adicionales'));
          const ads: Record<string, Adicional> = {};
          adSnap.forEach(d => { ads[d.id] = { id: d.id, ...d.data() } as Adicional; });
          setAdicionales(ads);
        } catch (_) {}

        // Barrios
        try {
          const bSnap = await getDocs(collection(db, 'barrios'));
          const bs: Record<string, Barrio> = {};
          bSnap.forEach(d => { bs[d.id] = { id: d.id, ...d.data() } as Barrio; });
          setBarrios(bs);
        } catch (_) {}

        // Domiciliarios
        try {
          const dSnap = await getDocs(collection(db, 'domiciliarios'));
          const ds: Record<string, Domiciliario> = {};
          for (const d of dSnap.docs) { ds[d.id] = { id: d.id, ...d.data() } as Domiciliario; }
          setDomiciliarios(ds);
        } catch (_) {}

        // Promociones
        try {
          const pSnap = await getDocs(collection(db, 'promociones'));
          const ps: Promocion[] = [];
          for (const d of pSnap.docs) { ps.push({ id: d.id, ...d.data() } as Promocion); }
          setPromociones(ps.filter(p => p.activa));
        } catch (_) {}
      } catch (e) {
        console.error('Error al inicializar admin:', e);
      }
    }

    init().then(() => setReady(true));

    // Suscripción en tiempo real a pedidos
    const unsubscribe = onSnapshot(collection(db, 'pedidos'), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = { id: change.doc.id, ...change.doc.data() } as Pedido;
        if (change.type === 'added') {
          setPedidos((prev) => ({ ...prev, [data.id]: data }));
          if (!isFirstLoad) {
            showToast(`🔔 Nuevo pedido #${data.numero}`);
          }
        } else if (change.type === 'modified') {
          setPedidos((prev) => ({ ...prev, [data.id]: data }));
        } else if (change.type === 'removed') {
          setPedidos((prev) => {
            const next = { ...prev };
            delete next[data.id];
            return next;
          });
        }
      });
      isFirstLoad = false;
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ready;
}
