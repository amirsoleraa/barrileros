import { Check } from 'lucide-react';
import type { Pedido } from '@/types';
import styles from './OrderConfirmationModal.module.css';

interface OrderConfirmationModalProps {
  pedido: Pedido;
  onClose: () => void;
}

export function OrderConfirmationModal({ pedido, onClose }: OrderConfirmationModalProps) {
  const direccion = pedido.location?.address
    || [pedido.cliente.dir, pedido.cliente.barrio].filter(Boolean).join(', ');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.ringWrap}>
          <span className={styles.ring} />
          <span className={styles.check}>
            <Check size={38} color="#fff" strokeWidth={3} />
          </span>
        </div>

        <h2 className={`${styles.title} brr-display`}>¡Pedido en la parrilla!</h2>

        <p className={styles.sub}>
          {pedido.mensajeConfirmacion || 'Te avisamos cuando salga del barril.'}
          {direccion && <> Llega a {direccion}.</>}
        </p>

        <div className={`${styles.numPill} brr-eyebrow`}>#{pedido.numero}</div>

        <button className={styles.btn} onClick={onClose}>Seguir explorando</button>
      </div>
    </div>
  );
}
