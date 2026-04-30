// ═══════════════════════════════════════════════
// hooks/useTheme.ts — Aplica colores CSS desde Firestore
// ═══════════════════════════════════════════════

import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { applyThemeColors } from '@/lib/utils';

export function useTheme() {
  useEffect(() => {
    async function loadColors() {
      try {
        const colorDoc = await getDoc(doc(db, 'config', 'colores'));
        if (colorDoc.exists()) {
          applyThemeColors(colorDoc.data() as Record<string, string>);
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
