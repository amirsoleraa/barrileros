import { Search, ShoppingCart, MapPin, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  onSearchOpen: () => void;
}

export function MobileHeader({ onSearchOpen }: MobileHeaderProps) {
  const { cart, setCartOpen } = useCartStore();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <header className={styles.header}>
      <div className={styles.location}>
        <MapPin size={14} className={styles.pin} />
        <div className={styles.locationText}>
          <span className={styles.locationLabel}>Entrega a</span>
          <span className={styles.locationAddr}>Selecciona tu dirección</span>
        </div>
        <ChevronRight size={14} className={styles.chevron} />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Buscar">
          <Search size={18} />
        </button>
        <button className={styles.iconBtn} onClick={() => setCartOpen(true)} aria-label="Carrito">
          <ShoppingCart size={18} />
          {cartCount > 0 && (
            <span className={styles.badge}>{cartCount > 9 ? '9+' : cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
