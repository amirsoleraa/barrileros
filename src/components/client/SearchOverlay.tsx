import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { fmtPrice } from '@/lib/utils';
import styles from './SearchOverlay.module.css';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetail: (id: string) => void;
}

export function SearchOverlay({ isOpen, onClose, onOpenDetail }: SearchOverlayProps) {
  const { productos } = useAppStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const results = query.trim().length < 2
    ? []
    : Object.values(productos).filter(p =>
        p.activo && (
          p.nombre.toLowerCase().includes(query.toLowerCase()) ||
          (p.descripcion ?? '').toLowerCase().includes(query.toLowerCase())
        )
      ).slice(0, 8);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.box}>
        <div className={styles.bar}>
          <Search size={18} color="var(--text3)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            autoComplete="off"
          />
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {results.length > 0 && (
          <div className={styles.results}>
            {results.map(p => (
              <div
                key={p.id}
                className={styles.item}
                onClick={() => { onOpenDetail(p.id); onClose(); }}
              >
                <div className={styles.sImg}>
                  {p.imgUrl ? <img src={p.imgUrl} alt={p.nombre} /> : <span>{p.emoji ?? '🍖'}</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {fmtPrice(p.precio)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {query.trim().length >= 2 && results.length === 0 && (
          <div className="empty-s" style={{ padding: '30px 20px' }}>
            Sin resultados para "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
