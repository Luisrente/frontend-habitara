import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';

import { API_URL } from '../../../config.js';

const statusMap = {
  pending:   { label: 'Pendiente',  color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Confirmada', color: '#047857', bg: '#d1fae5' },
  cancelled: { label: 'Cancelada',  color: '#b91c1c', bg: '#fee2e2' },
};

function fmt(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AdminReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [adminUser,    setAdminUser]    = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('habitara_user') || 'null');
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    setAdminUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/reservations/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setReservations(data.success && Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    all:       reservations.length,
    pending:   reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  }), [reservations]);

  const visible = useMemo(() =>
    activeFilter === 'all' ? reservations : reservations.filter(r => r.status === activeFilter),
  [activeFilter, reservations]);

  return (
    <div className="app-shell">
      <AdminSidebar adminUser={adminUser} />

      {/* ── Main content ── */}
      <main className="sb__main">
        <div className="dash">

          {/* Header */}
          <div className="dash__header">
            <div>
              <span className="eyebrow">Panel administrativo</span>
              <h1>Reservas</h1>
            </div>
            <Link to="/account" className="dash__cta">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              {adminUser?.firstName || 'Administrador'}
            </Link>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat__label">Todas</span>
              <strong className="dash-stat__value">{loading ? '—' : counts.all}</strong>
              <span className="dash-stat__sub">reservas</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Pendientes</span>
              <strong className="dash-stat__value" style={counts.pending > 0 ? { color: '#b45309' } : {}}>
                {loading ? '—' : counts.pending}
              </strong>
              <span className="dash-stat__sub">por confirmar</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Confirmadas</span>
              <strong className="dash-stat__value" style={{ color: '#047857' }}>
                {loading ? '—' : counts.confirmed}
              </strong>
              <span className="dash-stat__sub">activas</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Canceladas</span>
              <strong className="dash-stat__value" style={counts.cancelled > 0 ? { color: '#b91c1c' } : {}}>
                {loading ? '—' : counts.cancelled}
              </strong>
            </div>
          </div>

          {/* Reservations card */}
          <section className="dash-card">
            <div className="dash-card__head">
              <h2>Todas las reservas</h2>
            </div>

            {/* Filters */}
            <div className="admin-request-filters">
              {[
                { key: 'all',       label: `Todas (${counts.all})` },
                { key: 'pending',   label: `Pendientes (${counts.pending})` },
                { key: 'confirmed', label: `Confirmadas (${counts.confirmed})` },
                { key: 'cancelled', label: `Canceladas (${counts.cancelled})` },
              ].map(f => (
                <button
                  key={f.key}
                  type="button"
                  className={activeFilter === f.key ? 'primary-btn' : 'secondary-btn'}
                  onClick={() => setActiveFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="dash-empty">Cargando reservas...</p>
            ) : visible.length === 0 ? (
              <div className="dash-empty-state">
                <p>No hay reservas en este filtro.</p>
              </div>
            ) : (
              <div className="dash-list admin-dash-list">
                {visible.map((res) => {
                  const st = statusMap[res.status] || { label: res.status, color: '#64748b', bg: '#f1f5f9' };
                  const tenant = res.tenant || {};
                  const landlord = res.landlord || {};
                  const acc = res.accommodation || {};
                  return (
                    <article key={res.id} className="req-card">
                      {/* ── Header ── */}
                      <div className="req-card__head">
                        <div className="req-card__avatar">
                          {(tenant.firstName || 'I').charAt(0).toUpperCase()}{(tenant.lastName || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="req-card__identity">
                          <h3 className="req-card__name">{tenant.firstName || 'Inquilino'} {tenant.lastName || ''}</h3>
                          <span className="req-card__email">{tenant.email || ''}</span>
                        </div>
                        <span className="dash-pill" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </div>

                      {/* ── Info grid ── */}
                      <div className="req-card__grid">
                        <div className="req-card__field req-card__field--wide">
                          <span>Alojamiento</span>
                          <strong>{acc.title || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Tipo</span>
                          <strong>{acc.roomType || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Precio/noche</span>
                          <strong>{acc.currency || 'COP'} {Number(acc.price || 0).toLocaleString('es-CO')}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Entrada</span>
                          <strong>{fmt(res.startDate)}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Salida</span>
                          <strong>{fmt(res.endDate)}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Total pagado</span>
                          <strong>{acc.currency || 'COP'} {Number(res.totalPrice || 0).toLocaleString('es-CO')}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Creada</span>
                          <strong>{fmt(res.createdAt)}</strong>
                        </div>
                        <div className="req-card__field req-card__field--wide">
                          <span>Arrendador</span>
                          <strong>{landlord.firstName || '-'} {landlord.lastName || ''} · {landlord.email || ''}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminReservationsPage;
