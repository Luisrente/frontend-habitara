import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:4000/api';

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

function ReservationsPage() {
  const [reservations, setReservations]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [updatingId, setUpdatingId]       = useState(null);
  const [draftStatuses, setDraftStatuses] = useState({});

  const fetchReservations = () => {
    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/reservations/landlord`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          setReservations(d.data);
          setDraftStatuses(d.data.reduce((acc, r) => ({ ...acc, [r.id]: r.status }), {}));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleStatusChange = async (reservationId, nextStatus) => {
    const token = localStorage.getItem('habitara_token');
    setUpdatingId(reservationId);
    try {
      const res = await fetch(`${API_URL}/reservations/${reservationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error al actualizar');
      setReservations(cur => cur.map(r => r.id === reservationId ? { ...r, status: nextStatus } : r));
      setDraftStatuses(cur => ({ ...cur, [reservationId]: nextStatus }));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-card">
        <div className="page-header"><h2>Reservas recibidas</h2></div>
        <div className="res-skeleton-list">
          {[1,2,3].map(i => <div key={i} className="res-skeleton" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2>Reservas recibidas</h2>
          {!loading && <p className="page-sub">{reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}</p>}
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="listings-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p>No tienes reservas registradas todavía.</p>
        </div>
      ) : (
        <div className="lres-list">
          {reservations.map((r) => {
            const st            = STATUS[r.status] || { label: r.status, color: '#64748b', bg: '#f1f5f9', dot: '#94a3b8' };
            const tenant        = r.tenant || {};
            const acc           = r.accommodation || {};
            const isUpdating    = updatingId === r.id;
            const selected      = draftStatuses[r.id] ?? r.status;
            const hasChanges    = selected !== r.status;
            const isLocked      = r.status !== 'pending';

            return (
              <article key={r.id} className="lres-card">
                <div className="lres-card__stripe" style={{ background: st.dot }} />

                <div className="lres-card__body">
                  {/* Top row */}
                  <div className="lres-card__top">
                    <div>
                      <p className="lres-card__label">Inquilino</p>
                      <h3 className="lres-card__name">{tenant.firstName || 'Usuario'} {tenant.lastName || ''}</h3>
                      {tenant.email && <p className="lres-card__email">{tenant.email}</p>}
                    </div>
                    <span className="lres-card__status" style={{ color: st.color, background: st.bg }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot, display: 'inline-block', flexShrink: 0 }} />
                      {st.label}
                    </span>
                  </div>

                  {/* Info row */}
                  <div className="lres-card__info">
                    <div className="lres-card__info-item">
                      <span>Alojamiento</span>
                      <strong>{acc.title || '—'}</strong>
                    </div>
                    <div className="lres-card__info-item">
                      <span>Entrada</span>
                      <strong>{fmt(r.startDate)}</strong>
                    </div>
                    <div className="lres-card__info-item">
                      <span>Salida</span>
                      <strong>{fmt(r.endDate)}</strong>
                    </div>
                    <div className="lres-card__info-item">
                      <span>Total</span>
                      <strong className="lres-card__price">COP ${Number(r.totalPrice || 0).toLocaleString('es-CO')}</strong>
                    </div>
                  </div>

                  {/* Status control */}
                  {!isLocked ? (
                    <div className="lres-card__actions">
                      <div className="lres-status-group">
                        <button
                          type="button"
                          className={`lres-status-btn${selected === 'confirmed' ? ' lres-status-btn--active lres-status-btn--confirm' : ''}`}
                          onClick={() => setDraftStatuses(c => ({ ...c, [r.id]: 'confirmed' }))}
                          disabled={isUpdating}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Confirmar
                        </button>
                        <button
                          type="button"
                          className={`lres-status-btn${selected === 'cancelled' ? ' lres-status-btn--active lres-status-btn--cancel' : ''}`}
                          onClick={() => setDraftStatuses(c => ({ ...c, [r.id]: 'cancelled' }))}
                          disabled={isUpdating}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Cancelar
                        </button>
                      </div>
                      {hasChanges && (
                        <button
                          type="button"
                          className="lres-save-btn"
                          onClick={() => handleStatusChange(r.id, selected)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Guardando…' : 'Guardar cambio'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="lres-card__locked">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      Estado bloqueado
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReservationsPage;
