import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

const API_URL = 'http://localhost:4000/api';

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.35-9.22-8.06C1.66 9.57 3.22 5.5 7.28 5.5c2.06 0 3.24 1.09 4.1 2.22.86-1.13 2.04-2.22 4.1-2.22 4.06 0 5.62 4.07 4.5 6.94C19.5 16.15 12 20.5 12 20.5Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const quickFilters = [
  'Menos de COP $ 400.000',
  'Cerca a universidad',
  'Amoblado',
  'WiFi',
  'Baño privado'
];

const QUICK_FILTER_FN = {
  'Menos de COP $ 400.000': (r) => Number(r.price) < 400000,
  'Cerca a universidad':    (r) => Number(r.distanceToUniversityKm) <= 1,
  'Amoblado':               (r) => r.isFurnished === true,
  'WiFi':                   (r) => r.amenities?.some(a => (a.name || a).toLowerCase().includes('wifi')),
  'Baño privado':           (r) => r.amenities?.some(a => (a.name || a).toLowerCase().includes('baño')),
};

const serviceOptions = ['WiFi', 'Amueblado', 'Baño privado', 'Cocina', 'Parqueadero', 'Aire Acondicionado'];

function CatalogPage() {
  const [selectedType, setSelectedType] = useState('Todos');
  const [viewMode, setViewMode] = useState('grid');
  const [showPrompt, setShowPrompt] = useState(false);
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [activeReservations, setActiveReservations] = useState(0);
  const [activeQuickFilters, setActiveQuickFilters] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('habitara_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    const token = localStorage.getItem('habitara_token');
    if (token) {
      // Refrescar datos del usuario para que el rol siempre esté actualizado
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            const cached = JSON.parse(localStorage.getItem('habitara_user') || '{}');
            const updated = { ...cached, ...data.data };
            localStorage.setItem('habitara_user', JSON.stringify(updated));
            setUser(updated);
          }
        })
        .catch(() => {/* usar datos en caché */});

      fetch(`${API_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data?.favorites))
            setFavorites(d.data.favorites.map(id => Number(id)));
        })
        .catch(() => setFavorites([]));

      fetch(`${API_URL}/reservations/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data))
            setActiveReservations(d.data.filter(r => r.status === 'pending' || r.status === 'confirmed').length);
        })
        .catch(() => {});
    }

    fetch(`${API_URL}/accommodations`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setRooms(data.data);
        } else {
          setRooms([]);
        }
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);


  const toggleFavorite = async (roomId) => {
    const token = localStorage.getItem('habitara_token');
    if (!token || !user) {
      setShowPrompt(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accommodationId: roomId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo actualizar favoritos');
      }

      setFavorites(data.data.favorites.map((id) => Number(id)));
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    if (!token) {
      setFavorites([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('habitara_favorites', JSON.stringify(favorites));
    }
  }, [favorites, user]);

  const toggleQuickFilter = (f) =>
    setActiveQuickFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (selectedType !== 'Todos')
      result = result.filter(r => r.roomType === selectedType);
    for (const f of activeQuickFilters) {
      const fn = QUICK_FILTER_FN[f];
      if (fn) result = result.filter(fn);
    }
    return result;
  }, [selectedType, rooms, activeQuickFilters]);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    localStorage.removeItem('habitara_favorites');
    setUser(null);
    setFavorites([]);
    navigate('/', { replace: true });
  };

  const userRole = (user?.role || '').toLowerCase();

  const formatPrice = (value) => {
    const amount = Number(value || 0);
    return `COP $${amount.toLocaleString('es-CO')}`;
  };

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <div className="brand-mark">HABITARA</div>

          <div className="catalog-search">
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Universidad, barrio o zona" />
          </div>

          <div className="catalog-actions">
            {user ? (
              <>
                <Link to="/favorites" className="icon-action" title="Mis favoritos" aria-label="Mis favoritos">
                  <HeartIcon filled={favorites.length > 0} />
                  {favorites.length > 0 && (
                    <span className="favorites-count">{favorites.length}</span>
                  )}
                </Link>
                <Link to="/reservations" className="icon-action" title="Mis reservas" aria-label="Mis reservas">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {activeReservations > 0 && (
                    <span className="favorites-count">{activeReservations}</span>
                  )}
                </Link>
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link to="/login" className="link-button muted">Iniciar sesión</Link>
                <Link to="/register" className="link-button primary">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container catalog-main">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Encuentra tu espacio ideal</span>
            <h1>Habitaciones y alojamientos para estudiar y vivir mejor.</h1>
            <p>
              Descubre opciones cómodas, seguras y cercanas a universidades, centros de trabajo y zonas clave de la ciudad.
            </p>
          </div>

          <div className="filters-panel">
            <div className="panel-row">
              <label>
                Presupuesto máximo
                <div className="range-meta">
                  <span>COP $ 300.000</span>
                  <input type="range" min="300000" max="1200000" defaultValue="600000" />
                  <span>COP $ 1.200.000</span>
                </div>
              </label>
            </div>

            <div className="chip-group">
              {[
                { label: 'Todos',       value: 'Todos' },
                { label: 'Individual',  value: 'individual' },
                { label: 'Apartamento', value: 'apartment' },
                { label: 'Estudio',     value: 'studio' },
                { label: 'Pensión',     value: 'pension' },
                { label: 'Habitación',  value: 'room' },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  className={selectedType === value ? 'chip active' : 'chip'}
                  onClick={() => setSelectedType(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="select-row">
              <select defaultValue="Universidad cercana">
                <option>Universidad cercana</option>
                <option>Unicor</option>
                <option>UNMSM</option>
                <option>UPC</option>
              </select>
              <button type="button" className="secondary-btn">Más filtros</button>
            </div>

            <div className="panel-services">
              {serviceOptions.map((service) => (
                <label key={service} className="service-check">
                  <input type="checkbox" /> {service}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="results-toolbar">
          <div>
            <strong>{filteredRooms.length}</strong> habitaciones disponibles cerca de tu búsqueda
          </div>

          <div className="view-switcher">
            <button type="button" className={viewMode === 'grid' ? 'switch active' : 'switch'} onClick={() => setViewMode('grid')}>
              Grid
            </button>
            <button type="button" className={viewMode === 'map' ? 'switch active' : 'switch'} onClick={() => setViewMode('map')}>
              Mapa
            </button>
          </div>
        </section>

        <section className="quick-filters">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={activeQuickFilters.includes(filter) ? 'chip active' : 'chip ghost'}
              onClick={() => toggleQuickFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </section>

        {loading ? (
          <p>Cargando habitaciones...</p>
        ) : filteredRooms.length === 0 ? (
          <p>No hay alojamientos publicados aún.</p>
        ) : (
          <section className={viewMode === 'grid' ? 'rooms-grid' : 'rooms-grid rooms-grid--split'}>
            {filteredRooms.map((room) => {
              const location = room.location || {};
              const image = room.photos?.[0]?.url || room.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
              const services = room.amenities?.map((amenity) => amenity.name || amenity).slice(0, 4) || [];
              const roomType = room.roomType || room.type || 'Habitación';
              const locationText = [location.district, location.city].filter(Boolean).join(' · ');

              return (
                <article key={room.id} className="room-card">
                  <div className="room-card__image-wrap">
                    <img src={image} alt={room.title} className="room-card__image" />
                    <span className={room.featured ? 'room-badge featured' : 'room-badge'}>{room.status === 'published' ? 'Disponible ya' : room.status}</span>
                    <button
                      type="button"
                      className={`favorite-button ${favorites.includes(room.id) ? 'is-active' : ''}`}
                      onClick={async () => {
                        if (!user) {
                          setShowPrompt(true);
                          return;
                        }
                        await toggleFavorite(room.id);
                      }}
                      aria-label="Guardar habitación"
                    >
                      <HeartIcon filled={favorites.includes(room.id)} />
                    </button>
                  </div>

                  <div className="room-card__content">
                    <div className="room-card__header">
                      <h3>{room.title}</h3>
                      <span className="room-type">{roomType}</span>
                    </div>

                    <p className="room-location">📍 {locationText || room.locationText || 'Ubicación disponible'}</p>

                    <div className="room-services">
                      {services.map((service) => (
                        <span key={service} className="service-pill">{service}</span>
                      ))}
                    </div>

                    <div className="room-card__footer">
                      <div>
                        <span className="price-label">Desde</span>
                        <div className="price">{formatPrice(room.price)}</div>
                      </div>
                      <Link to={`/accommodation/${room.id}`} className="detail-button">Ver detalles</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {showPrompt && (
        <div className="auth-modal" onClick={() => setShowPrompt(false)}>
          <div className="auth-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3>Únete a HABITARA</h3>
            <p>Guarda habitaciones y contacta con arrendadores de forma segura.</p>
            <div className="modal-actions">
              <Link to="/register" className="link-button primary" onClick={() => setShowPrompt(false)}>
                Crear cuenta
              </Link>
              <Link to="/login" className="link-button muted" onClick={() => setShowPrompt(false)}>
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
