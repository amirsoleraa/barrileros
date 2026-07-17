import { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cldUrl } from '@/lib/cloudinary';
import styles from './PromoBanner.module.css';

export function PromoBanner() {
  const publicidades = useAppStore(s => s.publicidades);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const active = publicidades.filter(p => p.activa);

  useEffect(() => {
    if (index >= active.length) setIndex(0);
  }, [active.length, index]);

  useEffect(() => {
    if (active.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % active.length), 6000);
    return () => clearInterval(id);
  }, [active.length]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxUrl]);

  if (active.length === 0) return null;

  return (
    <>
      <div className={styles.root}>
        <div className={styles.viewport}>
          <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
            {active.map(p => {
              const hasImg = Boolean(p.imgUrl);
              return (
                <div key={p.id} className={styles.slide}>
                  <div
                    className={`${styles.card} ${hasImg ? styles.cardWithImg : ''}`}
                    style={hasImg ? { backgroundImage: `url(${cldUrl(p.imgUrl, 1200)})`, cursor: 'pointer' } : {}}
                    onClick={hasImg ? () => setLightboxUrl(p.imgUrl!) : undefined}
                  >
                    <div className={styles.body}>
                      <div className={`${styles.tag} brr-eyebrow`}>Promoción · Hoy</div>
                      <h2 className={`${styles.title} brr-display`}>{p.titulo}</h2>
                      {p.descripcion && (
                        <p className={styles.desc}>{p.descripcion}</p>
                      )}
                      <div className={styles.timer}>
                        <Clock size={12} />
                        <span>Disponible hoy</span>
                      </div>
                    </div>
                    {!hasImg && <span className={styles.flame}>🔥</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {active.length > 1 && (
          <div className={styles.dots}>
            {active.map((p, i) => (
              <button
                key={p.id}
                className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Ver promoción ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightboxUrl && (
        <div className={styles.lbOverlay} onClick={() => setLightboxUrl(null)}>
          <button className={styles.lbClose} onClick={() => setLightboxUrl(null)}>
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className={styles.lbImage}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
