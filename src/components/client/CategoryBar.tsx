import { useAppStore } from '@/stores/useAppStore';
import styles from './CategoryBar.module.css';

interface CategoryBarProps {
  activeCat: string;
  onSelect: (catId: string) => void;
}

export function CategoryBar({ activeCat, onSelect }: CategoryBarProps) {
  const { categorias } = useAppStore();
  const cats = Object.values(categorias).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.pill} ${activeCat === 'todos' ? styles.active : ''}`}
        onClick={() => onSelect('todos')}
      >
        Todo
      </button>
      {cats.map(cat => (
        <button
          key={cat.id}
          className={`${styles.pill} ${activeCat === cat.id ? styles.active : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.nombre}
        </button>
      ))}
    </div>
  );
}
