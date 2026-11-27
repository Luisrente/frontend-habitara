import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadGoogleMaps, geocodeAddress } from '../../../shared/utils/loadGoogleMaps.js';

function formatPrice(price) {
  return `COP $ ${Number(price || 0).toLocaleString('es-CO')}`;
}

export default function CatalogMapView({ rooms, favorites, onToggleFavorite, user, onShowPrompt }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      try {
        setLoading(true);
        const maps = await loadGoogleMaps();
        if (cancelled) return;

        // Center on Colombia if no specific location
        const mapCenter = { lat: 8.7479, lng: -75.8814 };

        const map = new maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 13,
          mapId: 'HABITARA_CATALOG',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new maps.InfoWindow();

        // Geocode and place markers for all rooms
        const bounds = new maps.LatLngBounds();
        let hasValidCoords = false;

        const markerPromises = rooms.map(async (room) => {
          const loc = room.location || {};
          let coords;

          if (loc.latitude && loc.longitude) {
            coords = { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) };
          } else {
            const addressParts = [loc.address, loc.district, loc.city].filter(Boolean);
            const address = addressParts.join(', ') || 'Montería';
            coords = await geocodeAddress(address);
          }

          if (cancelled) return;

          // Add slight random offset for rooms at same address
          const jitter = () => (Math.random() - 0.5) * 0.002;
          const position = { lat: coords.lat + jitter(), lng: coords.lng + jitter() };

          bounds.extend(position);
          hasValidCoords = true;

          // Custom price marker
          const isFav = favorites?.includes(room.id);
          const image = room.photos?.[0]?.url || room.image || '';
          const price = Number(room.price || 0).toLocaleString('es-CO');

          const markerEl = document.createElement('div');
          markerEl.className = 'map-price-marker';
          markerEl.textContent = `$${price}`;

          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position,
            content: markerEl,
            title: room.title,
          });

          marker.addListener('click', () => {
            setSelectedRoom(room);

            const content = `
              <div class="map-popup">
                ${image ? `<img src="${image}" alt="${room.title}" class="map-popup__img" />` : ''}
                <div class="map-popup__body">
                  <p class="map-popup__type">${room.roomType || 'Habitación'}</p>
                  <h4 class="map-popup__title">${room.title}</h4>
                  <p class="map-popup__location">📍 ${loc.district || loc.city || 'Ubicación'}</p>
                  <p class="map-popup__price">COP $ ${price}<span>/mes</span></p>
                  <a href="/accommodation/${room.id}" class="map-popup__btn">Ver detalle</a>
                </div>
              </div>
            `;
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);

            // Highlight marker
            markerEl.classList.add('is-active');
          });

          // Close other windows when clicking another
          map.addListener('click', () => {
            infoWindowRef.current.close();
            markerEl.classList.remove('is-active');
            setSelectedRoom(null);
          });

          return { marker, markerEl, room };
        });

        markersRef.current = (await Promise.all(markerPromises)).filter(Boolean);

        if (hasValidCoords && !cancelled) {
          map.fitBounds(bounds, { padding: 60 });
          if (rooms.length === 1) map.setZoom(15);
        }

        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError('No se pudo cargar el mapa.');
          setLoading(false);
        }
      }
    }

    initMap();
    return () => { cancelled = true; };
  }, [rooms]);

  // Highlight marker when hovering card in sidebar
  function handleCardHover(roomId, active) {
    markersRef.current.forEach(({ markerEl, room }) => {
      if (room.id === roomId) {
        markerEl.classList.toggle('is-hover', active);
      }
    });
  }

  return (
    <div className="catalog-map-layout">
      {/* Sidebar with room cards */}
      <aside className="catalog-map-list">
        {rooms.map((room) => {
          const loc = room.location || {};
          const image = room.photos?.[0]?.url || room.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80';
          const isFav = favorites?.includes(room.id);
          const locationText = [loc.district, loc.city].filter(Boolean).join(' · ');

          return (
            <article
              key={room.id}
              className={`map-list-card ${selectedRoom?.id === room.id ? 'is-selected' : ''}`}
              onMouseEnter={() => handleCardHover(room.id, true)}
              onMouseLeave={() => handleCardHover(room.id, false)}
            >
              <div className="map-list-card__img-wrap">
                <img src={image} alt={room.title} />
                <button
                  type="button"
                  className={`favorite-button${isFav ? ' is-active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user) { onShowPrompt?.(); return; }
                    // Re-trigger animation by cycling class
                    const btn = e.currentTarget;
                    btn.classList.remove('is-active');
                    void btn.offsetWidth;
                    onToggleFavorite?.(room.id);
                  }}
                  aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                  title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20.5s-7.5-4.35-9.22-8.06C1.66 9.57 3.22 5.5 7.28 5.5c2.06 0 3.24 1.09 4.1 2.22.86-1.13 2.04-2.22 4.1-2.22 4.06 0 5.62 4.07 4.5 6.94C19.5 16.15 12 20.5 12 20.5Z"
                      fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="map-list-card__info">
                <span className="room-type">{room.roomType || 'Habitación'}</span>
                <h3>{room.title}</h3>
                <p className="room-location">📍 {locationText || 'Ubicación disponible'}</p>
                <div className="map-list-card__footer">
                  <div className="price">{formatPrice(room.price)}<span className="price-label">/mes</span></div>
                  <Link to={`/accommodation/${room.id}`} className="detail-button">Ver</Link>
                </div>
              </div>
            </article>
          );
        })}
      </aside>

      {/* Map container */}
      <div className="catalog-map-container">
        {loading && (
          <div className="catalog-map-loading">
            <span>Cargando mapa...</span>
          </div>
        )}
        {error && (
          <div className="catalog-map-loading">
            <span>{error}</span>
          </div>
        )}
        <div ref={mapRef} className="catalog-map-canvas" />
      </div>
    </div>
  );
}
