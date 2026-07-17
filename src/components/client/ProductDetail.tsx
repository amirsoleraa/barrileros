import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Minus, Plus, Heart, Share2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/useAppStore';
import { useCartStore } from '@/stores/useCartStore';
import { useClienteStore } from '@/stores/useClienteStore';
import { fmtPrice } from '@/lib/utils';
import { cldUrl } from '@/lib/cloudinary';
import type { ProductoAdicional } from '@/types';
import styles from './ProductDetail.module.css';

interface ProductDetailProps {
  productId: string | null;
  onClose: () => void;
}

export function ProductDetail({ productId, onClose }: ProductDetailProps) {
  const navigate = useNavigate();
  const { productos, adicionales, categorias, showToast } = useAppStore();
  const { cliente, toggleFavorito } = useClienteStore();
  const { addItem } = useCartStore();
  const cardRef = useRef<HTMLDivElement>(null);

  const [qty, setQty] = useState(1);
  // Record<adicionalId, qty seleccionado>
  const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
  const [scrolled, setScrolled] = useState(false);

  const product = productId ? productos[productId] : null;

  useEffect(() => {
    if (productId) {
      setQty(1);
      setSelectedExtras({});
      setScrolled(false);
      cardRef.current?.scrollTo({ top: 0 });
    }
  }, [productId]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  function handleScroll() {
    setScrolled((cardRef.current?.scrollTop ?? 0) > 30);
  }

  if (!product) return null;

  const catName = categorias[product.categoriaId]?.nombre ?? '';
  const isFav = cliente?.favoritos.includes(product.id) ?? false;

  function handleFav() {
    if (!cliente) { navigate('/login'); return; }
    toggleFavorito(product!.id);
  }

  async function handleShare() {
    const url = `${window.location.origin}/?producto=${product!.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: product!.nombre, url }); } catch { /* cancelado */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Enlace copiado', 'success');
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  }

  // Guard: existing products may have legacy string[] adicionales
  const prodAdicionales = (product.adicionales ?? []).filter(
    (a): a is ProductoAdicional => typeof a === 'object' && 'adicionalId' in a
  );

  function setExtraQty(adicionalId: string, value: number, cantidadMax: number) {
    const clamped = Math.max(0, Math.min(value, cantidadMax));
    setSelectedExtras(prev => ({ ...prev, [adicionalId]: clamped }));
  }

  const selectedCount = Object.values(selectedExtras).filter(v => v > 0).length;

  const extrasUnitPrice = prodAdicionales.reduce((sum, pa) => {
    const ad = adicionales[pa.adicionalId];
    const selQty = selectedExtras[pa.adicionalId] ?? 0;
    return sum + (ad ? ad.precio * selQty : 0);
  }, 0);

  const unitPrice = product.precio + extrasUnitPrice;
  const total = unitPrice * qty;

  function handleAdd() {
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
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card} ref={cardRef} onScroll={handleScroll}>

        {/* Imagen */}
        <div className={`${styles.img} ${scrolled ? styles.imgScrolled : ''}`}>
          {product.imgUrl
            ? <img src={cldUrl(product.imgUrl, 800)} alt={product.nombre} />
            : <span className={styles.imgEmoji}>{product.emoji ?? '🍖'}</span>
          }
          <button className={styles.back} onClick={onClose} aria-label="Volver">
            <ArrowLeft size={20} />
          </button>
          <div className={styles.imgActionsRight}>
            <button className={styles.roundBtn} onClick={handleFav} aria-label="Favorito">
              <Heart size={18} fill={isFav ? '#E94B1F' : 'none'} stroke={isFav ? '#E94B1F' : '#fff'} />
            </button>
            <button className={styles.roundBtn} onClick={handleShare} aria-label="Compartir">
              <Share2 size={17} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className={styles.infoCol}>
          <div className={styles.scrollArea}>
            {catName && <div className={`${styles.eyebrow} brr-eyebrow`}>{catName}</div>}
            <h2 className={`${styles.name} brr-display`}>{product.nombre}</h2>
            {product.descripcion && (
              <p className={styles.desc}>{product.descripcion}</p>
            )}

            {/* Adicionales */}
            {prodAdicionales.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <span className={styles.secLabel}>Adicionales</span>
                  <span className={styles.secCount}>{selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}</span>
                </div>
                <div className={styles.extraList}>
                  {prodAdicionales.map(pa => {
                    const ad = adicionales[pa.adicionalId];
                    if (!ad || !ad.activo) return null;
                    const selQty = selectedExtras[pa.adicionalId] ?? 0;

                    if (pa.cantidadMax === 1) {
                      return (
                        <div
                          key={pa.adicionalId}
                          className={`${styles.extraRow} ${selQty > 0 ? styles.extraRowActive : ''}`}
                          onClick={() => setExtraQty(pa.adicionalId, selQty > 0 ? 0 : 1, 1)}
                        >
                          <span className={`${styles.checkbox} ${selQty > 0 ? styles.checkboxActive : ''}`}>
                            {selQty > 0 && <Check size={13} color="#fff" strokeWidth={3} />}
                          </span>
                          <span className={styles.extraName}>{ad.nombre}</span>
                          <span className={styles.extraPrice}>{ad.precio > 0 ? `+${fmtPrice(ad.precio)}` : 'Gratis'}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={pa.adicionalId} className={`${styles.extraRow} ${selQty > 0 ? styles.extraRowActive : ''}`}>
                        <div className={styles.extraName} style={{ flex: 1 }}>
                          {ad.nombre}
                          {ad.precio > 0 && <span className={styles.extraSub}> +{fmtPrice(ad.precio)} c/u</span>}
                        </div>
                        <div className={styles.miniStepper}>
                          <button
                            className={styles.miniStepBtn}
                            onClick={() => setExtraQty(pa.adicionalId, selQty - 1, pa.cantidadMax)}
                          ><Minus size={13} /></button>
                          <span className={styles.miniStepNum}>{selQty}</span>
                          <button
                            className={styles.miniStepBtn}
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

            {/* Contiene */}
            {product.tipo === 'comestible' && product.ingredientes?.length > 0 && (
              <div className={styles.section}>
                <span className={`${styles.secLabel} brr-eyebrow`}>Contiene</span>
                <div className={styles.tagWrap}>
                  {product.ingredientes.map(ing => (
                    <span key={ing} className={styles.ingrTag}>{ing}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Barra fija de cantidad + agregar */}
          <div className={styles.bottomBar}>
            <div className={styles.sqCtrl}>
              <button className={styles.sqBtn} onClick={() => setQty(q => Math.max(1, q - 1))}>
                <Minus size={16} />
              </button>
              <span className={styles.sqNum}>{qty}</span>
              <button className={styles.sqBtn} onClick={() => setQty(q => q + 1)}>
                <Plus size={16} />
              </button>
            </div>
            <button className={styles.addBtn} onClick={handleAdd}>
              <span className={styles.addLabel}><Plus size={16} /> Agregar al carrito</span>
              <span className={styles.addPrice}>{fmtPrice(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
