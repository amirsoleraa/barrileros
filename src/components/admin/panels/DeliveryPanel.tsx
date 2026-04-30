import { useState, useEffect } from 'react';
import { Truck, Save } from 'lucide-react';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAppStore } from '@/stores/useAppStore';
import { Toggle } from '@/components/ui/Toggle';

export function DeliveryPanel() {
  const { cfg, setCfg, showToast } = useAppStore();
  const [activo, setActivo] = useState(cfg.domicilioActivo);
  const [tipo, setTipo]     = useState(cfg.domicilioTipo);
  const [valor, setValor]   = useState(String(cfg.domicilioValor));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActivo(cfg.domicilioActivo);
    setTipo(cfg.domicilioTipo);
    setValor(String(cfg.domicilioValor));
  }, [cfg]);

  async function handleSave() {
    setSaving(true);
    const updates = {
      domicilioActivo: activo,
      domicilioTipo: tipo,
      domicilioValor: parseFloat(valor) || 0,
    };
    try {
      await setDoc(doc(db, 'config', 'main'), updates, { merge: true });
      setCfg(updates);
      showToast('Configuración de domicilio guardada');
    } catch (e) {
      showToast('Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="admin-card">
        <div className="admin-card-hdr">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={18} color="var(--brand)" /> Configuración de domicilio
          </h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 20 }}>
            <Toggle value={activo} onChange={setActivo} label="Servicio de domicilio activo" />
          </div>

          {activo && (
            <>
              <div className="f-field">
                <label>Tipo de cobro</label>
                <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}>
                  <option value="fijo">Valor fijo por pedido</option>
                  <option value="gratis">Gratis</option>
                </select>
              </div>

              {tipo === 'fijo' && (
                <div className="f-field">
                  <label>Valor del domicilio</label>
                  <input
                    type="number"
                    min="0"
                    value={valor}
                    onChange={e => setValor(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            </>
          )}

          <button className="btn-p" onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
