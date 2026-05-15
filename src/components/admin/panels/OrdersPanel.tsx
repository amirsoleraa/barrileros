import { useState, useRef } from 'react';
import { Eye, Trash2, ChevronRight, ChevronLeft, Clock, RotateCcw, Archive, ExternalLink } from 'lucide-react';
import { updateDoc, deleteDoc, doc, addDoc, collection, serverTimestamp, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAppStore } from '@/stores/useAppStore';
import { Modal } from '@/components/ui/Modal';
import { fmtPrice, ESTADO_INFO } from '@/lib/utils';
import type { Pedido, PedidoTab, RutaEntrega } from '@/types';

const COLS: { key: PedidoTab; label: string; color: string }[] = [
  { key: 'activos',    label: 'Activos',    color: '#15803D' },
  { key: 'preparando', label: 'Preparando', color: '#A16207' },
  { key: 'camino',     label: 'En camino',  color: '#1D4ED8' },
  { key: 'entregado',  label: 'Entregado',  color: '#6B7280' },
  { key: 'cancelado',  label: 'Cancelado',  color: '#DC2626' },
];

const NEXT_STATE: Partial<Record<PedidoTab, PedidoTab>> = {
  activos: 'preparando', preparando: 'camino', camino: 'entregado',
};
const PREV_STATE: Partial<Record<PedidoTab, PedidoTab>> = {
  preparando: 'activos', camino: 'preparando', entregado: 'camino',
};

function timeAgo(seconds?: number) {
  if (!seconds) return '';
  const diff = Math.floor(Date.now() / 1000) - seconds;
  if (diff < 60)   return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

export function OrdersPanel() {
  const { pedidos, pedidosFiltro, setPedidosFiltro } = useAdminStore();
  const { showToast } = useAppStore();
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [activeCol, setActiveCol]       = useState<PedidoTab>('activos');
  const [cerrando, setCerrando]         = useState(false);

  // kanban desktop drag
  const dragId  = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<PedidoTab | null>(null);

  const allPedidos = Object.values(pedidos);
  const activosCount = allPedidos.filter(p => p.estado === 'activos').length;

  function byCol(col: PedidoTab) {
    return allPedidos
      .filter(p => p.estado === col)
      .filter(p => {
        if (!pedidosFiltro) return true;
        const q = pedidosFiltro.toLowerCase();
        return p.numero.toLowerCase().includes(q) ||
          (p.cliente?.nombre ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        // Pendientes del día anterior van primero en "Preparando"
        if (col === 'preparando') {
          const aP = a.notaPendiente ? 1 : 0;
          const bP = b.notaPendiente ? 1 : 0;
          if (aP !== bP) return bP - aP;
        }
        return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
      });
  }

  async function moveToState(pedidoId: string, estado: PedidoTab) {
    await updateDoc(doc(db, 'pedidos', pedidoId), { estado });
    showToast(`→ ${ESTADO_INFO[estado].label}`);
  }

  async function handleDelete(pedidoId: string) {
    if (!window.confirm('¿Eliminar este pedido?')) return;
    setDeleting(pedidoId);
    await deleteDoc(doc(db, 'pedidos', pedidoId));
    setDeleting(null);
    showToast('Pedido eliminado');
  }

  async function handleCerrarDia() {
    const finalizados = allPedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado');
    const enCamino    = allPedidos.filter(p => p.estado === 'camino');
    if (finalizados.length === 0 && enCamino.length === 0) {
      showToast('No hay pedidos finalizados para archivar', 'error'); return;
    }
    if (finalizados.length === 0) {
      showToast('No hay pedidos entregados/cancelados. Los pedidos en camino se devolverán a Preparando.', 'info');
    }

    const entregados = finalizados.filter(p => p.estado === 'entregado');
    const cancelados = finalizados.filter(p => p.estado === 'cancelado');
    const enCaminoMsg = enCamino.length > 0
      ? `\n• ${enCamino.length} en camino → vuelven a Preparando (pendientes)`
      : '';

    if (!window.confirm(
      `¿Cerrar el día?\n\nSe archivarán:\n• ${entregados.length} entregado${entregados.length !== 1 ? 's' : ''}\n• ${cancelados.length} cancelado${cancelados.length !== 1 ? 's' : ''}${enCaminoMsg}\n\nEl panel quedará limpio. Los datos se guardan en Historial.`
    )) return;

    setCerrando(true);
    try {
      // Pedidos "en camino" no entregados → vuelven a Preparando con nota
      if (enCamino.length > 0) {
        const fechaHoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
        const batchCamino = writeBatch(db);
        enCamino.forEach(p => {
          batchCamino.update(doc(db, 'pedidos', p.id), {
            estado: 'preparando',
            notaPendiente: `Pendiente del ${fechaHoy}`,
          });
        });
        await batchCamino.commit();
      }

      if (finalizados.length === 0) {
        showToast(`${enCamino.length} pedido${enCamino.length !== 1 ? 's' : ''} devuelto${enCamino.length !== 1 ? 's' : ''} a Preparando.`, 'success');
        return;
      }

      // Enrich with ruta info from completed rutas
      const rutasMap: Record<string, { nombre: string; repartidor?: string }> = {};
      try {
        const snap = await getDocs(query(collection(db, 'rutas'), where('estado', '==', 'completada')));
        snap.forEach(d => {
          const data = d.data() as RutaEntrega;
          for (const pid of (data.pedidoIds ?? [])) {
            if (!rutasMap[pid]) rutasMap[pid] = { nombre: data.nombre, repartidor: data.repartidor };
          }
        });
      } catch {}

      const historialPedidos = finalizados.map(p => ({
        ...p,
        rutaNombre:        p.rutaNombre        ?? rutasMap[p.id]?.nombre     ?? '',
        repartidorNombre:  p.repartidorNombre  ?? rutasMap[p.id]?.repartidor ?? '',
      }));

      const ahora      = new Date();
      const fecha      = ahora.toISOString().slice(0, 10);
      const fechaLabel = ahora.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
      const totalRecaudo = entregados.reduce((s, p) => s + p.total, 0);

      await addDoc(collection(db, 'historial_pedidos'), {
        fecha, fechaLabel,
        pedidos: historialPedidos,
        totalEntregados: entregados.length,
        totalCancelados: cancelados.length,
        totalRecaudo,
        creadoEn: serverTimestamp(),
      });

      // Hard-delete in batches of 499
      for (let i = 0; i < finalizados.length; i += 499) {
        const batch = writeBatch(db);
        finalizados.slice(i, i + 499).forEach(p => batch.delete(doc(db, 'pedidos', p.id)));
        await batch.commit();
      }

      const msgs = [`${finalizados.length} pedidos archivados`];
      if (enCamino.length > 0) msgs.push(`${enCamino.length} devueltos a Preparando`);
      showToast(`Día cerrado. ${msgs.join(', ')}.`, 'success');
    } catch (e) {
      showToast('Error al cerrar el día', 'error');
      console.error(e);
    } finally {
      setCerrando(false);
    }
  }

  // ── drag (desktop kanban) ──────────────────────
  function onDragStart(id: string) { dragId.current = id; }
  function onDragOver(e: React.DragEvent, col: PedidoTab) { e.preventDefault(); setDragOver(col); }
  function onDrop(col: PedidoTab) {
    if (dragId.current) moveToState(dragId.current, col);
    dragId.current = null; setDragOver(null);
  }
  function onDragEnd() { dragId.current = null; setDragOver(null); }

  // ── shared card renderer ───────────────────────
  function renderCard(p: Pedido, mobile = false) {
    const next = NEXT_STATE[p.estado];
    const prev = PREV_STATE[p.estado];
    if (mobile) {
      return (
        <div key={p.id} className="order-card" style={{ borderLeft: p.notaPendiente ? '3px solid #F59E0B' : undefined }}>
          {p.notaPendiente && (
            <div style={{ fontSize: 12, color: '#92400E', background: '#FEF3C7', borderRadius: 8, padding: '5px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠</span> {p.notaPendiente}
            </div>
          )}
          <div className="order-card-top">
            <span className="order-card-num">#{p.numero}</span>
            <span className="order-card-time"><Clock size={11} />{timeAgo(p.createdAt?.seconds)}</span>
          </div>

          <div className="order-card-client">{p.cliente?.nombre}</div>
          {p.cliente?.tel    && <div className="order-card-sub">{p.cliente.tel}</div>}
          {p.cliente?.barrio && <div className="order-card-sub">{p.cliente.barrio} · {p.cliente.dir}</div>}
          {!p.cliente?.barrio && p.cliente?.dir && <div className="order-card-sub">{p.cliente.dir}</div>}

          <div className="order-card-items">
            {p.items?.slice(0, 3).map((it, i) => (
              <span key={i}>{i > 0 ? ' · ' : ''}{it.qty}× {it.nombre}</span>
            ))}
            {(p.items?.length ?? 0) > 3 && <span style={{ color: 'var(--text3)' }}> +{p.items!.length - 3} más</span>}
          </div>

          <div className="order-card-total">{fmtPrice(p.total)}</div>

          <div className="order-card-actions">
            <button
              className="order-btn-icon danger"
              onClick={() => handleDelete(p.id)}
              disabled={deleting === p.id}
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
            <button className="order-btn-icon" onClick={() => setDetailPedido(p)} title="Ver detalle">
              <Eye size={16} />
            </button>
            {prev && (
              <button className="order-btn-icon back" onClick={() => moveToState(p.id, prev)} title={`← ${ESTADO_INFO[prev].label}`}>
                <RotateCcw size={15} />
              </button>
            )}
            {next && (
              <button className="order-btn-advance" onClick={() => moveToState(p.id, next)}>
                {ESTADO_INFO[next].label} <ChevronRight size={16} />
              </button>
            )}
            {!next && p.estado !== 'cancelado' && (
              <div style={{ flex: 1, textAlign: 'center', fontSize: 13, color: 'var(--text3)', padding: '11px 0' }}>
                Finalizado
              </div>
            )}
          </div>
        </div>
      );
    }

    // desktop card (kanban)
    return (
      <div
        key={p.id}
        draggable
        onDragStart={() => onDragStart(p.id)}
        onDragEnd={onDragEnd}
        style={{ background: 'var(--surface)', border: `1px solid ${p.notaPendiente ? '#F59E0B' : 'var(--border)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'grab', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}
      >
        {p.notaPendiente && (
          <div style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', borderRadius: 6, padding: '3px 8px', marginBottom: 6 }}>
            ⚠ {p.notaPendiente}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', color: 'var(--brand)' }}>#{p.numero}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} />{timeAgo(p.createdAt?.seconds)}
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.cliente?.nombre}</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{p.cliente?.tel}</div>
        {p.cliente?.barrio && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{p.cliente.barrio}</div>}
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>
          {p.items?.slice(0, 2).map((it, i) => <span key={i}>{i > 0 ? ' · ' : ''}{it.qty}× {it.nombre}</span>)}
          {(p.items?.length ?? 0) > 2 && <span style={{ color: 'var(--text3)' }}> +{p.items!.length - 2}</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{fmtPrice(p.total)}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="ab ab-e" onClick={() => setDetailPedido(p)} style={{ flex: 1, justifyContent: 'center' }}><Eye size={12} /></button>
          <button className="ab ab-d" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}><Trash2 size={12} /></button>
          {prev && <button className="ab ab-b" onClick={() => moveToState(p.id, prev)}><ChevronLeft size={13} /></button>}
          {next && (
            <button className="ab ab-b" onClick={() => moveToState(p.id, next)} style={{ flex: 1, justifyContent: 'center', background: 'var(--brand)', color: '#fff' }}>
              <ChevronRight size={13} /><span style={{ fontSize: 11 }}>{ESTADO_INFO[next].label}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <input
          className="s-input"
          style={{ flex: 1 }}
          placeholder="Buscar por número o cliente..."
          value={pedidosFiltro}
          onChange={e => setPedidosFiltro(e.target.value)}
        />
        {activosCount > 0 && (
          <span style={{ background: 'var(--brand)', color: '#fff', borderRadius: 20, padding: '5px 12px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            {activosCount} nuevo{activosCount > 1 ? 's' : ''}
          </span>
        )}
        {allPedidos.some(p => p.estado === 'entregado' || p.estado === 'cancelado') && (
          <button
            onClick={handleCerrarDia}
            disabled={cerrando}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 20,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--text2)', cursor: 'pointer', fontSize: 13,
              fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap',
              opacity: cerrando ? .6 : 1,
            }}
            title="Archivar pedidos entregados y cancelados"
          >
            <Archive size={13} />
            {cerrando ? 'Archivando...' : `Cerrar día (${allPedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado').length})`}
          </button>
        )}
      </div>

      {/* ════ MOBILE VIEW ════ */}
      <div className="kanban-mobile">
        {/* Tab pills */}
        <div className="order-tabs">
          {COLS.map(col => {
            const count = byCol(col.key).length;
            return (
              <button
                key={col.key}
                className={`order-tab${activeCol === col.key ? ' active' : ''}`}
                onClick={() => setActiveCol(col.key)}
              >
                {col.label}
                {count > 0 && <span className="order-tab-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        {byCol(activeCol).length === 0 ? (
          <div className="empty-s" style={{ marginTop: 32 }}>Sin pedidos en esta columna</div>
        ) : (
          byCol(activeCol).map(p => renderCard(p, true))
        )}
      </div>

      {/* ════ DESKTOP KANBAN ════ */}
      <div
        className="kanban-board"
        style={{ gridTemplateColumns: 'repeat(5, minmax(220px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 8 }}
      >
        {COLS.map(col => {
          const colPedidos = byCol(col.key);
          return (
            <div
              key={col.key}
              onDragOver={e => onDragOver(e, col.key)}
              onDrop={() => onDrop(col.key)}
              style={{
                background: dragOver === col.key ? 'var(--bg2)' : 'var(--bg)',
                borderRadius: 14,
                border: `2px solid ${dragOver === col.key ? col.color : 'var(--border)'}`,
                transition: 'border-color .15s, background .15s',
                minHeight: 120,
              }}
            >
              <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{col.label}</span>
                </div>
                {colPedidos.length > 0 && (
                  <span style={{ background: col.color, color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>
                    {colPedidos.length}
                  </span>
                )}
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colPedidos.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: '20px 0' }}>Sin pedidos</div>
                )}
                {colPedidos.map(p => renderCard(p, false))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Detalle del pedido */}
      <Modal isOpen={!!detailPedido} onClose={() => setDetailPedido(null)} title={`Pedido #${detailPedido?.numero}`} maxWidth={540}>
        {detailPedido && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>Cliente</div>
              <div style={{ fontSize: 15 }}><strong>{detailPedido.cliente?.nombre}</strong></div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{detailPedido.cliente?.tel}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{detailPedido.cliente?.correo}</div>
              {!detailPedido.location && (
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {detailPedido.cliente?.dir}
                  {detailPedido.cliente?.barrio ? ` — ${detailPedido.cliente.barrio}` : ''}
                  {detailPedido.cliente?.comp   ? `, ${detailPedido.cliente.comp}`   : ''}
                </div>
              )}
              {detailPedido.cliente?.recibe && (
                <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Recibe: {detailPedido.cliente.recibe}</div>
              )}
            </div>

            {detailPedido.location && (
              <div style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>Ubicación GPS</div>
                {detailPedido.location.barrio && (
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🏘 {detailPedido.location.barrio}</div>
                )}
                {detailPedido.location.notes && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 2 }}>📝 {detailPedido.location.notes}</div>
                )}
                {detailPedido.location.address && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{detailPedido.location.address}</div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {detailPedido.location.distance_km > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>📏 {detailPedido.location.distance_km} km</span>
                  )}
                  <a
                    href={`https://www.google.com/maps?q=${detailPedido.location.lat},${detailPedido.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                      textDecoration: 'none', padding: '5px 10px',
                      borderRadius: 8, border: '1px solid var(--brand)',
                    }}
                  >
                    <ExternalLink size={12} /> Ver en Google Maps
                  </a>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>Productos</div>
              {detailPedido.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>
                    {item.nombre} x{item.qty}
                    {item.extras?.length > 0 && <small style={{ color: 'var(--text3)', marginLeft: 6 }}>+{item.extras.join(', ')}</small>}
                  </span>
                  <span style={{ fontWeight: 600 }}>{fmtPrice(item.precio * item.qty)}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text2)' }}>
                <span>Subtotal</span><span>{fmtPrice(detailPedido.subtotal)}</span>
              </div>
              {detailPedido.domicilio > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--text2)' }}>
                  <span>Domicilio</span><span>{fmtPrice(detailPedido.domicilio)}</span>
                </div>
              )}
              {detailPedido.descuento > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4, color: 'var(--success)' }}>
                  <span>Descuento</span><span>-{fmtPrice(detailPedido.descuento)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, color: 'var(--brand)', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6 }}>
                <span>Total</span><span>{fmtPrice(detailPedido.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {PREV_STATE[detailPedido.estado] && (
                <button className="btn-s" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => { moveToState(detailPedido.id, PREV_STATE[detailPedido.estado]!); setDetailPedido(null); }}>
                  <ChevronLeft size={15} />{ESTADO_INFO[PREV_STATE[detailPedido.estado]!].label}
                </button>
              )}
              {NEXT_STATE[detailPedido.estado] && (
                <button className="btn-p" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => { moveToState(detailPedido.id, NEXT_STATE[detailPedido.estado]!); setDetailPedido(null); }}>
                  {ESTADO_INFO[NEXT_STATE[detailPedido.estado]!].label}<ChevronRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
