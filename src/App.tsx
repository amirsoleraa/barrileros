import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { StorefrontPage } from '@/pages/StorefrontPage';
import { ResumenPage }    from '@/pages/ResumenPage';
import { FacturaPage }    from '@/pages/FacturaPage';
import { AdminPage }      from '@/pages/admin/AdminPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { CartPanel }      from '@/components/client/CartPanel';
import { Toast }          from '@/components/ui/Toast';
import { LoadingScreen }  from '@/components/ui/LoadingScreen';

// Admin panels
import { OrdersPanel }      from '@/components/admin/panels/OrdersPanel';
import { ProductsPanel }    from '@/components/admin/panels/ProductsPanel';
import { CategoriesPanel }  from '@/components/admin/panels/CategoriesPanel';
import { DashboardPanel }   from '@/components/admin/panels/DashboardPanel';
import { TrackingPanel }    from '@/components/admin/panels/TrackingPanel';
import { NewsPanel }        from '@/components/admin/panels/NewsPanel';
import { DeliveryPanel }    from '@/components/admin/panels/DeliveryPanel';
import { CouponsPanel }     from '@/components/admin/panels/CouponsPanel';
import { ColorsPanel }      from '@/components/admin/panels/ColorsPanel';
import { ConfigPanel }      from '@/components/admin/panels/ConfigPanel';
import { PublicidadPanel }  from '@/components/admin/panels/PublicidadPanel';

// Layout del cliente — incluye CartPanel, Toast y LoadingScreen globales
function ClientLayout() {
  return (
    <>
      <Outlet />
      <CartPanel />
      <Toast />
      <LoadingScreen />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Storefront del cliente */}
        <Route element={<ClientLayout />}>
          <Route path="/"        element={<StorefrontPage />} />
          <Route path="/resumen" element={<ResumenPage />} />
          <Route path="/factura" element={<FacturaPage />} />
        </Route>

        {/* Admin login (sin layout cliente) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin panel (protegido, con layout admin) */}
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="pedidos" replace />} />
          <Route path="pedidos"     element={<OrdersPanel />} />
          <Route path="productos"   element={<ProductsPanel />} />
          <Route path="categorias"  element={<CategoriesPanel />} />
          <Route path="dashboard"   element={<DashboardPanel />} />
          <Route path="seguimiento" element={<TrackingPanel />} />
          <Route path="novedades"   element={<NewsPanel />} />
          <Route path="domicilio"   element={<DeliveryPanel />} />
          <Route path="descuentos"  element={<CouponsPanel />} />
          <Route path="colores"     element={<ColorsPanel />} />
          <Route path="config"       element={<ConfigPanel />} />
          <Route path="publicidades" element={<PublicidadPanel />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
