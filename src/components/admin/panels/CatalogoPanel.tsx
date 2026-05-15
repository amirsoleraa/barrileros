import { useState } from 'react';
import { ProductsPanel }   from './ProductsPanel';
import { AdicionalesPanel } from './AdicionalesPanel';
import { CategoriesPanel } from './CategoriesPanel';

const TABS = [
  { key: 'productos',   label: 'Productos' },
  { key: 'adicionales', label: 'Adicionales' },
  { key: 'categorias',  label: 'Categorías' },
] as const;

type Tab = typeof TABS[number]['key'];

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit', transition: 'all .15s',
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text2)',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
  };
}

export function CatalogoPanel() {
  const [tab, setTab] = useState<Tab>('productos');
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'productos'   && <ProductsPanel />}
      {tab === 'adicionales' && <AdicionalesPanel />}
      {tab === 'categorias'  && <CategoriesPanel />}
    </div>
  );
}
