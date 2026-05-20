import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAdminInit } from '@/hooks/useAdminInit';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { Toast } from '@/components/ui/Toast';
import styles from './AdminPage.module.css';

function AdminContent() {
  const ready = useAdminInit();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {menuOpen && (
        <div className={styles.overlay} onClick={() => setMenuOpen(false)} />
      )}

      <AdminSidebar mobileOpen={menuOpen} onMobileClose={() => setMenuOpen(false)} />

      <div className={styles.main}>
        <AdminTopbar onMenuToggle={() => setMenuOpen(v => !v)} />
        <div className={styles.content}>
          {ready ? <Outlet /> : (
            <div className="empty-s">Cargando datos...</div>
          )}
        </div>
      </div>

      <Toast />
    </div>
  );
}

function AdminGuard() {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); setRoleChecked(true); return; }
    getDoc(doc(db, 'users', user.uid))
      .then(snap => { setIsAdmin(snap.data()?.role === 'admin'); setRoleChecked(true); })
      .catch(() => { setIsAdmin(false); setRoleChecked(true); });
  }, [user?.uid]);

  // Sign out any authenticated non-admin so they don't loop back here
  useEffect(() => {
    if (roleChecked && !isAdmin && user) signOut(auth);
  }, [roleChecked, isAdmin, user]);

  if (loading || !roleChecked) return null;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return <AdminContent />;
}

export function AdminPage() {
  return <AdminGuard />;
}
