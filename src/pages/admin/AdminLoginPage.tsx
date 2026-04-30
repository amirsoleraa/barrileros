import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { cfg } = useAppStore();
  const [email, setEmail] = useState('');
  const [pass, setPass]  = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/admin');
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-icon-wrap">
          {cfg.logoUrl ? <img src={cfg.logoUrl} alt={cfg.nombreComercio} /> : <span>{cfg.logoEmoji}</span>}
        </div>
        <h1 className="login-title">{cfg.nombreComercio}</h1>
        <p className="login-sub">Panel de administración</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="f-field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@correo.com"
              autoComplete="email"
            />
          </div>
          <div className="f-field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {err && <p className="login-err">{err}</p>}
          <button
            type="submit"
            className="btn-p"
            style={{ marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="login-back" style={{ marginTop: 20 }}>← Volver a la tienda</a>
      </div>
    </div>
  );
}
