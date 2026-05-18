import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Bike } from 'lucide-react';
import { useDomAuth } from '@/hooks/useDomAuth';
import { useAppStore } from '@/stores/useAppStore';

export function DomiciliarioLoginPage() {
  const navigate = useNavigate();
  const { cfg }  = useAppStore();
  const { session, loading, signIn } = useDomAuth();
  const [usuario,    setUsuario]    = useState('');
  const [password,   setPassword]   = useState('');
  const [err,        setErr]        = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (session) return <Navigate to="/domiciliario" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !password) return;
    setErr(''); setSubmitting(true);
    const error = await signIn(usuario, password);
    if (error) { setErr(error); setSubmitting(false); }
    else navigate('/domiciliario', { replace: true });
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-icon-wrap" style={{ background: 'var(--brand-light)' }}>
          <Bike size={32} color="var(--brand)" />
        </div>
        <h1 className="login-title">{cfg.nombreComercio}</h1>
        <p className="login-sub">Portal Domiciliarios</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="f-field">
            <label>Usuario</label>
            <input
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="Tu usuario"
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>
          <div className="f-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="btn-p" style={{ marginTop: 8 }} disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="login-back" style={{ marginTop: 20 }}>← Volver a la tienda</a>
      </div>
    </div>
  );
}
