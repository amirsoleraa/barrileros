// ═══════════════════════════════════════════════
// hooks/useAdminInit.ts — Carga admin + tiempo real de pedidos
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { subscribeTable } from '@/lib/realtime';
import { rowToApp } from '@/lib/caseConvert';
import { useAppStore } from '@/stores/useAppStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { applyThemeColors } from '@/lib/utils';
import type { AppConfig, AdminSettings, Producto, Categoria, Cupon, Novedad, Pedido, Adicional, Barrio, Domiciliario, Promocion } from '@/types';

export function useAdminInit() {
  const { setCfg, setProductos, setCategorias, setCupones, setNovedades, setAdicionales, setBarrios, setDomiciliarios, setPromociones, showToast } = useAppStore();
  const { setPedidos, setAdminSettings } = useAdminStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabaseReady) {
      setReady(true);
      return;
    }

    let isFirstLoad = true;

    async function init() {
      try {
        const [cfgRow, colorRow, catRows, prodRows, cupRows, novRows, adminSettingsRow] = await Promise.all([
          supabase.from('config').select('data').eq('key', 'main').single(),
          supabase.from('config').select('data').eq('key', 'colores').single(),
          supabase.from('categorias').select('*'),
          supabase.from('productos').select('*'),
          supabase.from('cupones').select('*'),
          supabase.from('novedades').select('*'),
          supabase.from('config').select('data').eq('key', 'adminSettings').single(),
        ]);

        if (cfgRow.data) setCfg(cfgRow.data.data as Partial<AppConfig>);
        if (colorRow.data) applyThemeColors(colorRow.data.data as Record<string, string>);
        if (adminSettingsRow.data) setAdminSettings(adminSettingsRow.data.data as AdminSettings);

        const cats:  Record<string, Categoria> = {};
        const prods: Record<string, Producto>  = {};
        const cups:  Record<string, Cupon>     = {};
        const novs:  Record<string, Novedad>   = {};

        (catRows.data ?? []).forEach((r) => { const c = rowToApp<Categoria>(r); cats[c.id] = c; });
        (prodRows.data ?? []).forEach((r) => { const p = rowToApp<Producto>(r); prods[p.id] = p; });
        (cupRows.data ?? []).forEach((r) => { const c = rowToApp<Cupon>({ ...r, id: r.codigo }, ['createdAt']); cups[c.id] = c; });
        (novRows.data ?? []).forEach((r) => { const n = rowToApp<Novedad>(r, ['createdAt']); novs[n.id] = n; });

        setCategorias(cats);
        setProductos(prods);
        setCupones(cups);
        setNovedades(novs);

        // Adicionales — no bloquea el resto si la tabla falla
        try {
          const { data } = await supabase.from('adicionales').select('*');
          const ads: Record<string, Adicional> = {};
          (data ?? []).forEach((r) => { const a = rowToApp<Adicional>(r); ads[a.id] = a; });
          setAdicionales(ads);
        } catch (_) {}

        // Barrios
        try {
          const { data } = await supabase.from('barrios').select('*');
          const bs: Record<string, Barrio> = {};
          (data ?? []).forEach((r) => { const b = rowToApp<Barrio>(r); bs[b.id] = b; });
          setBarrios(bs);
        } catch (_) {}

        // Domiciliarios
        try {
          const { data } = await supabase.from('domiciliarios').select('*');
          const ds: Record<string, Domiciliario> = {};
          (data ?? []).forEach((r) => { const d = rowToApp<Domiciliario>(r); ds[d.id] = d; });
          setDomiciliarios(ds);
        } catch (_) {}

        // Promociones
        try {
          const { data } = await supabase.from('promociones').select('*');
          const ps = (data ?? []).map((r) => rowToApp<Promocion>(r, ['createdAt']));
          setPromociones(ps.filter((p) => p.activa));
        } catch (_) {}
      } catch (e) {
        console.error('Error al inicializar admin:', e);
      }
    }

    init().then(() => setReady(true));

    // Carga inicial de pedidos — Realtime (a diferencia de onSnapshot) no
    // reenvía las filas existentes, solo cambios a partir de la suscripción.
    supabase.from('pedidos').select('*').then(({ data }) => {
      const initial: Record<string, Pedido> = {};
      (data ?? []).forEach((r) => { const p = rowToApp<Pedido>(r, ['createdAt']); initial[p.id] = p; });
      setPedidos((prev) => ({ ...prev, ...initial }));
      isFirstLoad = false;
    });

    // Suscripción en tiempo real a pedidos
    const unsubscribe = subscribeTable<Record<string, unknown>>(supabase, 'pedidos', {
      onInsert: (r) => {
        const data = rowToApp<Pedido>(r, ['createdAt']);
        setPedidos((prev) => ({ ...prev, [data.id]: data }));
        if (!isFirstLoad) showToast(`🔔 Nuevo pedido #${data.numero}`);
      },
      onUpdate: (r) => {
        const data = rowToApp<Pedido>(r, ['createdAt']);
        setPedidos((prev) => ({ ...prev, [data.id]: data }));
      },
      onDelete: (r) => {
        setPedidos((prev) => {
          const next = { ...prev };
          delete next[r.id as string];
          return next;
        });
      },
    });

    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return ready;
}
