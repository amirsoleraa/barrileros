import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImage } from '@/lib/cloudinary';
import { useAppStore } from '@/stores/useAppStore';

export function ConfigPanel() {
  const { cfg, setCfg, showToast } = useAppStore();
  const [nombre, setNombre]     = useState(cfg.nombreComercio);
  const [emoji, setEmoji]       = useState(cfg.logoEmoji);
  const [logoUrl, setLogoUrl]   = useState(cfg.logoUrl);
  const [mensaje, setMensaje]   = useState(cfg.mensajeConfirmacion);
  const [whatsapp, setWhatsapp] = useState(cfg.whatsappNumero ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState(cfg.logoUrl);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setNombre(cfg.nombreComercio);
    setEmoji(cfg.logoEmoji);
    setLogoUrl(cfg.logoUrl);
    setLogoPreview(cfg.logoUrl);
    setMensaje(cfg.mensajeConfirmacion);
    setWhatsapp(cfg.whatsappNumero ?? '');
  }, [cfg]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!nombre.trim()) { showToast('El nombre del negocio es obligatorio', 'error'); return; }
    setSaving(true);
    try {
      let finalLogoUrl = logoUrl;
      if (logoFile) {
        finalLogoUrl = await uploadImage(logoFile, 'logo');
      }

      const updates = {
        nombreComercio: nombre.trim(),
        logoEmoji: emoji,
        logoUrl: finalLogoUrl,
        mensajeConfirmacion: mensaje.trim(),
        whatsappNumero: whatsapp.replace(/\D/g, ''),
      };

      await setDoc(doc(db, 'config', 'main'), updates, { merge: true });
      setCfg(updates);
      setLogoFile(null);
      showToast('Configuración guardada', 'success');
    } catch (e) {
      showToast('Error al guardar configuración', 'error');
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="admin-card">
        <div className="admin-card-hdr">
          <h3>Configuración del negocio</h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, margin: '0 auto 10px', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, overflow: 'hidden', boxShadow: '0 4px 20px rgba(244,82,30,.4)' }}>
              {logoPreview
                ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span>{emoji}</span>
              }
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--brand)', cursor: 'pointer', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--brand-light)', background: 'var(--brand-light)' }}>
              <Upload size={14} />
              Subir logo
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div className="f-field">
            <label>Nombre del negocio *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Asados al Barril" />
          </div>
          <div className="f-field">
            <label>Emoji del logo (si no hay imagen)</label>
            <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🔥" />
          </div>
          <div className="f-field">
            <label>Número de WhatsApp</label>
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="573144939678"
            />
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Código de país + número, sin espacios ni «+». Ej: 573001234567
            </div>
            {whatsapp.replace(/\D/g, '').length >= 10 && (
              <a
                href={`https://api.whatsapp.com/send/?phone=${whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent('¡Prueba del botón de confirmación!')}&type=phone_number&app_absent=0`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
              >
                ✓ Número válido — probar enlace
              </a>
            )}
          </div>
          <div className="f-field">
            <label>Mensaje de confirmación del pedido</label>
            <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} rows={3} placeholder="Tu pedido está siendo preparado..." style={{ resize: 'none' }} />
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              Este mensaje aparece en el recibo y en el email de confirmación.
            </div>
          </div>

          <button className="btn-p" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
