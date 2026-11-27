import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar.jsx';

import { API_URL } from '../../../config.js';

const statusMap = {
  pending:  { label: 'Pendiente',  color: '#b45309', bg: '#fef3c7' },
  approved: { label: 'Aprobada',   color: '#047857', bg: '#d1fae5' },
  rejected: { label: 'Rechazada',  color: '#b91c1c', bg: '#fee2e2' },
};

function AdminLandlordRequestsPage() {
  const navigate = useNavigate();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [adminUser,  setAdminUser]  = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('habitara_user') || 'null');
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    setAdminUser(storedUser);
  }, [navigate]);

  const fetchRequests = async () => {
    const token = localStorage.getItem('habitara_token');
    try {
      const res  = await fetch(`${API_URL}/landlord-requests/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(res.ok && data.success && Array.isArray(data.data) ? data.data : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const counts = useMemo(() => ({
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }), [requests]);

  const visible = useMemo(() =>
    activeFilter === 'all' ? requests : requests.filter(r => r.status === activeFilter),
  [activeFilter, requests]);

  const handleDecision = async (id, status) => {
    const token = localStorage.getItem('habitara_token');
    setUpdatingId(id);
    try {
      const res  = await fetch(`${API_URL}/landlord-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status,
          adminNote: `Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} por administrador.`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Error');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

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
              <h1>Solicitudes de arrendador</h1>
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
              <span className="dash-stat__sub">solicitudes</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Pendientes</span>
              <strong className="dash-stat__value" style={counts.pending > 0 ? { color: '#b45309' } : {}}>
                {loading ? '—' : counts.pending}
              </strong>
              <span className="dash-stat__sub">por revisar</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Aprobadas</span>
              <strong className="dash-stat__value" style={{ color: '#047857' }}>
                {loading ? '—' : counts.approved}
              </strong>
              <span className="dash-stat__sub">arrendadores activos</span>
            </div>
            <div className="dash-stat">
              <span className="dash-stat__label">Rechazadas</span>
              <strong className="dash-stat__value" style={counts.rejected > 0 ? { color: '#b91c1c' } : {}}>
                {loading ? '—' : counts.rejected}
              </strong>
            </div>
          </div>

          {/* Requests card */}
          <section className="dash-card">
            <div className="dash-card__head">
              <h2>Solicitudes para convertirse en arrendador</h2>
            </div>

            {/* Filters */}
            <div className="admin-request-filters">
              {[
                { key: 'all',      label: `Todas (${counts.all})` },
                { key: 'pending',  label: `Pendientes (${counts.pending})` },
                { key: 'approved', label: `Aprobadas (${counts.approved})` },
                { key: 'rejected', label: `Rechazadas (${counts.rejected})` },
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
              <p className="dash-empty">Cargando solicitudes...</p>
            ) : visible.length === 0 ? (
              <div className="dash-empty-state">
                <p>No hay solicitudes en este filtro.</p>
              </div>
            ) : (
              <div className="dash-list admin-dash-list">
                {visible.map((req) => {
                  const st  = statusMap[req.status] || { label: req.status, color: '#64748b', bg: '#f1f5f9' };
                  const usr = req.user || {};
                  return (
                    <article key={req.id} className="req-card">
                      {/* ── Header ── */}
                      <div className="req-card__head">
                        <div className="req-card__avatar">
                          {(usr.firstName || 'U').charAt(0).toUpperCase()}{(usr.lastName || '').charAt(0).toUpperCase()}
                        </div>
                        <div className="req-card__identity">
                          <h3 className="req-card__name">{usr.firstName || 'Usuario'} {usr.lastName || ''}</h3>
                          <span className="req-card__email">{usr.email || ''}</span>
                        </div>
                        <span className="dash-pill" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </div>

                      {/* ── Info grid ── */}
                      <div className="req-card__grid">
                        <div className="req-card__field">
                          <span>Ciudad</span>
                          <strong>{req.city || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Teléfono</span>
                          <strong>{usr.phone || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Educación</span>
                          <strong>{req.educationLevel || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Cédula</span>
                          <strong>{req.nationalId || '-'}</strong>
                        </div>
                        <div className="req-card__field req-card__field--wide">
                          <span>Dirección</span>
                          <strong>{req.address || '-'}</strong>
                        </div>
                        <div className="req-card__field req-card__field--wide">
                          <span>Experiencia adicional</span>
                          <strong>{req.description || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Antecedentes</span>
                          <strong>{req.criminalRecordStatus || '-'}</strong>
                        </div>
                        <div className="req-card__field">
                          <span>Términos</span>
                          <strong style={{ color: req.termsAccepted ? '#047857' : '#b91c1c' }}>
                            {req.termsAccepted ? '✓ Aceptados' : '✗ No aceptados'}
                          </strong>
                        </div>
                      </div>

                      {/* ── Footer: docs + actions ── */}
                      <div className="req-card__footer">
                        <div className="doc-attachments">
                          {req.idDocumentPhoto && (
                            <a href={req.idDocumentPhoto} target="_blank" rel="noreferrer" download="cedula" className="doc-chip">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              Foto cédula
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          )}
                          {req.criminalRecordDocument && (
                            <a href={req.criminalRecordDocument} target="_blank" rel="noreferrer" download="antecedentes" className="doc-chip">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              Certificado
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </a>
                          )}
                        </div>

                        {req.status === 'pending' && (
                          <div className="req-card__actions">
                            <button type="button" className="primary-btn" onClick={() => handleDecision(req.id, 'approved')} disabled={updatingId === req.id}>
                              {updatingId === req.id ? 'Procesando...' : 'Aprobar'}
                            </button>
                            <button type="button" className="secondary-btn" onClick={() => handleDecision(req.id, 'rejected')} disabled={updatingId === req.id}>
                              Rechazar
                            </button>
                          </div>
                        )}
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

export default AdminLandlordRequestsPage;
