import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ClipboardList, UtensilsCrossed, BarChart2,
  Bell, Truck, Settings, LogOut, Store, Megaphone,
} from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useAdminStore } from '@/stores/useAdminStore';
import { useAuth } from '@/hooks/useAuth';
import styles from './AdminSidebar.module.css';

const NAV_ITEMS = [
  { path: 'pedidos',   icon: ClipboardList,   label: 'Pedidos',       tip: 'Pedidos' },
  { path: 'catalogo',  icon: UtensilsCrossed, label: 'Catálogo',      tip: 'Catálogo' },
  { path: 'dashboard', icon: BarChart2,       label: 'Dashboard',     tip: 'Dashboard' },
  { path: 'logistica', icon: Truck,           label: 'Logística',     tip: 'Logística' },
  { path: 'novedades', icon: Bell,            label: 'Novedades',     tip: 'Novedades' },
  { path: 'marketing', icon: Megaphone,       label: 'Marketing',     tip: 'Marketing' },
  { path: 'config',    icon: Settings,        label: 'Configuración', tip: 'Config' },
];

interface NavItemProps {
  path: string;
  icon: React.FC<{ size?: number }>;
  label: string;
  tip: string;
  badge?: number;
  expanded: boolean;
  onClick?: () => void;
}

function NavItem({ path, icon: Icon, label, tip, badge, expanded, onClick }: NavItemProps) {
  return (
    <NavLink
      to={`/admin/${path}`}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.active : ''}`
      }
      data-tip={!expanded ? tip : undefined}
      onClick={onClick}
    >
      <Icon size={19} />
      {expanded && <span className={styles.navLabel}>{label}</span>}
      {badge ? <span className={styles.navBadge}>{badge}</span> : null}
    </NavLink>
  );
}

interface AdminSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const { cfg } = useAppStore();
  const { pedidos } = useAdminStore();
  const { logOut } = useAuth();

  // Desktop: icon-only vs expanded (label visible). Independent from mobile state.
  const [desktopExpanded, setDesktopExpanded] = useState(false);

  const activosCount = Object.values(pedidos).filter(p => p.estado === 'activos').length;

  // On mobile nav click: close the drawer
  function handleNavClick() {
    if (mobileOpen) onMobileClose();
  }

  return (
    <aside
      className={`${styles.sidebar} ${desktopExpanded ? styles.expanded : ''} ${mobileOpen ? styles.mobileOpen : ''}`}
    >
      <div className={styles.inner}>
        {/* Brand — click toggles desktop expand or closes mobile */}
        <div
          className={styles.brand}
          onClick={() => setDesktopExpanded(v => !v)}
          title="Expandir menú"
        >
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.nombreComercio} />
            : <span>{cfg.logoEmoji}</span>
          }
        </div>
        {desktopExpanded && (
          <div className={styles.brandName}>{cfg.nombreComercio}</div>
        )}

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.path}
              {...item}
              badge={item.path === 'pedidos' && activosCount > 0 ? activosCount : undefined}
              expanded={desktopExpanded || mobileOpen}
              onClick={handleNavClick}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <NavLink
            to="/"
            className={styles.navItem}
            data-tip={!(desktopExpanded || mobileOpen) ? 'Tienda' : undefined}
            onClick={handleNavClick}
          >
            <Store size={19} />
            {(desktopExpanded || mobileOpen) && <span className={styles.navLabel}>Tienda</span>}
          </NavLink>
          <button
            className={`${styles.navItem} ${styles.logoutBtn}`}
            onClick={logOut}
            data-tip={!(desktopExpanded || mobileOpen) ? 'Salir' : undefined}
          >
            <LogOut size={19} />
            {(desktopExpanded || mobileOpen) && <span className={styles.navLabel}>Salir</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
