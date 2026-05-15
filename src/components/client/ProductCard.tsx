import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { fmtPrice } from '@/lib/utils';
import type { Producto } from '@/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Producto;
  onOpenDetail: (id: string) => void;
}

export function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const { cart, updateQty } = useCartStore();

  const productEntries = cart.filter(i => i.id === product.id);
  const totalQty = productEntries.reduce((sum, i) => sum + i.qty, 0);

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onOpenDetail(product.id);
  }

  function decrement(e: React.MouseEvent) {
    e.stopPropagation();
    if (productEntries.length === 0) return;
    const last = productEntries[productEntries.length - 1];
    updateQty(product.id, last.extras, -1);
  }

  return (
    <div className={styles.card} onClick={() => onOpenDetail(product.id)}>
      <div className={styles.img}>
        {product.imgUrl
          ? <img src={product.imgUrl} alt={product.nombre} loading="lazy" />
          : <span>{product.emoji ?? '🍖'}</span>
        }
      </div>
      <div className={styles.info}>
        <div className={styles.name}>{product.nombre}</div>
        <div className={styles.price}>{fmtPrice(product.precio)}</div>
      </div>

      {totalQty === 0 ? (
        <button className={styles.quickAdd} onClick={quickAdd} aria-label="Agregar">
          <Plus size={18} />
        </button>
      ) : (
        <div className={styles.qtyControl}>
          <button className={styles.qtyBtn} onClick={decrement}><Minus size={13} /></button>
          <span className={styles.qtyNum}>{totalQty}</span>
          <button className={styles.qtyBtn} onClick={quickAdd}><Plus size={13} /></button>
        </div>
      )}
    </div>
  );
}
