import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { fmtPrice } from '@/lib/utils';
import type { Adicional } from '@/types';

interface AdicionalForm {
  nombre: string;
  precio: string;
  costo: string;
  activo: boolean;
}

const DEFAULT_FORM: AdicionalForm = {
  nombre: '', precio: '', costo: '', activo: true,
};

export function AdicionalesPanel() {
  const { adicionales, setAdicionales, showToast } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AdicionalForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const list = Object.values(adicionales).sort((a, b) => a.nombre.localeCompare(b.nombre));

  function openCreate() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setIsOpen(true);
  }

  function openEdit(a: Adicional) {
    setEditId(a.id);
    setForm({ nombre: a.nombre, precio: String(a.precio), costo: String(a.costo), activo: a.activo });
    setIsOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const data: Omit<Adicional, 'id'> = {
        nombre: form.nombre.trim(),
        precio: parseFloat(form.precio) || 0,
        costo: parseFloat(form.costo) || 0,
        activo: form.activo,
      };
      if (editId) {
        await updateDoc(doc(db, 'adicionales', editId), data);
        setAdicionales({ ...adicionales, [editId]: { id: editId, ...data } });
        showToast('Adicional actualizado', 'success');
      } else {
        const ref = await addDoc(collection(db, 'adicionales'), data);
        setAdicionales({ ...adicionales, [ref.id]: { id: ref.id, ...data } });
        showToast('Adicional creado', 'success');
      }
      setIsOpen(false);
    } catch (e) {
      showToast('Error al guardar', 'error');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar este adicional?')) return;
    await deleteDoc(doc(db, 'adicionales', id));
    const next = { ...adicionales };
    delete next[id];
    setAdicionales(next);
    showToast('Adicional eliminado');
  }

  const precio = parseFloat(form.precio) || 0;
  const costo  = parseFloat(form.costo)  || 0;
  const ganancia = precio - costo;
  const pct = precio > 0 ? Math.round(ganancia / precio * 100) : 0;

  return (
    <div>
      <div className="admin-card-hdr" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <h3>Adicionales ({list.length})</h3>
        <button className="btn-add" onClick={openCreate}>
          <Plus size={16} /> Nuevo adicional
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-s">No hay adicionales. Crea el primero.</div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg2)' }}>
                {['Nombre', 'Precio cliente', 'Costo', 'Ganancia', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text2)', fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(a => {
                const g = a.precio - a.costo;
                const p = a.precio > 0 ? Math.round(g / a.precio * 100) : 0;
                return (
                  <tr key={a.id} style={{ borderTop: '1px solid var(--border)', opacity: a.activo ? 1 : 0.5 }}>
                    <td style={{ padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>{a.nombre}</td>
                    <td style={{ padding: '12px 14px', fontSize: 14, color: 'var(--brand)', fontWeight: 600 }}>{fmtPrice(a.precio)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 14 }}>{fmtPrice(a.costo)}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: g >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {fmtPrice(g)} <span style={{ opacity: .7 }}>({p}%)</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: a.activo ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.1)',
                        color: a.activo ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="ab ab-e" onClick={() => openEdit(a)} title="Editar">
                          <Pencil size={12} /> Editar
                        </button>
                        <button className="ab ab-d" onClick={() => handleDelete(a.id)} title="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Editar adicional' : 'Nuevo adicional'} maxWidth={460}>
        <div>
          <div className="f-field">
            <label>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Queso extra, Salsa chimichurri..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="f-field">
              <label>Precio (al cliente)</label>
              <input type="number" min="0" value={form.precio}
                onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} placeholder="0" />
            </div>
            <div className="f-field">
              <label>Costo interno</label>
              <input type="number" min="0" value={form.costo}
                onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} placeholder="0" />
            </div>
          </div>
          {precio > 0 && (
            <div className="gan-badge">Ganancia: {fmtPrice(ganancia)} ({pct}%)</div>
          )}
          <Toggle value={form.activo} onChange={v => setForm(f => ({ ...f, activo: v }))} label="Activo (disponible en productos)" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
            <button className="btn-s" onClick={() => setIsOpen(false)}>Cancelar</button>
            <button className="btn-p" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
