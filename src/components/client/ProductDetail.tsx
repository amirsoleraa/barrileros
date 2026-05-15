import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useCartStore } from '@/stores/useCartStore';
import { fmtPrice } from '@/lib/utils';
import type { ProductoAdicional } from '@/types';
import styles from './ProductDetail.module.css';

interface ProductDetailProps {
  productId: string | null;
  onClose: () => void;
  onGoToCart: () => void;
}

export function ProductDetail({ productId, onClose, onGoToCart }: ProductDetailProps) {
  const { productos, adicionales } = useAppStore();
  const { addItem, setCartOpen } = useCartStore();

  const [qty, setQty] = useState(1);
  // Record<adicionalId, qty seleccionado>
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});

  const product = productId ? productos[productId] : null;

  useEffect(() => {
    if (productId) {
      setQty(1);
      setSelectedExtras({});
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  if (!product) return null;

  // Guard: existing products may have legacy string[] adicionales
  const prodAdicionales = (product.adicionales ?? []).filter(
    (a): a is ProductoAdicional => typeof a === 'object' && 'adicionalId' in a
  );

  function setExtraQty(adicionalId: string, value: number, cantidadMax: number) {
    const clamped = Math.max(0, Math.min(value, cantidadMax));
    setSelectedExtras(prev => ({ ...prev, [adicionalId]: clamped }));
  }

  const extrasUnitPrice = prodAdicionales.reduce((sum, pa) => {
    const ad = adicionales[pa.adicionalId];
    const selQty = selectedExtras[pa.adicionalId] ?? 0;
    return sum + (ad ? ad.precio * selQty : 0);
  }, 0);

  const unitPrice = product.precio + extrasUnitPrice;
  const total = unitPrice * qty;

  function handleAdd(openCart: boolean) {
    const extrasStrings: string[] = [];
    prodAdicionales.forEach(pa => {
      const ad = adicionales[pa.adicionalId];
      const selQty = selectedExtras[pa.adicionalId] ?? 0;
      if (ad && selQty > 0) {
        const label = selQty > 1 ? `${ad.nombre} (×${selQty})` : ad.nombre;
        extrasStrings.push(label);
      }
    });

    addItem({
      id: product!.id,
      name: product!.nombre,
      price: unitPrice,
      emoji: product!.emoji ?? '🍖',
      imgUrl: product!.imgUrl ?? '',
      qty,
      extras: extrasStrings,
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
          {prodAdicionales.length > 0 && (
            <div>
              <div className={styles.secLabel}>Adicionales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {prodAdicionales.map(pa => {
                  const ad = adicionales[pa.adicionalId];
                  if (!ad || !ad.activo) return null;
                  const selQty = selectedExtras[pa.adicionalId] ?? 0;
                  if (pa.cantidadMax === 1) {
                    return (
                      <div
                        key={pa.adicionalId}
                        className={`${styles.extraTag} ${selQty > 0 ? styles.selected : ''}`}
                        onClick={() => setExtraQty(pa.adicionalId, selQty > 0 ? 0 : 1, 1)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                      >
                        <span>{ad.nombre}</span>
                        {ad.precio > 0 && <span style={{ fontSize: 12, opacity: .8 }}>+{fmtPrice(ad.precio)}</span>}
                      </div>
                    );
                  }
                  return (
                    <div key={pa.adicionalId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border2)', background: selQty > 0 ? 'rgba(255,255,255,.05)' : 'transparent' }}>
                      <div>
                        <span style={{ fontSize: 14 }}>{ad.nombre}</span>
                        {ad.precio > 0 && <span style={{ fontSize: 12, color: 'var(--brand)', marginLeft: 8 }}>+{fmtPrice(ad.precio)} c/u</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          onClick={() => setExtraQty(pa.adicionalId, selQty - 1, pa.cantidadMax)}
                        ><Minus size={13} /></button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{selQty}</span>
                        <button
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border2)', background: selQty >= pa.cantidadMax ? 'var(--border2)' : 'var(--brand)', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: selQty >= pa.cantidadMax ? 'not-allowed' : 'pointer' }}
                          onClick={() => setExtraQty(pa.adicionalId, selQty + 1, pa.cantidadMax)}
                          disabled={selQty >= pa.cantidadMax}
                        ><Plus size={13} /></button>
                      </div>
                    </div>
                  );
                })}
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
