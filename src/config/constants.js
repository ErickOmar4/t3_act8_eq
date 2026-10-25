// Punto de salida de todos los recorridos (ejemplo). Cambia las coordenadas por tu bodega real.
export const DEPOSITO = { nombre: 'Centro de distribución', lat: 17.0505, lng: -96.719 };

// Centro del mapa de Oaxaca de Juárez
export const OAXACA_CENTER = [17.0654, -96.7236];

// Caja de búsqueda alrededor de Oaxaca de Juárez para Nominatim (lon1,lat1,lon2,lat2)
export const OAXACA_VIEWBOX = '-96.78,17.11,-96.68,17.02';

export const ESTADOS = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  en_camino: { label: 'En camino', tone: 'info' },
  entregado: { label: 'Entregado', tone: 'success' },
  no_entregado: { label: 'No entregado', tone: 'danger' },
};

export const TIPOS_VEHICULO = ['Combi', 'Motocicleta', 'Camioneta', 'Bicicleta', 'Automóvil'];

export const LIMIT_OPTIONS = [10, 20, 40, 50];
