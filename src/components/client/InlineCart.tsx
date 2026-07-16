import { useState } from 'react';
import { Minus, Plus, ShoppingBag, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/stores/useCartStore';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import styles from './InlineCart.module.css';

export function InlineCart() {
  const { cart, updateQty, removeItem, cuponAplicado } = useCartStore();
  const { cfg } = useAppStore();
  const navigate = useNavigate();
  const [deliveryMode, setDeliveryMode] = useState<'domicilio' | 'recoger'>('domicilio');
  const [promoCode, setPromoCode] = useState('');

  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const domicilio = deliveryMode === 'domicilio' && cfg.domicilioActivo
    ? (cfg.domicilioTipo === 'gratis' ? 0 : cfg.domicilioValor)
    : 0;
  const descuento = cuponAplicado
    ? (cuponAplicado.tipo === 'porcentaje'
        ? Math.round(subtotal * cuponAplicado.valor / 100)
        : cuponAplicado.valor)
    : 0;
  const total = subtotal + domicilio - descuento;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Tu pedido
          {cartCount > 0 && <span className={styles.count}>{cartCount}</span>}
        </h2>
        {cart.length > 0 && (
          <button className={styles.clearBtn} onClick={() => cart.forEach(i => removeItem(i.id, i.extras))}>
            Vaciar
          </button>
        )}
      </div>

      {/* Delivery mode toggle */}
      {cfg.domicilioActivo && (
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeBtn} ${deliveryMode === 'domicilio' ? styles.modeBtnActive : ''}`}
            onClick={() => setDeliveryMode('domicilio')}
          >
            🛵 Domicilio · 25 min
          </button>
          <button
            className={`${styles.modeBtn} ${deliveryMode === 'recoger' ? styles.modeBtnActive : ''}`}
            onClick={() => setDeliveryMode('recoger')}
          >
            🏪 Recoger · 10 min
          </button>
        </div>
      )}

      {/* Empty state */}
      {cart.length === 0 ? (
        <div className={styles.empty}>
          <ShoppingBag size={42} strokeWidth={1.5} color="var(--border2)" />
          <p className={styles.emptyTitle}>Tu pedido está vacío</p>
          <span className={styles.emptyDesc}>Agrega algo del menú para comenzar</span>
        </div>
      ) : (
        <div className={styles.list}>
          {cart.map((item, idx) => (
            <div key={`${item.id}-${item.extras.join(',')}-${idx}`} className={styles.item}>
              <div className={styles.itemImg}>
                {item.imgUrl
                  ? <img src={item.imgUrl} alt={item.name} />
                  : <span>{item.emoji || '🍖'}</span>
                }
              </div>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.name}</div>
                {item.extras.length > 0 && (
                  <div className={styles.itemExtras}>+ {item.extras.join(', ')}</div>
                )}
              </div>
              <div className={styles.itemRight}>
                <button className={styles.removeBtn} onClick={() => removeItem(item.id, item.extras)} aria-label="Eliminar">
                  <X size={12} />
                </button>
                <div className={styles.itemQty}>
                  <button className={styles.qBtn} onClick={() => updateQty(item.id, item.extras, -1)}><Minus size={11} /></button>
                  <span className={styles.qNum}>{item.qty}</span>
                  <button className={styles.qBtn} onClick={() => updateQty(item.id, item.extras, 1)}><Plus size={11} /></button>
                </div>
                <span className={styles.itemPrice}>{fmtPrice(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {cart.length > 0 && (
        <div className={styles.footer}>
          <div className={styles.promoRow}>
            <input
              className={styles.promoInput}
              placeholder="Código promocional"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              autoComplete="off"
            />
            <button className={styles.promoApply}>Aplicar</button>
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{fmtPrice(subtotal)}</span>
            </div>
            {cfg.domicilioActivo && deliveryMode === 'domicilio' && (
              <div className={styles.summaryRow}>
                <span>Domicilio</span>
                <span style={{ color: domicilio === 0 ? 'var(--success)' : undefined }}>
                  {domicilio === 0 ? '¡Gratis!' : fmtPrice(domicilio)}
                </span>
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

          <button className={styles.checkoutBtn} onClick={() => navigate('/resumen')}>
            Ir a pagar
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
