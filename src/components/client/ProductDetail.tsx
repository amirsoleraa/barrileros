import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCartStore } from '@/stores/useCartStore';
import { fmtPrice } from '@/lib/utils';
import styles from './ProductDetail.module.css';

interface ProductDetailProps {
  productId: string | null;
  onClose: () => void;
  onGoToCart: () => void;
}

export function ProductDetail({ productId, onClose, onGoToCart }: ProductDetailProps) {
  const { productos } = useAppStore();
  const { addItem, setCartOpen } = useCartStore();

  const [qty, setQty] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const product = productId ? productos[productId] : null;

  useEffect(() => {
    if (productId) {
      setQty(1);
      setSelectedExtras([]);
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  function toggleExtra(name: string) {
    setSelectedExtras(prev =>
      prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]
    );
  }

  const extrasTotal = 0; // Los adicionales no tienen precio extra en este modelo
  const total = (product.precio + extrasTotal) * qty;

  function handleAdd(openCart: boolean) {
    addItem({
      id: product!.id,
      name: product!.nombre,
      price: product!.precio,
      emoji: product!.emoji ?? '🍖',
      imgUrl: product!.imgUrl ?? '',
      qty,
      extras: selectedExtras,
    });
    onClose();
    if (openCart) {
      setCartOpen(true);
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>
        {/* Imagen */}
        <div className={styles.img}>
          {product.imgUrl
            ? <img src={product.imgUrl} alt={product.nombre} />
            : <span style={{ fontSize: 90 }}>{product.emoji ?? '🍖'}</span>
          }
          <button className={styles.back} onClick={onClose} aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className={styles.body}>
          <h2 className={styles.name}>{product.nombre}</h2>
          {product.descripcion && (
            <p className={styles.desc}>{product.descripcion}</p>
          )}
          <div className={styles.price}>{fmtPrice(product.precio)}</div>

          {/* Ingredientes */}
          {product.tipo === 'comestible' && product.ingredientes?.length > 0 && (
            <div>
              <div className={styles.secLabel}>Ingredientes</div>
              <div>
                {product.ingredientes.map(ing => (
                  <span key={ing} className={styles.ingrTag}>{ing}</span>
                ))}
              </div>
            </div>
          )}

          {/* Adicionales */}
          {product.adicionales?.length > 0 && (
            <div>
              <div className={styles.secLabel}>Adicionales</div>
              <div>
                {product.adicionales.map(ext => (
                  <span
                    key={ext}
                    className={`${styles.extraTag} ${selectedExtras.includes(ext) ? styles.selected : ''}`}
                    onClick={() => toggleExtra(ext)}
                  >
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom sheet */}
        <div className={styles.bottomSheet}>
          <div className={styles.sqRow}>
            <div className={styles.sqCtrl}>
              <button className={styles.sqBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>
                <Minus size={18} />
              </button>
              <span className={styles.sqNum}>{qty}</span>
              <button className={styles.sqBtn} onClick={() => setQty(q => q + 1)}>
                <Plus size={18} />
              </button>
            </div>
            <span className={styles.sqTotal}>{fmtPrice(total)}</span>
          </div>
          <div className={styles.sheetActions}>
            <button className="btn-s" onClick={() => handleAdd(false)}>
              Agregar
            </button>
            <button className="btn-p" onClick={() => handleAdd(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <ShoppingCart size={16} />
              Ver carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
