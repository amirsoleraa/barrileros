import { useLocation, Link } from 'react-router-dom';
import { Store, Menu } from 'lucide-react';
import styles from './AdminTopbar.module.css';

const PANEL_TITLES: Record<string, string> = {
  pedidos:     'Pedidos',
  productos:   'Productos',
  categorias:  'Categorías',
  dashboard:   'Dashboard',
  seguimiento: 'Seguimiento',
  novedades:   'Novedades',
  domicilio:   'Domicilio',
  descuentos:  'Descuentos',
  colores:     'Colores',
  config:      'Configuración',
};

interface AdminTopbarProps {
  onMenuToggle: () => void;
}

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const { pathname } = useLocation();
  const segments = pathname.split('/');
  const current = segments[segments.length - 1];
  const title = PANEL_TITLES[current] ?? 'Admin';

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        {/* Hamburger — visible only on mobile (CSS) */}
        <button className={styles.hamburger} onClick={onMenuToggle} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <Link to="/" className={styles.storeLink}>
        <Store size={16} />
        Ver tienda
      </Link>
    </div>
  );
}
