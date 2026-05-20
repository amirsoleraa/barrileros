import { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { domDb as db } from '@/lib/firebase';
import { Calendar, X } from 'lucide-react';
import { fmtPrice } from '@/lib/utils';
import type { HistorialDia, Pedido, Domiciliario } from '@/types';

interface DomHistorialPanelProps { domiciliario: Domiciliario; }

export function DomHistorialPanel({ domiciliario }: DomHistorialPanelProps) {
  const [dias,    setDias]    = useState<HistorialDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    getDocs(query(collection(db, 'historial_pedidos'), orderBy('creadoEn', 'desc')))
      .then(snap => {
        const list: HistorialDia[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as HistorialDia));
        setDias(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return dias.map(dia => {
      const pedidosFiltrados = (dia.pedidos ?? []).filter(
        (p: Pedido) => p.domiciliarioId === domiciliario.id || p.repartidorNombre === domiciliario.nombre
      );
      return { ...dia, pedidos: pedidosFiltrados };
    }).filter(dia => {
      if (dia.pedidos.length === 0) return false;
      if (!dia.fecha) return true;
      if (dateFrom && dia.fecha < dateFrom) return false;
      if (dateTo   && dia.fecha > dateTo)   return false;
      return true;
    });
  }, [dias, domiciliario, dateFrom, dateTo]);

  const totalPedidos   = filtered.reduce((s, d) => s + d.pedidos.length, 0);
  const totalEntregado = filtered.reduce((s, d) => s + d.pedidos.filter(p => p.estado === 'entregado').reduce((ss, p) => ss + p.domicilio, 0), 0);

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Calendar size={14} color="var(--text3)" />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${(dateFrom||dateTo) ? 'var(--brand)' : 'var(--border)'}`, fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }} />
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${(dateFrom||dateTo) ? 'var(--brand)' : 'var(--border)'}`, fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontFamily: 'inherit' }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-value">{totalPedidos}</div>
            <div className="stat-label">Pedidos entregados</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--success)' }}>{fmtPrice(totalEntregado)}</div>
            <div className="stat-label">Total domicilios</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-s">Cargando historial...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-s">Sin pedidos en el período seleccionado</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(dia => {
            const isExp = expanded.has(dia.id);
            const entregados = dia.pedidos.filter(p => p.estado === 'entregado');
            const domTotal   = entregados.reduce((s, p) => s + p.domicilio, 0);
            return (
              <div key={dia.id} className="admin-card">
                <div style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => toggleExpand(dia.id)}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{dia.fechaLabel || dia.fecha}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {dia.pedidos.length} pedido{dia.pedidos.length !== 1 ? 's' : ''} · {fmtPrice(domTotal)} en domicilios
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>{isExp ? '▲' : '▼'}</span>
                </div>
                {isExp && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {dia.pedidos.map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 16px', borderBottom: i < dia.pedidos.length - 1 ? '1px solid var(--border)' : 'none',
                        gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--brand)' }}>#{p.numero}</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{p.cliente?.nombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                            {[p.cliente?.barrio, p.cliente?.dir].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtPrice(p.total)}</div>
                          {p.domicilio > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Dom: {fmtPrice(p.domicilio)}</div>
                          )}
                          <div style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, marginTop: 2, display: 'inline-block',
                            background: p.estado === 'entregado' ? 'var(--success-light,#dcfce7)' : '#fee2e2',
                            color: p.estado === 'entregado' ? 'var(--success)' : '#dc2626',
                          }}>
                            {p.estado === 'entregado' ? 'Entregado' : 'Cancelado'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
