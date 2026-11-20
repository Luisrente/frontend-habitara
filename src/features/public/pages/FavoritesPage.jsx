import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

import { API_URL } from '../../../config.js';

function FavoritesPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    const storedUser = localStorage.getItem('habitara_user');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    Promise.all([
      fetch(`${API_URL}/favorites`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }),
      fetch(`${API_URL}/accommodations`)
    ])
      .then(async ([favoritesRes, accommodationsRes]) => {
        const favoritesData = await favoritesRes.json();
        const accommodationsData = await accommodationsRes.json();

        const favoriteIds = favoritesData.success && Array.isArray(favoritesData.data?.favorites)
          ? favoritesData.data.favorites.map((id) => Number(id))
          : [];

        const allRooms = accommodationsData.success && Array.isArray(accommodationsData.data)
          ? accommodationsData.data
          : [];

        setFavorites(favoriteIds);
        setRooms(allRooms.filter((room) => favoriteIds.includes(Number(room.id))));
      })
      .catch(() => {
        setFavorites([]);
        setRooms([]);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const favoriteRooms = useMemo(() => rooms, [rooms]);

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    localStorage.removeItem('habitara_favorites');
    navigate('/', { replace: true });
  };


  if (loading) {
    return <div className="container page-detail-loading">Cargando favoritos...</div>;
  }

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>

          <div className="catalog-actions">
            {user ? (
              <>
                <UserMenu user={user} />
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="container catalog-main">
        <section className="favorites-header">
          <div>
            <span className="eyebrow">Guardados</span>
            <h1>Mis habitaciones favoritas</h1>
          </div>
          <Link to="/" className="link-button muted">Volver al catálogo</Link>
        </section>

        {favoriteRooms.length === 0 ? (
          <div className="empty-state-box">
            <h3>No tienes habitaciones guardadas</h3>
            <p>Aún no agregas ninguna vivienda a tu lista de deseados.</p>
            <Link to="/" className="link-button primary">Explorar habitaciones</Link>
          </div>
        ) : (
          <section className="rooms-grid">
            {favoriteRooms.map((room) => {
              const location = room.location || {};
              const image = room.photos?.[0]?.url || room.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80';
              const services = room.amenities?.map((amenity) => amenity.name || amenity).slice(0, 4) || [];
              const locationText = [location.district, location.city].filter(Boolean).join(' · ');

              return (
                <article key={room.id} className="room-card">
                  <div className="room-card__image-wrap">
                    <img src={image} alt={room.title} className="room-card__image" />
                    <span className="room-badge featured">Guardado</span>
                  </div>

                  <div className="room-card__content">
                    <div className="room-card__header">
                      <h3>{room.title}</h3>
                      <span className="room-type">{room.roomType || 'Habitación'}</span>
                    </div>

                    <p className="room-location">📍 {locationText || 'Ubicación disponible'}</p>

                    <div className="room-services">
                      {services.map((service) => (
                        <span key={service} className="service-pill">{service}</span>
                      ))}
                    </div>

                    <div className="room-card__footer">
                      <div>
                        <span className="price-label">Desde</span>
                        <div className="price">COP $ {Number(room.price || 0).toLocaleString('es-CO')}</div>
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
    </div>
  );
}

export default FavoritesPage;
