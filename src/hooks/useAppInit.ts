// ═══════════════════════════════════════════════
// hooks/useAppInit.ts — Carga catálogo público + tiempo real (antes useFirebaseInit)
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { subscribeTable } from '@/lib/realtime';
import { rowToApp } from '@/lib/caseConvert';
import { useAppStore } from '@/stores/useAppStore';
import { applyThemeColors } from '@/lib/utils';
import type { AppConfig, Producto, Categoria, Novedad, Publicidad, Adicional, Barrio, Domiciliario, Promocion } from '@/types';

export function useAppInit() {
  const { setCfg, setProductos, setCategorias, setNovedades, setPublicidades, setAdicionales, setBarrios, setDomiciliarios, setPromociones, setLoading } = useAppStore();

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false);
      return;
    }

    // Track first-load of las 2 colecciones críticas antes de ocultar el splash
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

    // Config principal + colores
    supabase.from('config').select('data').eq('key', 'main').single().then(({ data }) => {
      if (data) setCfg(data.data as Partial<AppConfig>);
    });
    supabase.from('config').select('data').eq('key', 'colores').single().then(({ data }) => {
      if (data && Object.keys(data.data as object).length > 0) {
        applyThemeColors(data.data as Record<string, string>);
      } else {
        try {
          const saved = localStorage.getItem('theme-colors');
          if (saved) applyThemeColors(JSON.parse(saved));
        } catch (_) {}
      }
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'config', {
      onUpdate: (row) => {
        if (row.key === 'main') setCfg(row.data as Partial<AppConfig>);
        if (row.key === 'colores') applyThemeColors(row.data as Record<string, string>);
      },
    }));

    // Categorías — crítica
    supabase.from('categorias').select('*').then(({ data }) => {
      const cats: Record<string, Categoria> = {};
      (data ?? []).forEach((r) => { const c = rowToApp<Categoria>(r); cats[c.id] = c; });
      setCategorias(cats);
      markCritical();
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'categorias', {
      onInsert: (r) => useAppStore.setState((s) => ({ categorias: { ...s.categorias, [r.id as string]: rowToApp<Categoria>(r) } })),
      onUpdate: (r) => useAppStore.setState((s) => ({ categorias: { ...s.categorias, [r.id as string]: rowToApp<Categoria>(r) } })),
      onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.categorias }; delete n[r.id as string]; return { categorias: n }; }),
    }));

    // Productos — crítica
    supabase.from('productos').select('*').then(({ data }) => {
      const prods: Record<string, Producto> = {};
      (data ?? []).forEach((r) => { const p = rowToApp<Producto>(r); prods[p.id] = p; });
      setProductos(prods);
      markCritical();
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'productos', {
      onInsert: (r) => useAppStore.setState((s) => ({ productos: { ...s.productos, [r.id as string]: rowToApp<Producto>(r) } })),
      onUpdate: (r) => useAppStore.setState((s) => ({ productos: { ...s.productos, [r.id as string]: rowToApp<Producto>(r) } })),
      onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.productos }; delete n[r.id as string]; return { productos: n }; }),
    }));

    // Adicionales
    supabase.from('adicionales').select('*').then(({ data }) => {
      const ads: Record<string, Adicional> = {};
      (data ?? []).forEach((r) => { const a = rowToApp<Adicional>(r); ads[a.id] = a; });
      setAdicionales(ads);
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'adicionales', {
      onInsert: (r) => useAppStore.setState((s) => ({ adicionales: { ...s.adicionales, [r.id as string]: rowToApp<Adicional>(r) } })),
      onUpdate: (r) => useAppStore.setState((s) => ({ adicionales: { ...s.adicionales, [r.id as string]: rowToApp<Adicional>(r) } })),
      onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.adicionales }; delete n[r.id as string]; return { adicionales: n }; }),
    }));

    // Novedades
    supabase.from('novedades').select('*').then(({ data }) => {
      const novs: Record<string, Novedad> = {};
      (data ?? []).forEach((r) => { const n = rowToApp<Novedad>(r, ['createdAt']); novs[n.id] = n; });
      setNovedades(novs);
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'novedades', {
      onInsert: (r) => useAppStore.setState((s) => ({ novedades: { ...s.novedades, [r.id as string]: rowToApp<Novedad>(r, ['createdAt']) } })),
      onUpdate: (r) => useAppStore.setState((s) => ({ novedades: { ...s.novedades, [r.id as string]: rowToApp<Novedad>(r, ['createdAt']) } })),
      onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.novedades }; delete n[r.id as string]; return { novedades: n }; }),
    }));

    // Publicidades
    function refreshPublicidades(list: Publicidad[]) {
      const sorted = [...list].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
      setPublicidades(sorted.filter((p) => p.activa));
    }
    let pubsCache: Publicidad[] = [];
    supabase.from('publicidades').select('*').then(({ data }) => {
      pubsCache = (data ?? []).map((r) => rowToApp<Publicidad>(r, ['createdAt']));
      refreshPublicidades(pubsCache);
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'publicidades', {
      onInsert: (r) => { pubsCache = [...pubsCache, rowToApp<Publicidad>(r, ['createdAt'])]; refreshPublicidades(pubsCache); },
      onUpdate: (r) => { const p = rowToApp<Publicidad>(r, ['createdAt']); pubsCache = pubsCache.map((x) => x.id === p.id ? p : x); refreshPublicidades(pubsCache); },
      onDelete: (r) => { pubsCache = pubsCache.filter((x) => x.id !== r.id); refreshPublicidades(pubsCache); },
    }));

    // Barrios
    supabase.from('barrios').select('*').then(({ data }) => {
      const bs: Record<string, Barrio> = {};
      (data ?? []).forEach((r) => { const b = rowToApp<Barrio>(r); bs[b.id] = b; });
      setBarrios(bs);
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'barrios', {
      onInsert: (r) => useAppStore.setState((s) => ({ barrios: { ...s.barrios, [r.id as string]: rowToApp<Barrio>(r) } })),
      onUpdate: (r) => useAppStore.setState((s) => ({ barrios: { ...s.barrios, [r.id as string]: rowToApp<Barrio>(r) } })),
      onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.barrios }; delete n[r.id as string]; return { barrios: n }; }),
    }));

    // Domiciliarios — solo para usuarios autenticados (admin o domiciliario)
    let domUnsub: (() => void) | null = null;
    async function loadDomiciliarios() {
      const { data } = await supabase.from('domiciliarios').select('*');
      const ds: Record<string, Domiciliario> = {};
      (data ?? []).forEach((r) => { const d = rowToApp<Domiciliario>(r); ds[d.id] = d; });
      setDomiciliarios(ds);
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        loadDomiciliarios();
        domUnsub = subscribeTable<Record<string, unknown>>(supabase, 'domiciliarios', {
          onInsert: (r) => useAppStore.setState((s) => ({ domiciliarios: { ...s.domiciliarios, [r.id as string]: rowToApp<Domiciliario>(r) } })),
          onUpdate: (r) => useAppStore.setState((s) => ({ domiciliarios: { ...s.domiciliarios, [r.id as string]: rowToApp<Domiciliario>(r) } })),
          onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.domiciliarios }; delete n[r.id as string]; return { domiciliarios: n }; }),
        });
      }
    });
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (domUnsub) { domUnsub(); domUnsub = null; }
      if (session) {
        loadDomiciliarios();
        domUnsub = subscribeTable<Record<string, unknown>>(supabase, 'domiciliarios', {
          onInsert: (r) => useAppStore.setState((s) => ({ domiciliarios: { ...s.domiciliarios, [r.id as string]: rowToApp<Domiciliario>(r) } })),
          onUpdate: (r) => useAppStore.setState((s) => ({ domiciliarios: { ...s.domiciliarios, [r.id as string]: rowToApp<Domiciliario>(r) } })),
          onDelete: (r) => useAppStore.setState((s) => { const n = { ...s.domiciliarios }; delete n[r.id as string]; return { domiciliarios: n }; }),
        });
      } else {
        setDomiciliarios({});
      }
    });
    unsubs.push(() => { authSub.subscription.unsubscribe(); if (domUnsub) domUnsub(); });

    // Promociones
    function refreshPromos(list: Promocion[]) {
      const sorted = [...list].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setPromociones(sorted.filter((p) => p.activa));
    }
    let promosCache: Promocion[] = [];
    supabase.from('promociones').select('*').then(({ data }) => {
      promosCache = (data ?? []).map((r) => rowToApp<Promocion>(r, ['createdAt']));
      refreshPromos(promosCache);
    });
    unsubs.push(subscribeTable<Record<string, unknown>>(supabase, 'promociones', {
      onInsert: (r) => { promosCache = [...promosCache, rowToApp<Promocion>(r, ['createdAt'])]; refreshPromos(promosCache); },
      onUpdate: (r) => { const p = rowToApp<Promocion>(r, ['createdAt']); promosCache = promosCache.map((x) => x.id === p.id ? p : x); refreshPromos(promosCache); },
      onDelete: (r) => { promosCache = promosCache.filter((x) => x.id !== r.id); refreshPromos(promosCache); },
    }));

    return () => unsubs.forEach((u) => u());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
