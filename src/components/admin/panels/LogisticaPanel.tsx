import { useState } from 'react';
import { DeliveryPanel } from './DeliveryPanel';
import { TrackingPanel } from './TrackingPanel';

const TABS = [
  { key: 'domicilio',   label: 'Domicilio' },
  { key: 'seguimiento', label: 'Seguimiento' },
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

export function LogisticaPanel() {
  const [tab, setTab] = useState<Tab>('domicilio');
  return (
    <div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--bg2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'domicilio'   && <DeliveryPanel />}
      {tab === 'seguimiento' && <TrackingPanel />}
    </div>
  );
}
