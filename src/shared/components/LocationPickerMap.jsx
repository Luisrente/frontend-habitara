import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps.js';

const DEFAULT_CENTER = { lat: 8.7479, lng: -75.8814 }; // Montería, Colombia

function LocationPickerMap({ lat, lng, onChange }) {
  const containerRef = useRef(null);
  const mapRef      = useRef(null);
  const markerRef   = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    // loadGoogleMaps() resuelve con window.google.maps (el namespace maps)
    loadGoogleMaps().then((maps) => {
      if (cancelled || !containerRef.current) return;

      const hasCoords = lat !== '' && lng !== '' && lat != null && lng != null;
      const center = hasCoords
        ? { lat: Number(lat), lng: Number(lng) }
        : DEFAULT_CENTER;

      const map = new maps.Map(containerRef.current, {
        center,
        zoom: hasCoords ? 16 : 13,
        mapId: 'HABITARA_PICKER',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;

      const placeMarker = (position) => {
        if (markerRef.current) {
          markerRef.current.position = position;
        } else {
          const marker = new maps.marker.AdvancedMarkerElement({
            map,
            position,
            gmpDraggable: true,
            title: 'Arrastra para ajustar',
          });

          marker.addListener('gmpDragEnd', () => {
            const pos = marker.position;
            const lt = typeof pos.lat === 'function' ? pos.lat() : Number(pos.lat);
            const ln = typeof pos.lng === 'function' ? pos.lng() : Number(pos.lng);
            onChangeRef.current(lt, ln);
          });

          markerRef.current = marker;
        }
      };

      if (hasCoords) placeMarker(center);

      map.addListener('click', (e) => {
        const lt = e.latLng.lat();
        const ln = e.latLng.lng();
        placeMarker({ lat: lt, lng: ln });
        onChangeRef.current(lt, ln);
      });
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar marcador cuando el usuario escribe coords manualmente
  useEffect(() => {
    if (!mapRef.current || lat === '' || lng === '' || lat == null || lng == null) return;
    const pos = { lat: Number(lat), lng: Number(lng) };
    if (isNaN(pos.lat) || isNaN(pos.lng)) return;
    if (markerRef.current) {
      markerRef.current.position = pos;
    }
    mapRef.current.panTo(pos);
    mapRef.current.setZoom(16);
  }, [lat, lng]);

  return <div ref={containerRef} className="location-picker-map" />;
}

export default LocationPickerMap;
