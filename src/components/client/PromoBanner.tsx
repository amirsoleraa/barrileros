import { useAppStore } from '@/stores/useAppStore';
import styles from './PromoBanner.module.css';

export function PromoBanner() {
  const publicidades = useAppStore(s => s.publicidades);

  if (publicidades.length === 0) return null;

  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {publicidades.map(p =>
          p.imgUrl ? (
            <div key={p.id} className={styles.imgCard}>
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
  );
}
