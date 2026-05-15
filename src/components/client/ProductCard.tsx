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

  const cartEntry = cart.find(i => i.id === product.id && i.extras.length === 0);
  const qty = cartEntry?.qty ?? 0;

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onOpenDetail(product.id);
  }

  function changeQty(e: React.MouseEvent, delta: number) {
    e.stopPropagation();
    updateQty(product.id, [], delta);
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

      {qty === 0 ? (
        <button className={styles.quickAdd} onClick={quickAdd} aria-label="Agregar">
          <Plus size={18} />
        </button>
      ) : (
        <div className={styles.qtyControl}>
          <button className={styles.qtyBtn} onClick={(e) => changeQty(e, -1)}><Minus size={13} /></button>
          <span className={styles.qtyNum}>{qty}</span>
          <button className={styles.qtyBtn} onClick={(e) => changeQty(e, 1)}><Plus size={13} /></button>
        </div>
      )}
    </div>
  );
}
