import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

const ROOM_TYPE_LABELS = {
  individual: 'Habitación individual',
  shared: 'Habitación compartida',
  apartment: 'Apartamento',
  studio: 'Estudio',
  house: 'Casa'
};

const STATUS_LABELS = {
  published: { label: 'Publicado', color: '#047857', bg: '#d1fae5' },
  inactive: { label: 'Inactivo', color: '#92400e', bg: '#fef3c7' },
  draft: { label: 'Borrador', color: '#1e40af', bg: '#dbeafe' }
};

function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');

    fetch(`${API_URL}/accommodations/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setListings(data.data || []);
        } else {
          setError(data.message || 'No se pudieron cargar los alojamientos');
        }
      })
      .catch(() => setError('Error de conexión con el servidor'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-card">
      <div className="page-header">
        <div>
          <h2>Mis alojamientos</h2>
          {!loading && <p className="page-sub">{listings.length} {listings.length === 1 ? 'alojamiento' : 'alojamientos'}</p>}
        </div>
        <Link to="/dashboard/listings/new" className="primary-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Publicar
        </Link>
      </div>

      {loading ? (
        <div className="listings-loading">
          {[1, 2, 3].map(i => <div key={i} className="listing-skeleton" />)}
        </div>
      ) : error ? (
        <div className="listings-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="primary-btn" style={{ marginTop: 12 }}>Reintentar</button>
        </div>
      ) : listings.length === 0 ? (
        <div className="listings-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p>Aún no tienes alojamientos publicados.</p>
          <Link to="/dashboard/listings/new" className="primary-btn">Publicar mi primer alojamiento</Link>
        </div>
      ) : (
        <div className="listing-list">
          {listings.map((item) => {
            const st = STATUS_LABELS[item.status] || { label: item.status, color: '#64748b', bg: '#f1f5f9' };
            const cover = item.photos?.find(p => p.is_cover) || item.photos?.[0];
            return (
              <div key={item.id} className="listing-card">
                <div className="listing-card__img">
                  {cover?.url ? (
                    <img src={cover.url} alt={item.title} />
                  ) : (
                    <div className="listing-card__img-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="listing-card__body">
                  <div className="listing-card__top">
                    <h3>{item.title}</h3>
                    <span className="listing-status-pill" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>
                  <p className="listing-card__desc">{item.description}</p>
                  <div className="listing-card__meta">
                    <span>{ROOM_TYPE_LABELS[item.roomType] || item.roomType}</span>
                    {item.location?.district && <span>{item.location.district}</span>}
                    {item.location?.city && <span>{item.location.city}</span>}
                    {item.bedrooms && <span>{item.bedrooms} hab.</span>}
                    {item.bathrooms && <span>{item.bathrooms} baño{item.bathrooms !== 1 ? 's' : ''}</span>}
                  </div>
                </div>
                <div className="listing-card__price">
                  <strong>COP ${Number(item.price).toLocaleString('es-CO')}</strong>
                  <span>/mes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ListingsPage;
