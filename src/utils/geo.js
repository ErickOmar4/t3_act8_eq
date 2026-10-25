import { ZONAS } from '../config/fallbackData.js';

const toRad = (deg) => (deg * Math.PI) / 180;

// Distancia en línea recta (km) entre dos puntos { lat, lng }.
export function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

// Ordena las paradas con el algoritmo del "vecino más cercano" a partir de un origen.
export function sortByNearest(origin, stops) {
  const pending = [...stops];
  const ordered = [];
  let current = origin;
  while (pending.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    pending.forEach((stop, index) => {
      const distance = distanceKm(current, stop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    const [next] = pending.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }
  return ordered;
}

// RESPALDO (sin API): punto repetible dentro de una zona, solo si Nominatim no responde.
export function pointInZona(zonaNombre, seed) {
  const zona = ZONAS.find((z) => z.nombre === zonaNombre) ?? ZONAS[0];
  const noise = (offset) => {
    const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453;
    return x - Math.floor(x) - 0.5;
  };
  return { lat: zona.lat + noise(1) * 0.008, lng: zona.lng + noise(2) * 0.008 };
}
