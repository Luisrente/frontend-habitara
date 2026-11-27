import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { API_URL } from '../../../config.js';

const cop = (n) => `COP ${Math.round(Number(n || 0)).toLocaleString('es-CO')}`;

const RES_STATUS = [
  { key: 'confirmed', label: 'Confirmadas', color: '#059669' },
  { key: 'pending',   label: 'Pendientes',  color: '#d97706' },
  { key: 'cancelled', label: 'Canceladas',  color: '#dc2626' },
];
const ROLE_LABELS = { tenant: 'Inquilinos', landlord: 'Arrendadores', admin: 'Administradores' };
const ACC_LABELS  = { published: 'Publicados', rented: 'Arrendados', draft: 'Borradores', archived: 'Archivados' };
const REQ_LABELS  = { pending: 'Pendientes', approved: 'Aprobadas', rejected: 'Rechazadas' };

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');
}

function HBars({ items, emptyText = 'Sin datos aún' }) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (!items.some(i => i.value > 0)) return <p className="stats-empty">{emptyText}</p>;
  return (
    <ul className="stats-hbars">
      {items.map(i => (
        <li key={i.label} className="stats-hbar">
          <div className="stats-hbar__row">
            <span className="stats-hbar__label">{i.label}</span>
            <span className="stats-hbar__value">{i.value.toLocaleString('es-CO')}</span>
          </div>
          <div className="stats-hbar__track">
            <div
              className="stats-hbar__fill"
              style={{ width: `${(i.value / max) * 100}%`, background: i.color || 'var(--primary)' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MonthlyChart({ months }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...months.map(m => m.reservations));
  const total = months.reduce((s, m) => s + m.reservations, 0);

  return (
    <div className="stats-cols-wrap">
      <div className="stats-cols" role="img" aria-label={`Reservas por mes, últimos 6 meses: ${total} en total`}>
        <div className="stats-cols__grid">
          <span>{max}</span>
          <span>0</span>
        </div>
        {months.map((m, i) => (
          <div
            key={m.key}
            className="stats-col"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          >
            <div className="stats-col__area">
              {hover === i && (
                <div className="stats-tip">
                  <strong>{m.reservations} reserva{m.reservations !== 1 ? 's' : ''}</strong>
                  <span>{cop(m.revenue)} confirmados</span>
                </div>
              )}
              <div
                className={`stats-col__bar${hover === i ? ' is-hover' : ''}`}
                style={{ height: `${(m.reservations / max) * 100}%` }}
              />
            </div>
            <span className="stats-col__label">{monthLabel(m.key)}</span>
          </div>
        ))}
      </div>

      <details className="stats-table-toggle">
        <summary>Ver tabla</summary>
        <table className="stats-table">
          <thead><tr><th>Mes</th><th>Reservas</th><th>Ingresos confirmados</th></tr></thead>
          <tbody>
            {months.map(m => (
              <tr key={m.key}><td>{monthLabel(m.key)} {m.key.slice(0, 4)}</td><td>{m.reservations}</td><td>{cop(m.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function AdminStatsPage() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [stats, setStats]   = useState(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('habitara_user') || 'null');
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    setAdminUser(storedUser);

    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.success) setStats(d.data);
        else setError(d.message || 'No se pudieron cargar las estadísticas');
      })
      .catch(err => setError(`No se pudieron cargar las estadísticas (${err.message})`));
  }, [navigate]);

  const s = stats;
  const loading = !s && !error;

  return (
    <div className="app-shell">
      <AdminSidebar adminUser={adminUser} />

      <main className="sb__main">
        <div className="dash">
          <div className="dash__header">
            <div>
              <span className="eyebrow">Panel administrativo</span>
              <h1>Estadísticas</h1>
            </div>
          </div>

          {error && <div className="booking-msg booking-msg--error">{error}</div>}

          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat__label">Ingresos confirmados</span>
              <strong className="dash-stat__value">{loading ? '—' : cop(s?.reservations.revenue)}</strong>
              <span className="dash-stat__sub">reservas confirmadas</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Reservas</span>
              <strong className="dash-stat__value">{loading ? '—' : s?.reservations.total ?? 0}</strong>
              <span className="dash-stat__sub">{s?.reservations.byStatus.pending || 0} pendientes</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Alojamientos</span>
              <strong className="dash-stat__value">{loading ? '—' : s?.accommodations.total ?? 0}</strong>
              <span className="dash-stat__sub">precio medio {s ? cop(s.accommodations.avgPrice) : '—'}</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Usuarios</span>
              <strong className="dash-stat__value">{loading ? '—' : s?.users.total ?? 0}</strong>
              <span className="dash-stat__sub">+{s?.users.newLast30 || 0} en los últimos 30 días</span>
            </div>
          </div>

          {s && (
            <>
              <section className="dash-card">
                <div className="dash-card__head">
                  <h2>Reservas por mes</h2>
                  <span className="stats-card-meta">Últimos 6 meses</span>
                </div>
                <MonthlyChart months={s.reservations.monthly} />
              </section>

              <div className="dash-grid">
                <section className="dash-card">
                  <div className="dash-card__head"><h2>Estado de las reservas</h2></div>
                  <HBars items={RES_STATUS.map(st => ({
                    label: st.label, value: s.reservations.byStatus[st.key] || 0, color: st.color,
                  }))} />
                </section>

                <section className="dash-card">
                  <div className="dash-card__head"><h2>Usuarios por rol</h2></div>
                  <HBars items={Object.keys(ROLE_LABELS).map(k => ({
                    label: ROLE_LABELS[k], value: s.users.byRole[k] || 0,
                  }))} />
                </section>

                <section className="dash-card">
                  <div className="dash-card__head"><h2>Alojamientos por ciudad</h2></div>
                  <HBars items={s.accommodations.byCity.map(c => ({ label: c.city, value: c.count }))} />
                </section>

                <section className="dash-card">
                  <div className="dash-card__head"><h2>Alojamientos por estado</h2></div>
                  <HBars items={Object.keys(ACC_LABELS).map(k => ({
                    label: ACC_LABELS[k], value: s.accommodations.byStatus[k] || 0,
                  }))} />
                </section>

                <section className="dash-card">
                  <div className="dash-card__head"><h2>Más reservados</h2></div>
                  <HBars
                    items={s.reservations.topReserved.map(a => ({ label: a.title, value: a.count }))}
                    emptyText="Todavía no hay reservas"
                  />
                </section>

                <section className="dash-card">
                  <div className="dash-card__head">
                    <h2>Más guardados en favoritos</h2>
                    <span className="stats-card-meta">{s.favorites.total} en total</span>
                  </div>
                  <HBars
                    items={s.favorites.topFavorited.map(a => ({ label: a.title, value: a.count }))}
                    emptyText="Nadie ha guardado favoritos aún"
                  />
                </section>
              </div>

              <div className="dash-stats">
                {Object.keys(REQ_LABELS).map(k => (
                  <div key={k} className="dash-stat">
                    <span className="dash-stat__label">Solicitudes {REQ_LABELS[k].toLowerCase()}</span>
                    <strong className="dash-stat__value">{s.landlordRequests.byStatus[k] || 0}</strong>
                    <span className="dash-stat__sub">para ser arrendador</span>
                  </div>
                ))}
                <div className="dash-stat">
                  <span className="dash-stat__label">Mensajes</span>
                  <strong className="dash-stat__value">{s.messaging.messages}</strong>
                  <span className="dash-stat__sub">en {s.messaging.conversations} conversaciones</span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminStatsPage;
