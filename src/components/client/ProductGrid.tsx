import { useAppStore } from '@/stores/useAppStore';
import { ProductCard } from './ProductCard';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  activeCat: string;
  onOpenDetail: (id: string) => void;
}

export function ProductGrid({ activeCat, onOpenDetail }: ProductGridProps) {
  const { productos } = useAppStore();

  const filtered = Object.values(productos).filter(p => {
    if (!p.activo) return false;
    if (activeCat === 'todos') return true;
    return p.categoriaId === activeCat;
  });

  if (filtered.length === 0) {
    return (
      <div className="empty-s" style={{ paddingTop: 60 }}>
        <div style={{ fontSize: 48 }}>🍖</div>
        <div style={{ marginTop: 12, fontSize: 15 }}>No hay productos en esta categoría</div>
      </div>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Menú</h2>
        <span className={styles.count}>{filtered.length} productos</span>
      </div>
      <div className={styles.grid}>
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </section>
  );
}
