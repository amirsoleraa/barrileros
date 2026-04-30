import { Flame } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './PromoBanner.module.css';

export function PromoBanner() {
  const publicidades = useAppStore(s => s.publicidades);
  const cfg = useAppStore(s => s.cfg);

  return (
    <div className={styles.root}>
      <div className={styles.track}>
        {publicidades.length === 0 ? (
          <>
            {/* Hero brand card */}
            <div className={styles.heroCard}>
              <div className={styles.heroBg} />
              <div className={styles.heroGlow} />
              <div className={styles.heroContent}>
                <div className={styles.heroEyebrow}>
                  <Flame size={11} />
                  {cfg.nombreComercio}
                </div>
                <div className={styles.heroTitle}>La mejor{'\n'}carne al carbón</div>
                <div className={styles.heroBadge}>Domicilios disponibles</div>
              </div>
              <div className={styles.heroEmoji} aria-hidden>🔥</div>
            </div>

            <div className={styles.adCard}>
              <img src="/publicity.jpeg" alt="Publicidad de Asados al Barril" className={styles.adImage} />
            </div>

            {/* Secondary cards */}
            <div className={`${styles.textCard} ${styles.amber}`}>
              <div className={styles.textCardIcon}>🥩</div>
              <div className={styles.textCardTitle}>Ingredientes frescos</div>
              <div className={styles.textCardDesc}>Carnes seleccionadas y marinadas con nuestra receta especial</div>
            </div>

            <div className={`${styles.textCard} ${styles.smoke}`}>
              <div className={styles.textCardIcon}>🍖</div>
              <div className={styles.textCardTitle}>Cocción lenta</div>
              <div className={styles.textCardDesc}>Horas de preparación para el sabor perfecto en cada corte</div>
            </div>
          </>
        ) : (
          publicidades.map(p =>
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
          )
        )}
      </div>
    </div>
  );
}
