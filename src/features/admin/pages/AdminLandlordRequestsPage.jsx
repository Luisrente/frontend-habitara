import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import UserIcon from '../../../shared/components/UserIcon';

const API_URL = 'http://localhost:4000/api';

const statusMap = {
  pending: { label: 'Pendiente', className: 'status pending' },
  approved: { label: 'Aprobada', className: 'status confirmed' },
  rejected: { label: 'Rechazada', className: 'status cancelled' }
};

function AdminLandlordRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [adminUser, setAdminUser] = useState(null);

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
      const response = await fetch(`${API_URL}/landlord-requests/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const visibleRequests = useMemo(() => {
    if (activeFilter === 'all') return requests;
    return requests.filter((request) => request.status === activeFilter);
  }, [activeFilter, requests]);

  const counts = useMemo(() => ({
    all: requests.length,
    pending: requests.filter((request) => request.status === 'pending').length,
    approved: requests.filter((request) => request.status === 'approved').length,
    rejected: requests.filter((request) => request.status === 'rejected').length
  }), [requests]);

  const handleDecision = async (requestId, status) => {
    const token = localStorage.getItem('habitara_token');
    setUpdatingId(requestId);

    try {
      const response = await fetch(`${API_URL}/landlord-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNote: `Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} por administrador.` })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo actualizar la solicitud');
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? { ...request, status } : request
        )
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div className="page-card">Cargando solicitudes...</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/admin/landlord-requests" className="brand">HABITARA</NavLink>

        <nav className="nav-menu">
          <NavLink to="/admin/landlord-requests">Solicitudes</NavLink>
          <NavLink to="/">Ir al inicio</NavLink>
        </nav>

        <button type="button" className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
      </aside>

      <main className="main-content admin-main-content">
        <header className="admin-main-header">
          <div>
            <span className="eyebrow">Panel administrativo</span>
            <h1>Solicitudes de arrendador</h1>
          </div>

          {adminUser && (
            <Link to="/account" className="user-pill" title="Mi cuenta">
              <span className="user-avatar">
                <UserIcon className="user-avatar__icon" />
              </span>
              <span>{adminUser.firstName || 'Administrador'}</span>
            </Link>
          )}
        </header>

        <div className="admin-summary-grid">
          <div className="admin-summary-card"><span>Todas</span><strong>{counts.all}</strong></div>
          <div className="admin-summary-card pending"><span>Pendientes</span><strong>{counts.pending}</strong></div>
          <div className="admin-summary-card approved"><span>Aprobadas</span><strong>{counts.approved}</strong></div>
          <div className="admin-summary-card rejected"><span>Rechazadas</span><strong>{counts.rejected}</strong></div>
        </div>

        <div className="page-card admin-request-card">
          <div className="page-header admin-request-header">
            <div>
              <span className="reservation-label">Usuarios solicitantes</span>
              <h2>Solicitudes para convertirse en arrendador</h2>
            </div>
          </div>

          <div className="admin-request-filters">
            {[
              { key: 'all', label: `Todas (${counts.all})` },
              { key: 'pending', label: `Pendientes (${counts.pending})` },
              { key: 'approved', label: `Aprobadas (${counts.approved})` },
              { key: 'rejected', label: `Rechazadas (${counts.rejected})` }
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={activeFilter === filter.key ? 'primary-btn' : 'secondary-btn'}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {visibleRequests.length === 0 ? (
            <p>No hay solicitudes para convertirse en arrendador en este filtro.</p>
          ) : (
            <div className="reservations-list">
              {visibleRequests.map((request) => {
                const status = statusMap[request.status] || { label: request.status, className: 'status default' };
                const user = request.user || {};

                return (
                  <article key={request.id} className="reservation-card">
                    <div className="reservation-card__main">
                      <div>
                        <span className="reservation-label">Solicitante</span>
                        <h3>{user.firstName || 'Usuario'} {user.lastName || ''}</h3>
                      </div>
                      <span className={status.className}>{status.label}</span>
                    </div>

                    <div className="reservation-meta">
                      <div>
                        <span>Ciudad de residencia</span>
                        <strong>{request.city || '-'}</strong>
                      </div>
                      <div>
                        <span>Nivel de estudio</span>
                        <strong>{request.educationLevel || '-'}</strong>
                      </div>
                      <div>
                        <span>Correo</span>
                        <strong>{user.email || '-'}</strong>
                      </div>
                      <div>
                        <span>Teléfono</span>
                        <strong>{user.phone || '-'}</strong>
                      </div>
                    </div>

                    <div className="request-extra">
                      <p><strong>Dirección de residencia:</strong> {request.address || '-'}</p>
                      <p><strong>Experiencia o información adicional:</strong> {request.description || '-'}</p>
                      <p><strong>Número de cédula:</strong> {request.nationalId || '-'}</p>
                      <p><strong>Antecedentes penales:</strong> {request.criminalRecordStatus || '-'}</p>
                      <p><strong>Términos y condiciones:</strong> {request.termsAccepted ? 'Aceptados' : 'No aceptados'}</p>
                      {request.documentsSummary && <p><strong>Documentos adicionales:</strong> {request.documentsSummary}</p>}
                      {request.idDocumentPhoto && (
                        <div>
                          <strong>Foto de la cédula:</strong>
                          <img className="request-document-preview" src={request.idDocumentPhoto} alt="Cédula del solicitante" />
                        </div>
                      )}
                      {request.criminalRecordDocument && (
                        <div>
                          <strong>Certificado de antecedentes:</strong>
                          {request.criminalRecordDocument.startsWith('data:application/pdf') ? (
                            <a href={request.criminalRecordDocument} target="_blank" rel="noreferrer">Ver certificado PDF</a>
                          ) : (
                            <img className="request-document-preview" src={request.criminalRecordDocument} alt="Certificado de antecedentes" />
                          )}
                        </div>
                      )}
                    </div>

                    {request.status === 'pending' && (
                      <div className="reservation-actions reservation-actions--stacked">
                        <button
                          type="button"
                          className="primary-btn"
                          onClick={() => handleDecision(request.id, 'approved')}
                          disabled={updatingId === request.id}
                        >
                          {updatingId === request.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleDecision(request.id, 'rejected')}
                          disabled={updatingId === request.id}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-16">
            <Link to="/" className="link-button muted">Volver al inicio</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLandlordRequestsPage;
