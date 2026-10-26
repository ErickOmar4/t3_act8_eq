import { requestJson } from './http.js';
import { getLugaresEntrega } from './geocodingService.js';

const BASE_URL = 'https://dummyjson.com';

// Convierte un "cart" de DummyJSON en un pedido de entrega.
// La ubicación (calle, colonia, coordenadas) viene de la API de OpenStreetMap.
function mapCartToPedido(cart, user, lugar) {
  const titulos = cart.products.map((p) => p.title);
  const resumen = titulos.slice(0, 2).join(', ') + (titulos.length > 2 ? ` y ${titulos.length - 2} más` : '');

  return {
    id: cart.id,
    local: false,
    cliente: user ? `${user.firstName} ${user.lastName}` : `Cliente ${cart.userId}`,
    telefono: user?.phone ?? '',
    direccion: `${lugar.calle}${lugar.numero ? ` ${lugar.numero}` : ''}`,
    zona: lugar.zona,
    lat: lugar.lat,
    lng: lugar.lng,
    articulos: cart.totalQuantity,
    resumen,
    total: Math.round(cart.discountedTotal * 100) / 100,
    estado: 'pendiente',
    notas: '',
  };
}

// GET /carts + GET /users (DummyJSON) + calles de Oaxaca (Nominatim), en paralelo.
export async function fetchPedidosFromApi() {
  const [cartsData, usersData, lugaresInfo] = await Promise.all([
    requestJson(`${BASE_URL}/carts?limit=0`),
    requestJson(`${BASE_URL}/users?limit=0&select=firstName,lastName,phone`),
    getLugaresEntrega(),
  ]);
  const usersById = new Map(usersData.users.map((user) => [user.id, user]));
  const { lugares, fuente } = lugaresInfo;
  const pedidos = cartsData.carts.map((cart) =>
    mapCartToPedido(cart, usersById.get(cart.userId), lugares[(cart.id - 1) % lugares.length]),
  );
  return { pedidos, ubicacionFuente: fuente };
}

// DummyJSON simula las escrituras: responde bien, pero no guarda nada.
const buildProducts = (articulos) => [{ id: 144, quantity: Math.max(1, Number(articulos) || 1) }];

export function createPedidoRequest(values) {
  return requestJson(`${BASE_URL}/carts/add`, {
    method: 'POST',
    body: JSON.stringify({ userId: 1, products: buildProducts(values.articulos) }),
  });
}

export function updatePedidoRequest(id, values) {
  return requestJson(`${BASE_URL}/carts/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ merge: true, products: buildProducts(values.articulos) }),
  });
}

export function deletePedidoRequest(id) {
  return requestJson(`${BASE_URL}/carts/${id}`, { method: 'DELETE' });
}

// Cada cambio de estado se envía a la API como tarea completada (PATCH /todos/{id}).
// Solo "entregado" cuenta como completada. Los pedidos creados en la app no existen en la API.
export async function syncEstadoRequest(pedido, estado) {
  if (pedido.local) return { skipped: true };
  return requestJson(`${BASE_URL}/todos/${pedido.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed: estado === 'entregado' }),
  });
}
