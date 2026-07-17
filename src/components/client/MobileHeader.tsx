import { Search, ShoppingCart, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/useCartStore';
import { LocationTrigger } from './LocationTrigger';
import styles from './MobileHeader.module.css';

interface MobileHeaderProps {
  onSearchOpen: () => void;
}

export function MobileHeader({ onSearchOpen }: MobileHeaderProps) {
  const navigate = useNavigate();
  const { cart, setCartOpen } = useCartStore();
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <header className={styles.header}>
      <div className={styles.location}>
        <LocationTrigger />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Buscar">
          <Search size={18} />
        </button>
        <button className={styles.iconBtn} onClick={() => navigate('/favoritos')} aria-label="Favoritos">
          <Heart size={18} />
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
