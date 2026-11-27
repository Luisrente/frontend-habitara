import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, geocodeAddress } from '../utils/loadGoogleMaps.js';

export default function LocationMap({ location, title }) {
  const mapRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!location) { setStatus('no-location'); return; }
    let cancelled = false;

    async function init() {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled) return;

        let coords;
        if (location.latitude && location.longitude) {
          coords = { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) };
        } else {
          const parts = [location.address, location.district, location.city].filter(Boolean);
          coords = await geocodeAddress(parts.join(', ') || 'Colombia');
        }

        if (cancelled) return;

        const map = new maps.Map(mapRef.current, {
          center: coords,
          zoom: 15,
          mapId: 'HABITARA_DETAIL',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        });

        const markerEl = document.createElement('div');
        markerEl.className = 'location-map-marker';
        markerEl.innerHTML = `<svg viewBox="0 0 24 24" fill="#2A52BE" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

        new maps.marker.AdvancedMarkerElement({
          map,
          position: coords,
          content: markerEl,
          title: title || 'Ubicación',
        });

        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    init();
    return () => { cancelled = true; };
  }, [location, title]);

  const addressText = location
    ? [location.address, location.district, location.city].filter(Boolean).join(', ')
    : '';

  const mapsUrl = addressText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText + ', Colombia')}`
    : null;

  return (
    <div className="location-map-wrap">
      {status === 'loading' && <div className="location-map-placeholder">Cargando mapa...</div>}
      {status === 'error' && <div className="location-map-placeholder">No se pudo cargar el mapa.</div>}
      <div ref={mapRef} className="location-map-canvas" style={{ display: status === 'ready' ? 'block' : 'none' }} />
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="location-map-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Ver en Google Maps
        </a>
      )}
    </div>
  );
}
