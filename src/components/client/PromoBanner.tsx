import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './PromoBanner.module.css';

export function PromoBanner() {
  const publicidades = useAppStore(s => s.publicidades);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  const active = publicidades.filter(p => p.activa);
  if (active.length === 0) return null;

  const first = active[0];
  const hasImg = Boolean(first.imgUrl);

  return (
    <>
      <div className={styles.root}>
        <div
          className={`${styles.card} ${hasImg ? styles.cardWithImg : ''}`}
          style={hasImg ? { backgroundImage: `url(${first.imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: 'pointer' } : {}}
          onClick={hasImg ? () => setLightboxUrl(first.imgUrl!) : undefined}
        >
          <div className={styles.body}>
            <div className={styles.tag}>Promoción · Hoy</div>
            <h2 className={styles.title}>{first.titulo}</h2>
            {first.descripcion && (
              <p className={styles.desc}>{first.descripcion}</p>
            )}
            <div className={styles.timer}>
              <Clock size={12} />
              <span>Disponible hoy</span>
            </div>
          </div>
          {!hasImg && <span className={styles.flame}>🔥</span>}
        </div>
      </div>

      {lightboxUrl && (
        <div className={styles.lbOverlay} onClick={() => setLightboxUrl(null)}>
          <button className={styles.lbClose} onClick={() => setLightboxUrl(null)}>
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt={first.titulo}
            className={styles.lbImage}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
