// ═══════════════════════════════════════════════
// hooks/useTheme.ts — Aplica colores CSS desde Supabase
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { applyThemeColors } from '@/lib/utils';

export function useTheme() {
  useEffect(() => {
    async function loadColors() {
      try {
        const { data } = await supabase.from('config').select('data').eq('key', 'colores').single();
        if (data && Object.keys(data.data as object).length > 0) {
          applyThemeColors(data.data as Record<string, string>);
          return;
        }
      } catch (_) {}
      // Fallback a localStorage
      try {
        const saved = localStorage.getItem('theme-colors');
        if (saved) applyThemeColors(JSON.parse(saved));
      } catch (_) {}
    }
    loadColors();
  }, []);
}
