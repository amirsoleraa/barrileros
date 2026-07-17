import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { useClienteStore } from '@/stores/useClienteStore';
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
  const navigate = useNavigate();
  const location = useLocation();
  const { cliente } = useClienteStore();

  return (
    <nav className={styles.nav}>
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = id === 'inicio'
          ? location.pathname === '/'
          : id === 'pedidos'
            ? location.pathname === '/pedidos'
            : id === 'cuenta'
              ? location.pathname === '/cuenta'
              : false;
        const handleClick = id === 'buscar'
          ? onSearchOpen
          : id === 'pedidos'
            ? () => navigate('/pedidos')
            : id === 'cuenta'
              ? () => navigate(cliente ? '/cuenta' : '/login')
              : id === 'inicio'
                ? () => navigate('/')
                : undefined;
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
