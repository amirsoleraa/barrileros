import { ArrowRight } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { fmtPrice } from '@/lib/utils';
import styles from './GotoCartButton.module.css';

export function GotoCartButton() {
  const { cart, setCartOpen } = useCartStore();

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (count === 0) return null;

  return (
    <button className={styles.btn} onClick={() => setCartOpen(true)}>
      <div className={styles.left}>
        <span className={styles.countPill}>{count}</span>
        <span className={styles.label}>Ver carrito</span>
      </div>
      <div className={styles.right}>
        <span className={styles.total}>{fmtPrice(total)}</span>
        <ArrowRight size={16} />
      </div>
    </button>
  );
}
