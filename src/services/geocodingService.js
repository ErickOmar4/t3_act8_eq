import { ApiError, requestJson } from './http.js';
import { OAXACA_VIEWBOX } from '../config/constants.js';
import { CALLES, ZONAS } from '../config/fallbackData.js';
import { pointInZona } from '../utils/geo.js';
import { loadJson, saveJson } from '../utils/storage.js';

// Nominatim (OpenStreetMap): API pública y gratuita, sin API key.
// Política de uso: máximo 1 petición por segundo y sin autocompletado.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const LUGARES_KEY = 'rutaoax_lugares';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// GET /search: busca lugares por texto. Devuelve la lista cruda de la API.
export async function searchPlaces(query, { limit = 1, bounded = false } = {}) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'mx',
    viewbox: OAXACA_VIEWBOX,
    bounded: bounded ? '1' : '0',
    'accept-language': 'es',
  });
  const data = await requestJson(`${NOMINATIM_URL}/search?${params.toString()}`);
  return Array.isArray(data) ? data : [];
}

function toLugar(item) {
  const address = item.address ?? {};
  const calle = address.road ?? item.name;
  if (!calle || !item.lat || !item.lon) return null;
  return {
    calle,
    numero: address.house_number ?? '',
    zona: address.suburb ?? address.neighbourhood ?? address.city_district ?? address.village ?? 'Oaxaca de Juárez',
    lat: Number(item.lat),
    lng: Number(item.lon),
  };
}

async function fetchLugaresFromApi() {
  const lugares = [];
  const seen = new Set();
  const queries = ['calle', 'avenida'];
  for (let i = 0; i < queries.length; i += 1) {
    if (i > 0) await wait(1100); // respeta el límite de 1 petición por segundo
    const items = await searchPlaces(queries[i], { limit: 40, bounded: true });
    items.map(toLugar).filter(Boolean).forEach((lugar) => {
      const key = `${lugar.calle}|${lugar.zona}`;
      if (!seen.has(key)) {
        seen.add(key);
        lugares.push(lugar);
      }
    });
  }
  if (lugares.length < 10) throw new Error('Nominatim devolvió muy pocos lugares.');
  return lugares;
}

// RESPALDO: lugares inventados con JavaScript, solo si la API falla.
function buildFallbackLugares() {
  return Array.from({ length: 50 }, (_, i) => {
    const zona = ZONAS[i % ZONAS.length];
    const { lat, lng } = pointInZona(zona.nombre, i + 1);
    return { calle: CALLES[(i * 7) % CALLES.length], numero: String(100 + ((i * 37) % 800)), zona: zona.nombre, lat, lng };
  });
}

let lugaresPromise = null;

// Calles reales de Oaxaca (con colonia y coordenadas) para asignarlas a los pedidos de ejemplo.
// Se consulta una sola vez y se guarda en el navegador.
export function getLugaresEntrega() {
  if (!lugaresPromise) {
    lugaresPromise = (async () => {
      const cached = loadJson(LUGARES_KEY, null);
      if (Array.isArray(cached) && cached.length >= 10) return { lugares: cached, fuente: 'api' };
      try {
        const lugares = await fetchLugaresFromApi();
        saveJson(LUGARES_KEY, lugares);
        return { lugares, fuente: 'api' };
      } catch {
        return { lugares: buildFallbackLugares(), fuente: 'respaldo' };
      }
    })();
  }
  return lugaresPromise;
}

// Convierte una dirección escrita por la persona en coordenadas reales.
export async function geocodeAddress(calle, colonia) {
  const queries = [
    `${calle}, ${colonia}, Oaxaca de Juárez, Oaxaca, México`,
    `${calle}, Oaxaca de Juárez, Oaxaca, México`,
  ];
  for (let i = 0; i < queries.length; i += 1) {
    if (i > 0) await wait(1100);
    const [best] = await searchPlaces(queries[i], { limit: 1 });
    if (best) return { lat: Number(best.lat), lng: Number(best.lon), nombre: best.display_name };
  }
  throw new ApiError('No encontramos esa dirección en Oaxaca. Revisa la calle y la colonia.', 404);
}
