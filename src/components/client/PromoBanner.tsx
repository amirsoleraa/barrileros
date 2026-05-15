import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './PromoBanner.module.css';

interface LightboxState { url: string; alt: string }

export function PromoBanner() {
  const publicidades = useAppStore(s => s.publicidades);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightbox]);

  if (publicidades.length === 0) return null;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.track}>
          {publicidades.map(p =>
            p.imgUrl ? (
              <div
                key={p.id}
                className={styles.imgCard}
                onClick={() => setLightbox({ url: p.imgUrl!, alt: p.titulo })}
              >
                <img src={p.imgUrl} alt={p.titulo} className={styles.imgCardPhoto} />
                <div className={styles.imgCardOverlay} />
                <div className={styles.imgCardBody}>
                  <div className={styles.imgCardTitle}>{p.titulo}</div>
                  {p.descripcion && (
                    <div className={styles.imgCardDesc}>{p.descripcion}</div>
                  )}
                </div>
              </div>
            ) : (
              <div key={p.id} className={`${styles.textCard} ${styles.amber}`}>
                <div className={styles.textCardTitle}>{p.titulo}</div>
                {p.descripcion && (
                  <div className={styles.textCardDesc}>{p.descripcion}</div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {lightbox && (
        <div className={styles.lbOverlay} onClick={() => setLightbox(null)}>
          <button className={styles.lbClose} onClick={() => setLightbox(null)}>
            <X size={22} />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.alt}
            className={styles.lbImage}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
