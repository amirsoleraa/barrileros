import { useState, useEffect } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import { User, Package, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import type { RutaEntrega, Pedido } from '@/types';

function fmtFecha(ts?: { seconds: number }): string {
  if (!ts) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function HistorialRutasPanel() {
  const { showToast } = useAppStore();
  const [rutas, setRutas]         = useState<RutaEntrega[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  useEffect(() => { loadRutas(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRutas() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'rutas'), where('estado', '==', 'completada')));
      const list: RutaEntrega[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as RutaEntrega));
      list.sort((a, b) =>
        (b.completadaEn?.seconds ?? b.createdAt?.seconds ?? 0) -
        (a.completadaEn?.seconds ?? a.createdAt?.seconds ?? 0)
      );
      setRutas(list);
    } catch {
      showToast('Error al cargar historial de rutas', 'error');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Historial de rutas</h3>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>
          {rutas.length} ruta{rutas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="empty-s">Cargando...</div>
      ) : rutas.length === 0 ? (
        <div className="empty-s">
          <Package size={36} style={{ margin: '0 auto 10px', opacity: .4 }} />
          No hay rutas completadas aún
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rutas.map(ruta => {
            const isExp    = expanded.has(ruta.id);
            const snapshot = (ruta.pedidosSnapshot ?? []) as Pedido[];
            const entregados  = snapshot.filter(p => p.estado === 'entregado').length;
            const cancelados  = snapshot.filter(p => p.estado === 'cancelado').length;
            const totalRecaudo = snapshot
              .filter(p => p.estado === 'entregado')
              .reduce((s, p) => s + p.total, 0);

            return (
              <div key={ruta.id} className="admin-card">
                {/* Cabecera de la ruta */}
                <div
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  onClick={() => toggleExpand(ruta.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ruta.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {ruta.repartidor && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={11} /> {ruta.repartidor}
                        </span>
                      )}
                      {snapshot.length > 0 && (
                        <>
                          <span style={{ color: '#15803D', fontWeight: 600 }}>{entregados} entregados</span>
                          {cancelados > 0 && (
                            <span style={{ color: '#DC2626', fontWeight: 600 }}>{cancelados} cancelados</span>
                          )}
                          <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{fmtPrice(totalRecaudo)}</span>
                        </>
                      )}
                      {ruta.completadaEn && (
                        <span>{fmtFecha(ruta.completadaEn)}</span>
                      )}
                    </div>
                  </div>
                  {isExp
                    ? <ChevronUp size={16} color="var(--text3)" />
                    : <ChevronDown size={16} color="var(--text3)" />
                  }
                </div>

                {/* Paradas de la ruta */}
                {isExp && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {snapshot.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                        Sin datos de pedidos en esta ruta
                      </div>
                    ) : (
                      snapshot.map((p, idx) => (
                        <div
                          key={p.id ?? idx}
                          style={{
                            padding: '12px 16px',
                            borderBottom: idx < snapshot.length - 1 ? '1px solid var(--border)' : 'none',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: 'var(--brand)' }}>
                                #{p.numero}
                              </span>
                              <span style={{
                                fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '1px 7px',
                                background: p.estado === 'entregado' ? '#dcfce7' : '#fee2e2',
                                color:      p.estado === 'entregado' ? '#15803d' : '#dc2626',
                                display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                {p.estado === 'entregado' && <CheckCircle size={10} />}
                                {p.estado === 'entregado' ? 'Entregado' : 'Cancelado'}
                              </span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.cliente?.nombre}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                              {[p.cliente?.barrio, p.cliente?.dir].filter(Boolean).join(' · ')}
                            </div>
                            {p.cliente?.tel && (
                              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.cliente.tel}</div>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                              {p.items?.slice(0, 2).map((it, i) => (
                                <span key={i}>{i > 0 ? ' · ' : ''}{it.qty}× {it.nombre}</span>
                              ))}
                              {(p.items?.length ?? 0) > 2 && ` +${p.items!.length - 2}`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtPrice(p.total)}</div>
                          </div>
                        </div>
                      ))
                    )}
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
