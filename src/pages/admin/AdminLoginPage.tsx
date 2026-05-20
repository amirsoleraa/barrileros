import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/useAppStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { cfg } = useAppStore();
  const { user, loading: authLoading, signIn } = useAuth();
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [err, setErr]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [roleState, setRoleState]   = useState<'checking' | 'admin' | 'other'>('other');
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!user) { setRoleState('other'); setRoleChecked(false); return; }
    setRoleState('checking');
    setRoleChecked(false);
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { setRoleState(snap.data()?.role === 'admin' ? 'admin' : 'other'); setRoleChecked(true); })
      .catch(() => { setRoleState('other'); setRoleChecked(true); });
  }, [user?.uid]);

  // Only sign out after the check confirms non-admin (prevents race condition on login)
  useEffect(() => {
    if (roleChecked && roleState === 'other' && user) signOut(auth);
  }, [roleChecked, roleState, user]);

  if (authLoading || roleState === 'checking') return null;
  if (user && roleState === 'admin') return <Navigate to="/admin" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !pass) return;
    setErr('');
    setSubmitting(true);
    const error = await signIn(email.trim(), pass);
    if (error) {
      setErr(error);
      setSubmitting(false);
    } else {
      navigate('/admin', { replace: true });
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-icon-wrap">
          {cfg.logoUrl
            ? <img src={cfg.logoUrl} alt={cfg.nombreComercio} />
            : <span>{cfg.logoEmoji}</span>
          }
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
              required
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
              required
            />
          </div>
          {err && <p className="login-err">{err}</p>}
          <button
            type="submit"
            className="btn-p"
            style={{ marginTop: 8 }}
            disabled={submitting}
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <a href="/" className="login-back" style={{ marginTop: 20 }}>← Volver a la tienda</a>
      </div>
    </div>
  );
}
