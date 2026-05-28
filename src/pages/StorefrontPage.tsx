import { useState } from 'react';
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
import styles from './StorefrontPage.module.css';

export function StorefrontPage() {
  const [activeCat,   setActiveCat]   = useState('todos');
  const [detailId,    setDetailId]    = useState<string | null>(null);
  const [searchOpen,  setSearchOpen]  = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <MobileHeader onSearchOpen={() => setSearchOpen(true)} />

        <div className={styles.content}>
          {/* Desktop greeting */}
          <div className={styles.desktopTopBar}>
            <div>
              <h1 className={styles.greetTitle}>Hola 👋</h1>
              <p className={styles.greetSub}>¿Qué se te antoja hoy?</p>
            </div>
          </div>

          {/* Mobile greeting */}
          <div className={styles.mobileGreet}>
            <h1 className={styles.greetTitle}>¿Qué se te antoja hoy?</h1>
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
