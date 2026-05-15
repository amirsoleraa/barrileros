import { useState, useEffect } from 'react';
import { Header } from '@/components/client/Header';
import { CategoryBar } from '@/components/client/CategoryBar';
import { ProductGrid } from '@/components/client/ProductGrid';
import { ProductDetail } from '@/components/client/ProductDetail';
import { SearchOverlay } from '@/components/client/SearchOverlay';
import { GotoCartButton } from '@/components/client/GotoCartButton';
import { PromoBanner } from '@/components/client/PromoBanner';
import { useFirebaseInit } from '@/hooks/useFirebaseInit';
import { useTheme } from '@/hooks/useTheme';

export function StorefrontPage() {
  useFirebaseInit();
  useTheme();

  // Apply dark theme to root element for client pages
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
    return () => { delete document.documentElement.dataset.theme; };
  }, []);

  const [activeCat, setActiveCat] = useState('todos');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <PromoBanner />
      <CategoryBar activeCat={activeCat} onSelect={setActiveCat} />
      <ProductGrid activeCat={activeCat} onOpenDetail={setDetailId} />
      <GotoCartButton />

      <ProductDetail
        productId={detailId}
        onClose={() => setDetailId(null)}
      />

      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenDetail={(id) => { setDetailId(id); setSearchOpen(false); }}
      />
    </>
  );
}
