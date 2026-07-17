import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useClienteStore } from '@/stores/useClienteStore';
import { Sidebar }       from '@/components/client/Sidebar';
import { MobileHeader }  from '@/components/client/MobileHeader';
import { BottomNav }     from '@/components/client/BottomNav';
import { InlineCart }    from '@/components/client/InlineCart';
import { GotoCartButton } from '@/components/client/GotoCartButton';
import { SearchOverlay } from '@/components/client/SearchOverlay';
import { ProductDetail } from '@/components/client/ProductDetail';
import { ProductCard }   from '@/components/client/ProductCard';
import layout from './StorefrontPage.module.css';
import grid from '@/components/client/ProductGrid.module.css';
import styles from './MisPedidosPage.module.css';

export function FavoritosPage() {
  const navigate = useNavigate();
  const { productos } = useAppStore();
  const { cliente, loading } = useClienteStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailId,   setDetailId]   = useState<string | null>(null);

  if (loading) return null;
  if (!cliente) return <Navigate to="/login" state={{ from: '/favoritos' }} replace />;

  const favoritos = (cliente.favoritos ?? [])
    .map(id => productos[id])
    .filter((p): p is NonNullable<typeof p> => Boolean(p) && p.activo);

  return (
    <div className={layout.layout}>
      <Sidebar />
      <main className={layout.main}>
        <MobileHeader onSearchOpen={() => setSearchOpen(true)} />
        <div className={layout.content}>
          <h1 className={`${styles.title} brr-display`}>Favoritos</h1>

          {favoritos.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Heart size={28} /></div>
              <p className={styles.emptyTitle}>Sin favoritos todavía</p>
              <p className={styles.emptyDesc}>Marca tus platos favoritos con el corazón y aparecerán aquí.</p>
              <button className={styles.emptyBtn} onClick={() => navigate('/')}>Ver platos</button>
            </div>
          ) : (
            <div className={grid.grid}>
              {favoritos.map(p => (
                <ProductCard key={p.id} product={p} onOpenDetail={setDetailId} />
              ))}
            </div>
          )}
        </div>
      </main>

      <InlineCart />
      <GotoCartButton />
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />

      <ProductDetail productId={detailId} onClose={() => setDetailId(null)} />
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenDetail={(id) => { setDetailId(id); setSearchOpen(false); }}
      />
    </div>
  );
}
