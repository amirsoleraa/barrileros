import { useState } from 'react';
import { Plus, Pencil, Trash2, Bike, Phone } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { Modal } from '@/components/ui/Modal';
import { Toggle } from '@/components/ui/Toggle';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { fmtPrice } from '@/lib/utils';
import type { Domiciliario } from '@/types';

interface DomForm {
  nombre: string;
  tel: string;
  pagoBase: string;
  activo: boolean;
}
const DEFAULT_FORM: DomForm = { nombre: '', tel: '', pagoBase: '', activo: true };

export function DomiciliariosPanel() {
  const { domiciliarios, setDomiciliarios, showToast } = useAppStore();
  const confirm = useConfirm();
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm]     = useState<DomForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const list = Object.values(domiciliarios)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  function openCreate() {
    setEditId(null); setForm(DEFAULT_FORM); setIsOpen(true);
  }
  function openEdit(d: Domiciliario) {
    setEditId(d.id);
    setForm({ nombre: d.nombre, tel: d.tel ?? '', pagoBase: d.pagoBase ? String(d.pagoBase) : '', activo: d.activo });
    setIsOpen(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const data: Omit<Domiciliario, 'id'> = {
        nombre: form.nombre.trim(),
        tel: form.tel.trim() || undefined,
        pagoBase: parseFloat(form.pagoBase) || undefined,
        activo: form.activo,
      };
      if (editId) {
        await updateDoc(doc(db, 'domiciliarios', editId), data);
        setDomiciliarios({ ...domiciliarios, [editId]: { id: editId, ...data } });
        showToast('Domiciliario actualizado', 'success');
      } else {
        const r = await addDoc(collection(db, 'domiciliarios'), data);
        setDomiciliarios({ ...domiciliarios, [r.id]: { id: r.id, ...data } });
        showToast('Domiciliario creado', 'success');
      }
      setIsOpen(false);
    } catch {
      showToast('Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Eliminar domiciliario', message: '¿Eliminar este domiciliario del registro?', danger: true, confirmLabel: 'Eliminar' });
    if (!ok) return;
    await deleteDoc(doc(db, 'domiciliarios', id));
    const next = { ...domiciliarios };
    delete next[id];
    setDomiciliarios(next);
    showToast('Domiciliario eliminado');
  }

  return (
    <div>
      <div className="admin-card-hdr" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 16 }}>
        <h3>Domiciliarios ({list.length})</h3>
        <button className="btn-add" onClick={openCreate}>
          <Plus size={16} /> Nuevo domiciliario
        </button>
      </div>

      {list.length === 0 ? (
        <div className="empty-s" style={{ flexDirection: 'column', gap: 8 }}>
          <Bike size={36} style={{ opacity: .4 }} />
          No hay domiciliarios registrados aún.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map(d => (
            <div key={d.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderLeft: `4px solid ${d.activo ? 'var(--brand)' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              opacity: d.activo ? 1 : 0.6,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: d.activo ? 'var(--brand-light)' : 'var(--bg2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Bike size={18} color={d.activo ? 'var(--brand)' : 'var(--text3)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{d.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {d.tel && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={10} /> {d.tel}
                    </span>
                  )}
                  {d.pagoBase && (
                    <span style={{ color: 'var(--brand)', fontWeight: 600 }}>
                      {fmtPrice(d.pagoBase)} / ruta
                    </span>
                  )}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0,
                background: d.activo ? 'var(--brand-light)' : 'var(--bg2)',
                color: d.activo ? 'var(--brand)' : 'var(--text3)',
              }}>
                {d.activo ? 'Activo' : 'Inactivo'}
              </span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button className="ab ab-e" onClick={() => openEdit(d)}><Pencil size={12} /> Editar</button>
                <button className="ab ab-d" onClick={() => handleDelete(d.id)}><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editId ? 'Editar domiciliario' : 'Nuevo domiciliario'} maxWidth={440}>
        <div>
          <div className="f-field">
            <label>Nombre *</label>
            <input
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>
          <div className="f-field">
            <label>Teléfono</label>
            <input
              value={form.tel}
              onChange={e => setForm(f => ({ ...f, tel: e.target.value }))}
              placeholder="3001234567"
            />
          </div>
          <div className="f-field">
            <label>Pago por ruta (COP)</label>
            <input
              type="number" min="0"
              value={form.pagoBase}
              onChange={e => setForm(f => ({ ...f, pagoBase: e.target.value }))}
              placeholder="Ej: 15000"
            />
          </div>
          {parseFloat(form.pagoBase) > 0 && (
            <div style={{ fontSize: 13, color: 'var(--brand)', background: 'var(--brand-light)', padding: '8px 12px', borderRadius: 8, marginBottom: 12 }}>
              Gana {fmtPrice(parseFloat(form.pagoBase))} por cada ruta completada
            </div>
          )}
          <Toggle value={form.activo} onChange={v => setForm(f => ({ ...f, activo: v }))} label="Activo" />
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
