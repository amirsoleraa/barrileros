import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

const ACTUALIZADO = '2026-07-16';

export function PrivacidadPage() {
  const navigate = useNavigate();
  const { cfg } = useAppStore();
  const nombre = cfg.nombreComercio || 'este comercio';
  const contacto = cfg.whatsappNumero || '';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px 60px', color: 'var(--text, #1A1410)', background: 'var(--bg, #FAFAF7)', minHeight: '100vh' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 20, fontSize: 14, color: 'var(--text2, #6B6460)', fontFamily: 'inherit' }}
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Política de tratamiento de datos personales</h1>
      <p style={{ fontSize: 13, color: 'var(--text3, #A8A09A)', marginBottom: 24 }}>Última actualización: {ACTUALIZADO}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 15, lineHeight: 1.65 }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>1. Responsable del tratamiento</h2>
          <p>
            <strong>{nombre}</strong> es responsable del tratamiento de los datos personales que recoge a través de esta
            tienda, de acuerdo con la Ley 1581 de 2012 y sus decretos reglamentarios sobre protección de datos personales
            en Colombia.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>2. Datos que recogemos</h2>
          <p>Cuando haces un pedido, recogemos: nombre, teléfono, correo electrónico (si lo proporcionas), dirección de
            entrega y, si usas el mapa para ubicarte, tu ubicación GPS aproximada.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>3. Para qué usamos tus datos</h2>
          <p>Únicamente para: procesar y entregar tu pedido, contactarte sobre su estado, coordinar la entrega con el
            domiciliario asignado, y — si nos das tu correo — enviarte la confirmación del pedido. No usamos tus datos
            para ningún otro fin, y no los vendemos ni los compartimos con terceros distintos del domiciliario que
            entrega tu pedido.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>4. Dónde se almacenan</h2>
          <p>Tus datos se almacenan de forma segura en la infraestructura de Supabase, con acceso
            restringido solo al personal autorizado de {nombre}.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>5. Tus derechos</h2>
          <p>Como titular de tus datos, puedes en cualquier momento solicitar acceder a ellos, corregirlos, actualizarlos
            o pedir que los eliminemos de nuestros registros{contacto ? ', escribiéndonos a través de WhatsApp' : ''}.</p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>6. Vigencia</h2>
          <p>Esta política puede actualizarse ocasionalmente; la fecha de la última actualización aparece al inicio de
            esta página.</p>
        </section>
      </div>
    </div>
  );
}
