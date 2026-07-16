import { Home, Search, ClipboardList, User } from 'lucide-react';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  onSearchOpen: () => void;
}

const ITEMS = [
  { id: 'inicio',  label: 'Inicio',   icon: Home },
  { id: 'buscar',  label: 'Buscar',   icon: Search },
  { id: 'pedidos', label: 'Pedidos',  icon: ClipboardList },
  { id: 'cuenta',  label: 'Cuenta',   icon: User },
] as const;

export function BottomNav({ onSearchOpen }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = id === 'inicio';
        const handleClick = id === 'buscar' ? onSearchOpen : undefined;
        return (
          <button
            key={id}
            className={`${styles.item} ${isActive ? styles.active : ''}`}
            onClick={handleClick}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
