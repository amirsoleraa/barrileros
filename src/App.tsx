import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { StorefrontPage } from '@/pages/StorefrontPage';
import { ResumenPage }    from '@/pages/ResumenPage';
import { FacturaPage }    from '@/pages/FacturaPage';
import { PrivacidadPage } from '@/pages/PrivacidadPage';
import { ClienteLoginPage } from '@/pages/ClienteLoginPage';
import { CuentaPage }       from '@/pages/CuentaPage';
import { AdminPage }      from '@/pages/admin/AdminPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { DomiciliarioLoginPage }  from '@/pages/domiciliario/DomiciliarioLoginPage';
import { DomiciliarioPortalPage } from '@/pages/domiciliario/DomiciliarioPortalPage';
import { CartPanel }      from '@/components/client/CartPanel';
import { Toast }          from '@/components/ui/Toast';
import { LoadingScreen }  from '@/components/ui/LoadingScreen';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { useFirebaseInit } from '@/hooks/useFirebaseInit';
import { useTheme }        from '@/hooks/useTheme';
import { useClienteInit }  from '@/hooks/useClienteInit';

// Admin panels
import { OrdersPanel }    from '@/components/admin/panels/OrdersPanel';
import { CatalogoPanel }  from '@/components/admin/panels/CatalogoPanel';
import { DashboardPanel } from '@/components/admin/panels/DashboardPanel';
import { LogisticaPanel } from '@/components/admin/panels/LogisticaPanel';
import { NewsPanel }      from '@/components/admin/panels/NewsPanel';
import { MarketingPanel } from '@/components/admin/panels/MarketingPanel';
import { HistorialPanel } from '@/components/admin/panels/HistorialPanel';
import { ConfigPanel }    from '@/components/admin/panels/ConfigPanel';

// Layout del cliente — incluye CartPanel, Toast y LoadingScreen globales
function ClientLayout() {
  useFirebaseInit();
  useTheme();
  useClienteInit();
  return (
    <div className="brr-app">
      <Outlet />
      <CartPanel />
      <Toast />
      <LoadingScreen />
    </div>
  );
}

export default function App() {
  return (
    <ConfirmProvider>
    <BrowserRouter>
      <Routes>
        {/* Storefront del cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/"        element={<StorefrontPage />} />
          <Route path="/resumen" element={<ResumenPage />} />
          <Route path="/factura" element={<FacturaPage />} />
          <Route path="/privacidad" element={<PrivacidadPage />} />
          <Route path="/login"  element={<ClienteLoginPage />} />
          <Route path="/cuenta" element={<CuentaPage />} />
        </Route>

        {/* Admin login (sin layout cliente) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin panel (protegido, con layout admin) */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos"   element={<OrdersPanel />} />
          <Route path="catalogo"  element={<CatalogoPanel />} />
          <Route path="dashboard" element={<DashboardPanel />} />
          <Route path="logistica" element={<LogisticaPanel />} />
          <Route path="novedades" element={<NewsPanel />} />
          <Route path="marketing" element={<MarketingPanel />} />
          <Route path="historial" element={<HistorialPanel />} />
          <Route path="config"    element={<ConfigPanel />} />
        </Route>

        {/* Portal domiciliarios */}
        <Route path="/domiciliario/login" element={<DomiciliarioLoginPage />} />
        <Route path="/domiciliario"       element={<DomiciliarioPortalPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ConfirmProvider>
  );
}
