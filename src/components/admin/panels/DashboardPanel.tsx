import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Package, DollarSign, TrendingUp, Bike } from 'lucide-react';
import { useAdminStore } from '@/stores/useAdminStore';
import { fmtPrice } from '@/lib/utils';

export function DashboardPanel() {
  const { pedidos } = useAdminStore();

  const allPedidos = Object.values(pedidos);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayOrders = allPedidos.filter(p => {
      if (!p.createdAt) return false;
      return new Date(p.createdAt.seconds * 1000) >= todayStart;
    });

    const todayRevenue = todayOrders.reduce((s, p) => s + p.total, 0);
    const totalOrders = allPedidos.length;
    const inTransit = allPedidos.filter(p => p.estado === 'camino').length;

    return { todayOrders: todayOrders.length, todayRevenue, totalOrders, inTransit };
  }, [allPedidos]);

  // 7-day chart
  const chartData = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const count = allPedidos.filter(p => {
        if (!p.createdAt) return false;
        const ts = new Date(p.createdAt.seconds * 1000);
        return ts >= d && ts < next;
      }).length;

      days.push({
        day: d.toLocaleDateString('es-CO', { weekday: 'short' }),
        count,
      });
    }
    return days;
  }, [allPedidos]);

  // Top products
  const topProducts = useMemo(() => {
    const counts: Record<string, { nombre: string; qty: number }> = {};
    allPedidos.forEach(p => {
      p.items?.forEach(item => {
        if (!counts[item.id]) counts[item.id] = { nombre: item.nombre, qty: 0 };
        counts[item.id].qty += item.qty;
      });
    });
    return Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [allPedidos]);

  return (
    <div>
      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <Package size={24} color="var(--brand)" />
          <div className="stat-value">{stats.todayOrders}</div>
          <div className="stat-label">Pedidos hoy</div>
        </div>
        <div className="stat-card">
          <DollarSign size={24} color="var(--success)" />
          <div className="stat-value">{fmtPrice(stats.todayRevenue)}</div>
          <div className="stat-label">Ingresos hoy</div>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} color="var(--brand)" />
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total pedidos</div>
        </div>
        <div className="stat-card">
          <Bike size={24} color="var(--accent)" />
          <div className="stat-value">{stats.inTransit}</div>
          <div className="stat-label">En camino</div>
        </div>
      </div>

      {/* Chart */}
      <div className="admin-card">
        <div className="admin-card-hdr">
          <h3>Pedidos últimos 7 días</h3>
        </div>
        <div style={{ padding: '20px 20px 10px' }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 13 }}
                cursor={{ fill: 'var(--brand-light)' }}
              />
              <Bar dataKey="count" name="Pedidos" fill="var(--brand)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top productos */}
      {topProducts.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-hdr"><h3>Productos más vendidos</h3></div>
          <div style={{ padding: '0 0 8px' }}>
            {topProducts.map((p, i) => (
              <div key={p.nombre} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 8, background: 'var(--brand)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{p.nombre}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600 }}>
                  {p.qty} unidades
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
