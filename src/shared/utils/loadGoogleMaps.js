import { GOOGLE_MAPS_KEY } from '../../config.js';

let loadPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geocoding,marker&language=es&region=CO`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

const geocodeCache = new Map();

export async function geocodeAddress(address) {
  if (geocodeCache.has(address)) return geocodeCache.get(address);

  const maps = await loadGoogleMaps();
  const geocoder = new maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address: `${address}, Colombia` }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        geocodeCache.set(address, coords);
        resolve(coords);
      } else {
        // Fallback: Montería, Colombia
        const fallback = { lat: 8.7479, lng: -75.8814 };
        geocodeCache.set(address, fallback);
        resolve(fallback);
      }
    });
  });
}
