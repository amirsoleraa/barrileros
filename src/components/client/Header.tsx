import { ShoppingCart, Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCartStore } from '@/stores/useCartStore';
import styles from './Header.module.css';

interface HeaderProps {
  onSearchOpen: () => void;
}

export function Header({ onSearchOpen }: HeaderProps) {
  const { cfg } = useAppStore();
  const { cart, setCartOpen } = useCartStore();

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.nombreComercio} />
            : <span>{cfg.logoEmoji}</span>
          }
        </div>
        <span className={styles.name}>{cfg.nombreComercio}</span>
      </div>
      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={onSearchOpen} aria-label="Buscar">
          <Search size={20} />
        </button>
        <button
          className={`${styles.iconBtn} ${cartCount > 0 ? styles.cartBtn : ''}`}
          onClick={() => setCartOpen(true)}
          aria-label="Carrito"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className={styles.badge}>{cartCount > 9 ? '9+' : cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
