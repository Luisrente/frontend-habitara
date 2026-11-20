import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

import { API_URL } from '../../../config.js';

const STATUS = {
  pending:   { label: 'Pendiente',  color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  confirmed: { label: 'Confirmada', color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  cancelled: { label: 'Cancelada',  color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' }
};

function fmt(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function MyReservationsPage() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const token      = localStorage.getItem('habitara_token');
    const storedUser = localStorage.getItem('habitara_user');
    if (!token) { navigate('/login', { replace: true }); return; }
    if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch {} }

    fetch(`${API_URL}/reservations/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data)) setReservations(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>
          <div className="catalog-actions">
            {user && <UserMenu user={user} />}
          </div>
        </div>
      </header>

      <main className="container catalog-main">
        <section className="favorites-header">
          <div>
            <span className="eyebrow">Mis reservas</span>
            <h1>Historial de estancias</h1>
          </div>
          <Link to="/" className="link-button muted">Volver al catálogo</Link>
        </section>

        {loading ? (
          <div className="res-skeleton-list">
            {[1,2,3].map(i => <div key={i} className="res-skeleton" />)}
          </div>
        ) : reservations.length === 0 ? (
          <div className="empty-state-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h3>Sin reservas aún</h3>
            <p>Cuando solicites una estancia aparecerá aquí.</p>
            <Link to="/" className="link-button primary">Explorar alojamientos</Link>
          </div>
        ) : (
          <div className="res-list">
            {reservations.map((r) => {
              const st      = STATUS[r.status] || { label: r.status, color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
              const acc = r.accommodation || {};

              return (
                <article key={r.id} className="res-card">
                  {/* Franja izquierda de color según estado */}
                  <div className="res-card__stripe" style={{ background: st.dot }} />

                  <div className="res-card__body">
                    {/* Fila superior */}
                    <div className="res-card__top">
                      <div className="res-card__title-wrap">
                        <h3 className="res-card__title">{acc.title || 'Alojamiento'}</h3>
                        {acc.location?.city && (
                          <span className="res-card__loc">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {acc.location.district ? `${acc.location.district}, ` : ''}{acc.location.city}
                          </span>
                        )}
                      </div>
                      <span className="res-card__status" style={{ color: st.color, background: st.bg }}>
                        <span className="res-card__dot" style={{ background: st.dot }} />
                        {st.label}
                      </span>
                    </div>

                    {/* Fechas + precio */}
                    <div className="res-card__dates">
                      <div className="res-card__date-item">
                        <span>Entrada</span>
                        <strong>{fmt(r.startDate)}</strong>
                      </div>
                      <div className="res-card__date-arrow">→</div>
                      <div className="res-card__date-item">
                        <span>Salida</span>
                        <strong>{fmt(r.endDate)}</strong>
                      </div>
                      <div className="res-card__date-sep" />
                      <div className="res-card__date-item res-card__date-item--price">
                        <span>Total</span>
                        <strong>COP ${Number(r.totalPrice || 0).toLocaleString('es-CO')}</strong>
                      </div>
                    </div>

                    {/* Acción */}
                    {r.status === 'pending' && acc.id && (
                      <div className="res-card__footer">
                        <Link to={`/accommodation/${acc.id}`} className="res-card__link">
                          Ver alojamiento →
                        </Link>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyReservationsPage;
