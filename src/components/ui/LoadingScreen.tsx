import { useAppStore } from '@/stores/useAppStore';
import styles from './LoadingScreen.module.css';

export function LoadingScreen() {
  const { isLoading } = useAppStore();

  if (!isLoading) return null;

  return (
    <div className={styles.screen}>
      <img src="/splash-screem.svg" alt="splash" className={styles.splash} />
    </div>
  );
}
