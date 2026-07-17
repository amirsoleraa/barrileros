import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import styles from './NotificationsButton.module.css';

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.iconBtn} onClick={() => setOpen(o => !o)} aria-label="Notificaciones">
        <Bell size={18} />
      </button>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Notificaciones</div>
          <div className={styles.empty}>No tienes notificaciones nuevas</div>
        </div>
      )}
    </div>
  );
}
