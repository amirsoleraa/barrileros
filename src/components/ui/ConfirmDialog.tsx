import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setRequest({ ...opts, resolve });
    });
  }, []);

  function handleResult(result: boolean) {
    request?.resolve(result);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {request && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            backdropFilter: 'blur(2px)',
            animation: 'overlayIn .22s ease',
          }}
          onClick={e => e.target === e.currentTarget && handleResult(false)}
        >
          <div style={{
            background: 'var(--surface)', borderRadius: 18,
            padding: '24px 24px 20px',
            maxWidth: 400, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,.25)',
            border: '1px solid var(--border)',
            animation: 'popIn .32s cubic-bezier(.34,1.56,.64,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: request.danger ? 'var(--danger-bg)' : 'var(--brand-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {request.danger
                  ? <Trash2 size={18} color="var(--danger)" />
                  : <AlertTriangle size={18} color="var(--brand)" />
                }
              </div>
              <div style={{ flex: 1 }}>
                {request.title && (
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {request.title}
                  </div>
                )}
                <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
                  {request.message}
                </div>
              </div>
              <button
                onClick={() => handleResult(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, flexShrink: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                className="btn-s"
                onClick={() => handleResult(false)}
              >
                {request.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => handleResult(true)}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
                  background: request.danger ? 'var(--danger)' : 'var(--brand)',
                  color: '#fff',
                  transition: 'opacity .15s, transform .16s cubic-bezier(.34,1.56,.64,1)',
                }}
              >
                {request.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(.9) translateY(12px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx.confirm;
}
