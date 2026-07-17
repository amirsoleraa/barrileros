import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Heart } from 'lucide-react';
import { Sidebar }       from '@/components/client/Sidebar';
import { MobileHeader }  from '@/components/client/MobileHeader';
import { BottomNav }     from '@/components/client/BottomNav';
import { PromoBanner }   from '@/components/client/PromoBanner';
import { CategoryBar }   from '@/components/client/CategoryBar';
import { ProductGrid }   from '@/components/client/ProductGrid';
import { ProductDetail } from '@/components/client/ProductDetail';
import { SearchOverlay } from '@/components/client/SearchOverlay';
import { InlineCart }    from '@/components/client/InlineCart';
import { GotoCartButton } from '@/components/client/GotoCartButton';
import { NotificationsButton } from '@/components/client/NotificationsButton';
import { useClienteStore } from '@/stores/useClienteStore';
import styles from './StorefrontPage.module.css';

export function StorefrontPage() {
  const navigate = useNavigate();
  const { cliente } = useClienteStore();
  const [activeCat,   setActiveCat]   = useState('todos');
  const [detailId,    setDetailId]    = useState<string | null>(null);
  const [searchOpen,  setSearchOpen]  = useState(false);

  const primerNombre = cliente?.nombre?.split(' ')[0];

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <MobileHeader onSearchOpen={() => setSearchOpen(true)} />

        <div className={styles.content}>
          {/* Desktop greeting + search + acciones */}
          <div className={styles.desktopTopBar}>
            <div>
              <h1 className={`${styles.greetTitle} brr-display`}>
                ¿Qué se te antoja{primerNombre ? <>, <span className={styles.greetName}>{primerNombre}</span></> : ' hoy'}?
              </h1>
            </div>
            <div className={styles.topBarActions}>
              <button className={styles.searchBar} onClick={() => setSearchOpen(true)}>
                <Search size={16} />
                <span>Buscar bandejas, chorizos, bebidas…</span>
              </button>
              <NotificationsButton />
              <button className={styles.roundIconBtn} onClick={() => navigate('/favoritos')} aria-label="Favoritos">
                <Heart size={18} />
              </button>
            </div>
          </div>

          {/* Mobile greeting */}
          <div className={styles.mobileGreet}>
            <h1 className={`${styles.greetTitle} brr-display`}>
              ¿Qué se te antoja{primerNombre ? <>, <span className={styles.greetName}>{primerNombre}</span></> : ' hoy'}?
            </h1>
          </div>

          <CategoryBar activeCat={activeCat} onSelect={setActiveCat} />
          <PromoBanner />
          <ProductGrid activeCat={activeCat} onOpenDetail={setDetailId} />
        </div>
      </main>

      <InlineCart />
      <GotoCartButton />
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />

      <ProductDetail
        productId={detailId}
        onClose={() => setDetailId(null)}
      />
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenDetail={(id) => { setDetailId(id); setSearchOpen(false); }}
      />
    </div>
  );
}
