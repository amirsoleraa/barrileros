import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import { User, Package, ChevronDown, ChevronUp, CheckCircle, Trash2, X } from 'lucide-react';
import type { RutaEntrega, Pedido } from '@/types';

function fmtFecha(ts?: { seconds: number }): string {
  if (!ts) return '';
  return new Date(ts.seconds * 1000).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function HistorialRutasPanel() {
  const { cfg, showToast } = useAppStore();
  const [rutas, setRutas]       = useState<RutaEntrega[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Delete with PIN
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [pinInput, setPinInput]         = useState('');
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'rutas'), where('estado', '==', 'completada'));
    const unsub = onSnapshot(q, snap => {
      const list: RutaEntrega[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as RutaEntrega));
      list.sort((a, b) =>
        (b.completadaEn?.seconds ?? b.createdAt?.seconds ?? 0) -
        (a.completadaEn?.seconds ?? a.createdAt?.seconds ?? 0)
      );
      setRutas(list);
      setLoading(false);
    }, () => {
      showToast('Error al cargar historial de rutas', 'error');
      setLoading(false);
    });
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function startDelete(rutaId: string) {
    const pin = cfg.historialPin ?? '';
    if (!pin) {
      if (window.confirm('¿Eliminar esta ruta del historial? Esta acción no se puede deshacer.')) {
        confirmDelete(rutaId, '');
      }
      return;
    }
    setDeletingId(rutaId);
    setPinInput('');
  }

  async function confirmDelete(rutaId: string, pin: string) {
    const expectedPin = cfg.historialPin ?? '';
    if (expectedPin && pin !== expectedPin) {
      showToast('PIN incorrecto', 'error');
      setPinInput('');
      return;
    }
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'rutas', rutaId));
      setDeletingId(null);
      showToast('Ruta eliminada del historial', 'success');
    } catch {
      showToast('Error al eliminar la ruta', 'error');
    } finally {
      setDeleting(false);
    }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--bg2)', animation: 'pulse 1.4s ease-in-out infinite', opacity: 0.6 }} />
          ))}
        </div>
      ) : rutas.length === 0 ? (
        <div className="empty-s" style={{ flexDirection: 'column' }}>
          <Package size={36} style={{ margin: '0 auto 10px', opacity: .4 }} />
          No hay rutas completadas aún
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rutas.map(ruta => {
            const isExp     = expanded.has(ruta.id);
            const snapshot  = (ruta.pedidosSnapshot ?? []) as Pedido[];
            const entregados  = snapshot.filter(p => p.estado === 'entregado').length;
            const cancelados  = snapshot.filter(p => p.estado === 'cancelado').length;
            const totalRecaudo = snapshot
              .filter(p => p.estado === 'entregado')
              .reduce((s, p) => s + p.total, 0);
            const isPinDelete = deletingId === ruta.id;

            return (
              <div key={ruta.id} className="admin-card">
                {/* Cabecera de la ruta */}
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => toggleExpand(ruta.id)}
                  >
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{ruta.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {ruta.repartidor && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={11} /> {ruta.repartidor}
                        </span>
                      )}
                      {snapshot.length > 0 && (
                        <>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{entregados} entregados</span>
                          {cancelados > 0 && (
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{cancelados} cancelados</span>
                          )}
                          <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{fmtPrice(totalRecaudo)}</span>
                        </>
                      )}
                      {ruta.completadaEn && (
                        <span>{fmtFecha(ruta.completadaEn)}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => startDelete(ruta.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--danger-bg)', background: 'var(--danger-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}
                      title="Eliminar ruta"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div style={{ cursor: 'pointer' }} onClick={() => toggleExpand(ruta.id)}>
                      {isExp
                        ? <ChevronUp size={16} color="var(--text3)" />
                        : <ChevronDown size={16} color="var(--text3)" />
                      }
                    </div>
                  </div>
                </div>

                {/* PIN confirm inline */}
                {isPinDelete && (
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--danger-bg)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: 'var(--danger)', fontWeight: 600, flex: 1 }}>
                      Ingresa el PIN para eliminar
                    </span>
                    <input
                      type="password"
                      placeholder="PIN"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && confirmDelete(ruta.id, pinInput)}
                      autoFocus
                      style={{ width: 100, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                    <button
                      onClick={() => confirmDelete(ruta.id, pinInput)}
                      disabled={deleting}
                      style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--danger)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
                    >
                      {deleting ? '...' : 'Eliminar'}
                    </button>
                    <button
                      onClick={() => { setDeletingId(null); setPinInput(''); }}
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontFamily: 'inherit' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

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
                                fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '2px 8px',
                                background: p.estado === 'entregado' ? 'var(--success-bg)' : 'var(--danger-bg)',
                                color:      p.estado === 'entregado' ? 'var(--success)'    : 'var(--danger)',
                                display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                {p.estado === 'entregado' && <CheckCircle size={10} />}
                                {p.estado === 'entregado' ? 'Entregado' : 'Cancelado'}
                              </span>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.cliente?.nombre}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                              {[p.cliente?.tel, p.cliente?.barrio, p.cliente?.dir].filter(Boolean).join(' · ')}
                            </div>
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
