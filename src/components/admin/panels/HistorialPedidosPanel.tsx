import { useState, useEffect } from 'react';
import { getDocs, collection, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import { ChevronDown, ChevronUp, Lock, Unlock, Edit2, Save, X } from 'lucide-react';
import type { HistorialDia, Pedido } from '@/types';

export function HistorialPedidosPanel() {
  const { cfg, showToast } = useAppStore();
  const [dias, setDias]             = useState<HistorialDia[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinInput, setPinInput]     = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [editingPedido, setEditingPedido] = useState<{ diaId: string; pedidoId: string } | null>(null);
  const [editEstado, setEditEstado] = useState<'entregado' | 'cancelado'>('entregado');
  const [editRepartidor, setEditRepartidor] = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => { loadDias(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadDias() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'historial_pedidos'), orderBy('creadoEn', 'desc')));
      const list: HistorialDia[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as HistorialDia));
      setDias(list);
    } catch {
      showToast('Error al cargar historial', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock() {
    const pin = cfg.historialPin ?? '';
    if (!pin) { showToast('Configura un PIN en Configuración > General primero', 'error'); return; }
    if (pinInput === pin) {
      setPinUnlocked(true);
      setShowPinInput(false);
      setPinInput('');
      showToast('Historial desbloqueado para edición', 'success');
    } else {
      showToast('PIN incorrecto', 'error');
      setPinInput('');
    }
  }

  function startEdit(diaId: string, pedido: Pedido) {
    setEditingPedido({ diaId, pedidoId: pedido.id });
    setEditEstado(pedido.estado as 'entregado' | 'cancelado');
    setEditRepartidor(pedido.repartidorNombre ?? '');
  }

  async function handleSaveEdit() {
    if (!editingPedido) return;
    setSaving(true);
    try {
      const dia = dias.find(d => d.id === editingPedido.diaId);
      if (!dia) return;
      const updatedPedidos = dia.pedidos.map(p =>
        p.id === editingPedido.pedidoId
          ? { ...p, estado: editEstado, repartidorNombre: editRepartidor }
          : p
      );
      const totalEntregados = updatedPedidos.filter(p => p.estado === 'entregado').length;
      const totalCancelados = updatedPedidos.filter(p => p.estado === 'cancelado').length;
      const totalRecaudo    = updatedPedidos.filter(p => p.estado === 'entregado').reduce((s, p) => s + p.total, 0);

      await updateDoc(doc(db, 'historial_pedidos', editingPedido.diaId), {
        pedidos: updatedPedidos, totalEntregados, totalCancelados, totalRecaudo,
      });
      setDias(prev => prev.map(d =>
        d.id === editingPedido.diaId
          ? { ...d, pedidos: updatedPedidos, totalEntregados, totalCancelados, totalRecaudo }
          : d
      ));
      setEditingPedido(null);
      showToast('Cambios guardados', 'success');
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Cabecera con botón de bloqueo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Historial de pedidos</h3>
        {pinUnlocked ? (
          <button
            onClick={() => { setPinUnlocked(false); setEditingPedido(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--success)', background: '#f0fdf4', color: 'var(--success)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
          >
            <Unlock size={13} /> Edición activa
          </button>
        ) : (
          <button
            onClick={() => setShowPinInput(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
          >
            <Lock size={13} /> Desbloquear edición
          </button>
        )}
      </div>

      {/* PIN input */}
      {showPinInput && !pinUnlocked && (
        <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '12px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', border: '1px solid var(--border)' }}>
          <input
            type="password"
            placeholder="Ingresa el PIN"
            value={pinInput}
            onChange={e => setPinInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            autoFocus
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }}
          />
          <button className="btn-p" onClick={handleUnlock} style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
            Verificar
          </button>
          <button
            onClick={() => { setShowPinInput(false); setPinInput(''); }}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontFamily: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-s">Cargando historial...</div>
      ) : dias.length === 0 ? (
        <div className="empty-s" style={{ flexDirection: 'column', gap: 8 }}>
          <div>No hay historial aún.</div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            Usa <strong>Cerrar día</strong> en el panel de Pedidos para archivar los pedidos finalizados.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dias.map(dia => {
            const isExp = expanded.has(dia.id);
            return (
              <div key={dia.id} className="admin-card">
                {/* Cabecera del día */}
                <div
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                  onClick={() => toggleExpand(dia.id)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{dia.fechaLabel}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ color: '#15803D', fontWeight: 600 }}>{dia.totalEntregados} entregados</span>
                      {dia.totalCancelados > 0 && (
                        <span style={{ color: '#DC2626', fontWeight: 600 }}>{dia.totalCancelados} cancelados</span>
                      )}
                      <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{fmtPrice(dia.totalRecaudo)} recaudado</span>
                    </div>
                  </div>
                  {isExp ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
                </div>

                {/* Lista de pedidos del día */}
                {isExp && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {dia.pedidos.map((p, idx) => {
                      const isEditing = editingPedido?.diaId === dia.id && editingPedido?.pedidoId === p.id;
                      return (
                        <div
                          key={p.id ?? idx}
                          style={{
                            padding: '12px 16px',
                            borderBottom: idx < dia.pedidos.length - 1 ? '1px solid var(--border)' : 'none',
                            background: isEditing ? 'var(--bg2)' : 'transparent',
                          }}
                        >
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                  value={editEstado}
                                  onChange={e => setEditEstado(e.target.value as 'entregado' | 'cancelado')}
                                  style={{ flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }}
                                >
                                  <option value="entregado">Entregado</option>
                                  <option value="cancelado">Cancelado</option>
                                </select>
                                <input
                                  value={editRepartidor}
                                  onChange={e => setEditRepartidor(e.target.value)}
                                  placeholder="Repartidor"
                                  style={{ flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn-s" onClick={() => setEditingPedido(null)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  <X size={13} /> Cancelar
                                </button>
                                <button className="btn-p" onClick={handleSaveEdit} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                  <Save size={13} /> {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: 'var(--brand)' }}>
                                    #{p.numero}
                                  </span>
                                  <span style={{
                                    fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '1px 7px',
                                    background: p.estado === 'entregado' ? '#dcfce7' : '#fee2e2',
                                    color:      p.estado === 'entregado' ? '#15803d' : '#dc2626',
                                  }}>
                                    {p.estado === 'entregado' ? 'Entregado' : 'Cancelado'}
                                  </span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.cliente?.nombre}</div>
                                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                                  {[p.cliente?.barrio, p.cliente?.dir].filter(Boolean).join(' · ')}
                                </div>
                                {(p.rutaNombre || p.repartidorNombre) && (
                                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                                    {p.rutaNombre && <span>Ruta: <strong>{p.rutaNombre}</strong></span>}
                                    {p.repartidorNombre && <span style={{ marginLeft: 8 }}>· {p.repartidorNombre}</span>}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtPrice(p.total)}</div>
                                </div>
                                {pinUnlocked && (
                                  <button
                                    onClick={() => startEdit(dia.id, p)}
                                    style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}
                                    title="Editar"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
