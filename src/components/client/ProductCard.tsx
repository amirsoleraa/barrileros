import { Plus, Minus, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/useCartStore';
import { useAppStore } from '@/stores/useAppStore';
import { useClienteStore } from '@/stores/useClienteStore';
import { fmtPrice } from '@/lib/utils';
import { cldUrl } from '@/lib/cloudinary';
import type { Producto } from '@/types';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Producto;
  onOpenDetail: (id: string) => void;
}

function initials(nombre: string) {
  return nombre.split(' ').slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase();
}

export function ProductCard({ product, onOpenDetail }: ProductCardProps) {
  const navigate = useNavigate();
  const { cart, updateQty } = useCartStore();
  const { categorias } = useAppStore();
  const { cliente, toggleFavorito } = useClienteStore();

  const productEntries = cart.filter(i => i.id === product.id);
  const totalQty = productEntries.reduce((sum, i) => sum + i.qty, 0);
  const catName = categorias[product.categoriaId]?.nombre ?? '';
  const isFav = cliente?.favoritos.includes(product.id) ?? false;

  function handleFav(e: React.MouseEvent) {
    e.stopPropagation();
    if (!cliente) { navigate('/login'); return; }
    toggleFavorito(product.id);
  }

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onOpenDetail(product.id);
  }

  function decrement(e: React.MouseEvent) {
    e.stopPropagation();
    if (productEntries.length === 0) return;
    const last = productEntries[productEntries.length - 1];
    updateQty(product.id, last.extras, -1);
  }

  return (
    <div className={styles.card} onClick={() => onOpenDetail(product.id)}>
      {/* Image area */}
      <div className={styles.img}>
        {product.imgUrl ? (
          <img src={cldUrl(product.imgUrl, 400)} alt={product.nombre} loading="lazy" />
        ) : (
          <span className={styles.initials}>{initials(product.nombre)}</span>
        )}

        {/* Badge (top-left) */}
        {catName && (
          <div className={styles.badge}>
            {!product.imgUrl && <span className={styles.badgeSeg}>FOTO</span>}
            <span className={styles.badgeSeg}>{catName.toUpperCase()}</span>
          </div>
        )}

        {/* Favorito (top-right) */}
        <button className={styles.favBtn} onClick={handleFav} aria-label="Favorito">
          <Heart size={14} fill={isFav ? '#E94B1F' : 'none'} stroke={isFav ? '#E94B1F' : '#fff'} />
        </button>
      </div>

      {/* Info area */}
      <div className={styles.info}>
        <span className={styles.name}>{product.nombre}</span>
        <div className={styles.bottom}>
          <span className={styles.price}>{fmtPrice(product.precio)}</span>
          {totalQty === 0 ? (
            <button className={styles.addBtn} onClick={quickAdd} aria-label="Agregar">
              <Plus size={16} />
            </button>
          ) : (
            <div className={styles.qtyControl}>
              <button className={styles.qtyBtn} onClick={decrement}><Minus size={12} /></button>
              <span className={styles.qtyNum}>{totalQty}</span>
              <button className={styles.qtyBtn} onClick={quickAdd}><Plus size={12} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
