import { useAppStore } from '@/stores/useAppStore';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  activeCat: string;
  onOpenDetail: (id: string) => void;
}

export function ProductGrid({ activeCat, onOpenDetail }: ProductGridProps) {
  const { productos } = useAppStore();

  const allActive = Object.values(productos).filter(p => p.activo);

  const filtered = allActive.filter(p =>
    activeCat === 'todos' ? true : p.categoriaId === activeCat
  );

  if (filtered.length === 0) {
    return (
      <div className="empty-s" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 48 }}>🍖</div>
        <div style={{ marginTop: 12, fontSize: 15 }}>No hay productos en esta categoría</div>
      </div>
    );
  }

  // "Los más pedidos" = first 4 products when viewing all
  const featured = activeCat === 'todos' ? allActive.slice(0, 4) : [];

  return (
    <div>
      {/* Sección destacada */}
      {featured.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>Lo que arde</div>
              <h2 className={styles.sectionTitle}>Los más pedidos</h2>
            </div>
            <button className={styles.seeAll}>Ver todos</button>
          </div>
          <div className={styles.grid}>
            {featured.map(p => (
              <ProductCard key={p.id} product={p} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        </section>
      )}

      {/* Sección completa */}
      <section className={styles.section}>
        {activeCat !== 'todos' && (
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Menú · {filtered.length}</h2>
          </div>
        )}
        {activeCat === 'todos' && (
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.eyebrow}>Explora el menú</div>
              <h2 className={styles.sectionTitle}>Todo</h2>
            </div>
          </div>
        )}
        <div className={styles.grid}>
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      </section>
    </div>
  );
}
