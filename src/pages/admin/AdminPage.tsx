import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAdminInit } from '@/hooks/useAdminInit';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopbar } from '@/components/admin/AdminTopbar';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Toast } from '@/components/ui/Toast';
import styles from './AdminPage.module.css';

function AdminContent() {
  const ready = useAdminInit();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* Mobile backdrop */}
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

export function AdminPage() {
  return <AdminContent />;
}
