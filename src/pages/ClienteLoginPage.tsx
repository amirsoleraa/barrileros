import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useClienteAuth } from '@/hooks/useClienteAuth';
import { useAppStore } from '@/stores/useAppStore';
import { isValidEmail } from '@/lib/utils';

export function ClienteLoginPage() {
  const navigate = useNavigate();
  const { cfg } = useAppStore();
  const { user, loading, signIn, signUp, signInWithGoogle } = useClienteAuth();

  const [mode,       setMode]       = useState<'login' | 'signup'>('login');
  const [nombre,     setNombre]     = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [err,        setErr]        = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/cuenta" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email) || password.length < 6) {
      setErr('Revisa el correo y que la contraseña tenga al menos 6 caracteres');
      return;
    }
    setErr(''); setSubmitting(true);
    const error = mode === 'login'
      ? await signIn(email, password)
      : await signUp(nombre, email, password);
    if (error) { setErr(error); setSubmitting(false); }
    else navigate('/cuenta', { replace: true });
  }

  async function handleGoogle() {
    setErr(''); setSubmitting(true);
    const error = await signInWithGoogle();
    if (error) { setErr(error); setSubmitting(false); }
    else navigate('/cuenta', { replace: true });
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-icon-wrap" style={{ background: 'var(--brand-light)' }}>
          <User size={32} color="var(--brand)" />
        </div>
        <h1 className="login-title">{cfg.nombreComercio}</h1>
        <p className="login-sub">{mode === 'login' ? 'Ingresa a tu cuenta' : 'Crea tu cuenta'}</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {mode === 'signup' && (
            <div className="f-field">
              <label>Nombre</label>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="f-field">
            <label>Correo</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
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
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>
          {err && <p className="login-err">{err}</p>}
          <button type="submit" className="btn-p" style={{ marginTop: 8 }} disabled={submitting}>
            {submitting ? 'Un momento...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="btn-s"
          style={{ width: '100%', marginTop: 10 }}
        >
          Continuar con Google
        </button>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setErr(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: 13, marginTop: 16, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {mode === 'login' ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Ingresa'}
        </button>

        <a href="/" className="login-back" style={{ marginTop: 12 }}>← Volver a la tienda</a>
      </div>
    </div>
  );
}
