import { CheckCircle2, AlertCircle, Info, Bell } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './Toast.module.css';

const ICONS = {
  success: CheckCircle2,
  error:   AlertCircle,
  info:    Info,
  default: Bell,
} as const;

export function Toast() {
  const { message, visible, type } = useAppStore((s) => s.toast);
  const Icon = ICONS[type ?? 'default'];

  return (
    <div className={`${styles.toast} ${styles[type ?? 'default']} ${visible ? styles.show : ''}`}>
      <Icon size={15} />
      {message}
    </div>
  );
}
