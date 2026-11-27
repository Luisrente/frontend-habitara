export const UNIVERSITIES = [
  {
    id: 1,
    name: 'Universidad de Córdoba',
    shortName: 'Unicor',
    address: 'Av. Carrera 4, Montería',
    lat: 8.7904236,
    lng: -75.8617925,
  },
  {
    id: 2,
    name: 'Universidad del Sinú',
    shortName: 'Unisinu',
    address: 'Cra. 1W, Montería',
    lat: 8.7694291,
    lng: -75.8859197,
  },
  {
    id: 3,
    name: 'Universidad Pontificia Bolivariana',
    shortName: 'UPB',
    address: 'Cra. 14, El Bosque, Montería',
    lat: 8.8036083,
    lng: -75.8507998,
  },
  {
    id: 4,
    name: 'Universidad Cooperativa de Colombia',
    shortName: 'UCC',
    address: 'Cra. 8, La Castellana, Montería',
    lat: 8.7664267,
    lng: -75.8688610,
  },
  {
    id: 5,
    name: 'Universidad Santo Tomás',
    shortName: 'USTA',
    address: 'Cra. 1W, La Ribera, Montería',
    lat: 8.7502497,
    lng: -75.8931721,
  },
];

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export function nearestUniversity(lat, lng) {
  if (!lat || !lng) return null;
  let nearest = null;
  let minDist = Infinity;
  for (const u of UNIVERSITIES) {
    const d = haversineKm(Number(lat), Number(lng), u.lat, u.lng);
    if (d < minDist) {
      minDist = d;
      nearest = { ...u, distanceKm: Math.round(d * 10) / 10 };
    }
  }
  return nearest;
}

export function allDistances(lat, lng) {
  if (!lat || !lng) return [];
  return UNIVERSITIES
    .map(u => ({
      ...u,
      distanceKm: Math.round(haversineKm(Number(lat), Number(lng), u.lat, u.lng) * 10) / 10,
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
