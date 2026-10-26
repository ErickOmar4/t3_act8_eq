import { requestJson } from './http.js';
import { sortByNearest } from '../utils/geo.js';

// OSRM (servidor público de demostración, sin API key).
// Para producción conviene alojar tu propio OSRM o usar OpenRouteService / Mapbox.
const OSRM_URL = 'https://router.project-osrm.org';

const toCoordinates = (points) => points.map((p) => `${p.lng},${p.lat}`).join(';');

// Camino por calles que pasa por todos los puntos, en el orden dado.
export async function fetchRoute(points) {
  const data = await requestJson(`${OSRM_URL}/route/v1/driving/${toCoordinates(points)}?overview=full&geometries=geojson`);
  const route = data?.routes?.[0];
  if (data?.code !== 'Ok' || !route) {
    throw new Error('El servicio de rutas no pudo calcular el camino.');
  }
  return {
    // GeoJSON viene como [lng, lat]; Leaflet usa [lat, lng].
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
  };
}

// Orden óptimo de las paradas con el servicio /trip de OSRM (sale del origen y no regresa).
async function fetchOptimizedOrder(origin, stops) {
  const url = `${OSRM_URL}/trip/v1/driving/${toCoordinates([origin, ...stops])}?roundtrip=false&source=first&destination=any&overview=false`;
  const data = await requestJson(url);
  if (data?.code !== 'Ok' || !Array.isArray(data.waypoints)) throw new Error('OSRM no pudo optimizar el orden.');
  // waypoints[i].waypoint_index = posición del punto i de la petición dentro del viaje óptimo
  return data.waypoints
    .map((waypoint, inputIndex) => ({ inputIndex, position: waypoint.waypoint_index }))
    .filter((item) => item.inputIndex > 0)
    .sort((a, b) => a.position - b.position)
    .map((item) => stops[item.inputIndex - 1]);
}

// Ordena las paradas con la API de OSRM. Si falla, usa el vecino más cercano calculado en el navegador.
export async function optimizeStops(origin, stops) {
  if (stops.length < 2) return { ordered: stops, method: 'osrm' };
  try {
    return { ordered: await fetchOptimizedOrder(origin, stops), method: 'osrm' };
  } catch {
    return { ordered: sortByNearest(origin, stops), method: 'local' };
  }
}
