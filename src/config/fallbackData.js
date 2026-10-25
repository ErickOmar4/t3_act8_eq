// DATOS DE RESPALDO: solo se usan si la API de OpenStreetMap (Nominatim) no responde.
// En condiciones normales las direcciones y coordenadas de los pedidos salen de esa API.
export const ZONAS = [
  { nombre: 'Centro Histórico', lat: 17.0609, lng: -96.7253 },
  { nombre: 'Jalatlaco', lat: 17.0663, lng: -96.7176 },
  { nombre: 'Colonia Reforma', lat: 17.0745, lng: -96.716 },
  { nombre: 'Xochimilco', lat: 17.072, lng: -96.727 },
  { nombre: 'Colonia América', lat: 17.07, lng: -96.73 },
  { nombre: 'Colonia Volcanes', lat: 17.0835, lng: -96.71 },
  { nombre: 'Cinco Señores', lat: 17.0415, lng: -96.7081 },
  { nombre: 'Santa Lucía del Camino', lat: 17.0707, lng: -96.6906 },
  { nombre: 'Santa Cruz Xoxocotlán', lat: 17.0242, lng: -96.737 },
  { nombre: 'San Felipe del Agua', lat: 17.102, lng: -96.718 },
];

export const CALLES = [
  'Av. Independencia', 'Calle Morelos', 'Calle Macedonio Alcalá', 'Av. Juárez', 'Calle Hidalgo',
  'Calle Porfirio Díaz', 'Av. Universidad', 'Calle Reforma', 'Calle Murguía', 'Calle Allende',
  'Av. Ferrocarril', 'Calle Abasolo',
];
