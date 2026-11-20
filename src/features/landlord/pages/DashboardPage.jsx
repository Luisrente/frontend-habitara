import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { API_URL } from '../../../config.js';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="dash-stat">
      <span className="dash-stat__label">{label}</span>
      <strong className="dash-stat__value" style={color ? { color } : {}}>{value}</strong>
      {sub && <span className="dash-stat__sub">{sub}</span>}
    </div>
  );
}

function DashboardPage() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('habitara_user') || 'null'); }
    catch { return null; }
  })();

  const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/accommodations/me`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/reservations/landlord`, { headers }).then(r => r.json())
    ])
      .then(([listData, resData]) => {
        if (listData.success) setListings(listData.data || []);
        if (resData.success) setReservations(resData.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = reservations.filter(r => r.status === 'pending').length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;
  const revenue = reservations
    .filter(r => r.status === 'confirmed')
    .reduce((sum, r) => sum + Number(r.totalPrice || 0), 0);

  const recentListings = listings.slice(0, 3);
  const recentReservations = reservations.slice(0, 4);

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash__header">
        <div>
          <span className="eyebrow">Bienvenido</span>
          <h1>Hola, {user?.firstName || 'arrendador'} 👋</h1>
        </div>
        <Link to="/dashboard/listings/new" className="dash__cta">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Publicar alojamiento
        </Link>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        <StatCard label="Alojamientos" value={loading ? '—' : listings.length} sub="publicados" />
        <StatCard label="Reservas totales" value={loading ? '—' : reservations.length} />
        <StatCard label="Pendientes" value={loading ? '—' : pending} color={pending > 0 ? '#b45309' : undefined} sub="por confirmar" />
        <StatCard label="Confirmadas" value={loading ? '—' : confirmed} color="#047857" />
        <StatCard
          label="Ingresos confirmados"
          value={loading ? '—' : `COP $${revenue.toLocaleString('es-CO')}`}
          sub="reservas activas"
        />
      </div>

      <div className="dash-grid">
        {/* Alojamientos recientes */}
        <section className="dash-card">
          <div className="dash-card__head">
            <h2>Mis alojamientos</h2>
            <Link to="/dashboard/listings" className="dash-card__more">Ver todos</Link>
          </div>

          {loading ? (
            <p className="dash-empty">Cargando...</p>
          ) : recentListings.length === 0 ? (
            <div className="dash-empty-state">
              <p>Aún no tienes alojamientos publicados.</p>
              <Link to="/dashboard/listings/new" className="dash-link">Publicar mi primer alojamiento →</Link>
            </div>
          ) : (
            <div className="dash-list">
              {recentListings.map(item => (
                <div key={item.id} className="dash-row">
                  <div className="dash-row__info">
                    <span className="dash-row__title">{item.title}</span>
                    <span className="dash-row__sub">{item.roomType} · {item.location?.district || item.location?.city || ''}</span>
                  </div>
                  <div className="dash-row__right">
                    <strong>COP ${Number(item.price).toLocaleString('es-CO')}</strong>
                    <span className={`dash-badge dash-badge--${item.status || 'active'}`}>
                      {item.status === 'inactive' ? 'Inactivo' : 'Activo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Reservas recientes */}
        <section className="dash-card">
          <div className="dash-card__head">
            <h2>Reservas recientes</h2>
            <Link to="/dashboard/reservations" className="dash-card__more">Ver todas</Link>
          </div>

          {loading ? (
            <p className="dash-empty">Cargando...</p>
          ) : recentReservations.length === 0 ? (
            <div className="dash-empty-state">
              <p>Aún no tienes reservas registradas.</p>
            </div>
          ) : (
            <div className="dash-list">
              {recentReservations.map(r => {
                const statusStyles = {
                  pending: { label: 'Pendiente', color: '#b45309', bg: '#fef3c7' },
                  confirmed: { label: 'Confirmada', color: '#047857', bg: '#d1fae5' },
                  cancelled: { label: 'Cancelada', color: '#b91c1c', bg: '#fee2e2' }
                };
                const st = statusStyles[r.status] || { label: r.status, color: '#64748b', bg: '#f1f5f9' };
                const tenant = r.tenant || {};
                return (
                  <div key={r.id} className="dash-row">
                    <div className="dash-row__info">
                      <span className="dash-row__title">{tenant.firstName || 'Inquilino'} {tenant.lastName || ''}</span>
                      <span className="dash-row__sub">{r.accommodation?.title || 'Alojamiento'}</span>
                    </div>
                    <div className="dash-row__right">
                      <span
                        className="dash-pill"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
