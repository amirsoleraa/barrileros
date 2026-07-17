import { MapPin, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';
import { LocationPicker } from './LocationPicker';
import styles from './LocationTrigger.module.css';

export function LocationTrigger() {
  const { locationData, setLocationData } = useCartStore();

  return (
    <LocationPicker
      initialData={locationData}
      onChange={setLocationData}
      renderTrigger={({ onClick, preview }) => (
        <button type="button" className={styles.trigger} onClick={onClick}>
          <MapPin size={14} className={styles.pin} />
          <div className={styles.text}>
            <span className={styles.label}>Entrega a</span>
            <span className={styles.addr}>
              {preview ? (preview.barrio || preview.address) : 'Selecciona tu dirección'}
            </span>
          </div>
          <ChevronRight size={14} className={styles.chevron} />
        </button>
      )}
    />
  );
}
