import { useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, ClipboardList, Heart } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useClienteStore } from '@/stores/useClienteStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { id: 'inicio',   label: 'Inicio',      icon: Home },
  { id: 'menu',     label: 'Menú',        icon: UtensilsCrossed },
  { id: 'pedidos',  label: 'Mis pedidos', icon: ClipboardList },
  { id: 'favs',     label: 'Favoritos',   icon: Heart },
] as const;

export function Sidebar() {
  const navigate = useNavigate();
  const { cfg, categorias, productos } = useAppStore();
  const { cliente } = useClienteStore();

  const cats = Object.values(categorias).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const activeProducts = Object.values(productos).filter(p => p.activo);

  const totalCount = activeProducts.length;
  const countByCat = cats.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = activeProducts.filter(p => p.categoriaId === cat.id).length;
    return acc;
  }, {});

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logo}>
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.nombreComercio} />
            : <span>{cfg.logoEmoji}</span>
          }
        </div>
        <span className={styles.brandName}>{cfg.nombreComercio}</span>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`${styles.navItem} ${id === 'inicio' ? styles.navActive : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Categories */}
      {cats.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Categorías</div>
          <div className={styles.catList}>
            <div className={styles.catItem}>
              <span className={styles.catDot} style={{ background: 'var(--text3)' }} />
              <span className={styles.catName}>Todo el menú</span>
              <span className={styles.catCount}>{totalCount}</span>
            </div>
            {cats.map(cat => (
              <div key={cat.id} className={styles.catItem}>
                <span className={styles.catDot} style={{ background: cat.color }} />
                <span className={styles.catName}>{cat.nombre}</span>
                <span className={styles.catCount}>{countByCat[cat.id] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.spacer} />

      {/* User */}
      <div
        className={styles.userRow}
        onClick={() => navigate(cliente ? '/cuenta' : '/login')}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.userAvatar}>{cliente?.nombre?.[0]?.toUpperCase() ?? '?'}</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{cliente?.nombre || 'Iniciar sesión'}</div>
          <div className={styles.userSub}>{cliente ? (cliente.correo || cliente.telefono || 'Cliente') : 'Ver mi cuenta'}</div>
        </div>
      </div>
    </aside>
  );
}
