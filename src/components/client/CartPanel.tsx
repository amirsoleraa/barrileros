import { X, ShoppingCart, Minus, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/useCartStore';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import { cldUrl } from '@/lib/cloudinary';
import styles from './CartPanel.module.css';

export function CartPanel() {
  const { cart, cartOpen, setCartOpen, updateQty, removeItem, cuponAplicado, locationData } = useCartStore();
  const { cfg } = useAppStore();
  const navigate = useNavigate();

  const esPorKm = cfg.domicilioTipo === 'por_km';
  const domicilioPendiente = cfg.domicilioActivo && esPorKm && !locationData;

  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const domicilio = cfg.domicilioActivo
    ? (cfg.domicilioTipo === 'gratis' ? 0 : esPorKm ? (locationData?.delivery_fee ?? 0) : cfg.domicilioValor)
    : 0;
  const descuento = cuponAplicado
    ? (cuponAplicado.tipo === 'porcentaje'
        ? Math.round(subtotal * cuponAplicado.valor / 100)
        : cuponAplicado.valor)
    : 0;
  const total = subtotal + domicilio - descuento;

  if (!cartOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={() => setCartOpen(false)} />
      <div className={styles.panel}>

        {/* Header */}
        <div className={styles.header}>
          <h2>Mi carrito</h2>
          {cart.length > 0 && (
            <span className={styles.count}>{cart.reduce((s, i) => s + i.qty, 0)} items</span>
          )}
          <button className={styles.close} onClick={() => setCartOpen(false)} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Empty state */}
        {cart.length === 0 ? (
          <div className={styles.emptyState}>
            <ShoppingCart size={52} color="var(--border2)" />
            <div className={styles.emptyTitle}>Carrito vacío</div>
            <div className={styles.emptyDesc}>Agrega productos del menú para comenzar tu pedido</div>
          </div>
        ) : (
          <div className={styles.list}>
            {cart.map((item, idx) => (
              <div key={`${item.id}-${item.extras.join(',')}-${idx}`} className={styles.item}>
                <div className={styles.itemImg}>
                  {item.imgUrl
                    ? <img src={cldUrl(item.imgUrl, 150)} alt={item.name} />
                    : <span>{item.emoji}</span>
                  }
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemName}>{item.name}</div>
                  {item.extras.length > 0 && (
                    <div className={styles.itemExtras}>+ {item.extras.join(', ')}</div>
                  )}
                  <div className={styles.itemPrice}>{fmtPrice(item.price * item.qty)}</div>
                </div>
                <div className={styles.itemRight}>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeItem(item.id, item.extras)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                  <div className={styles.itemQty}>
                    <button className={styles.qBtn} onClick={() => updateQty(item.id, item.extras, -1)}>
                      <Minus size={13} />
                    </button>
                    <span className={styles.qNum}>{item.qty}</span>
                    <button className={styles.qBtn} onClick={() => updateQty(item.id, item.extras, 1)}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer / summary */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{fmtPrice(subtotal)}</span>
              </div>
              {cfg.domicilioActivo && (
                <div className={styles.summaryRow}>
                  <span>Domicilio</span>
                  {domicilioPendiente ? (
                    <span style={{ color: 'var(--text3)', fontSize: 12 }}>Selecciona tu ubicación</span>
                  ) : (
                    <span style={{ color: domicilio === 0 ? 'var(--success)' : undefined }}>
                      {domicilio === 0 ? '¡Gratis!' : fmtPrice(domicilio)}
                    </span>
                  )}
                </div>
              )}
              {descuento > 0 && (
                <div className={styles.summaryRow} style={{ color: 'var(--success)' }}>
                  <span>Descuento</span>
                  <span>-{fmtPrice(descuento)}</span>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>{fmtPrice(total)}</span>
              </div>
            </div>
            <button
              className="btn-p"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => { setCartOpen(false); navigate('/resumen'); }}
            >
              Finalizar pedido
              <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </>
  );
}
