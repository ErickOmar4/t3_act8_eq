# Integración de APIs

Todas las peticiones están en `src/services/`; ningún componente llama a `fetch` directamente
(salvo la API de geolocalización del navegador, en `RutaMapa.jsx`).
Cada petición se puede probar por separado con la colección de Bruno (`bruno/`).

## 1. APIs que usa el programa

| API (gratuita, sin API key) | Para qué | Archivo y función | Bruno |
|---|---|---|---|
| **DummyJSON** `POST /auth/login` | Iniciar sesión | `authService.loginRequest` | 1-01, 1-02, 1-03 |
| DummyJSON `GET /users/filter` | Convertir un correo en `username` | `authService.resolveUsernameByEmail` | 1-04, 1-05 |
| DummyJSON `GET /auth/me` | Validar que el token de la sesión siga vigente | `authService.fetchCurrentUser` | 1-06 |
| DummyJSON `GET /carts` y `GET /users` | Pedidos y datos del cliente | `pedidosService.fetchPedidosFromApi` | 2-01, 2-03 |
| DummyJSON `POST /carts/add` | Crear pedido | `pedidosService.createPedidoRequest` | 2-04 |
| DummyJSON `PUT /carts/{id}` | Editar pedido | `pedidosService.updatePedidoRequest` | 2-05, 2-06 |
| DummyJSON `DELETE /carts/{id}` | Eliminar pedido | `pedidosService.deletePedidoRequest` | 2-07, 2-08 |
| DummyJSON `PATCH /todos/{id}` | Enviar cada cambio de estado de un pedido | `pedidosService.syncEstadoRequest` | 2-09 |
| **Nominatim** (OpenStreetMap) `GET /search` | Calles reales de Oaxaca para los pedidos de ejemplo, y ubicar la dirección de pedidos nuevos o editados | `geocodingService.getLugaresEntrega`, `geocodeAddress` | 5-01, 5-02, 5-03 |
| **OSRM** `GET /route` | Camino por calles entre paradas | `routingService.fetchRoute` | 3-01, 3-02 |
| OSRM `GET /trip` | Orden óptimo de las paradas | `routingService.optimizeStops` | 3-03 |
| **JSONBlob** `POST/GET/PUT /api/jsonBlob` | Guardar en línea vehículos, recorridos y cambios a pedidos | `storageService.*`, `LogisticaContext` | 6-01 a 6-04 |
| OpenStreetMap (teselas, vía Leaflet) | Dibujar el mapa de Oaxaca | `RutaMapa.jsx` | no aplica (son imágenes) |
| **Geolocalización del navegador** (Web API) | Ubicación real del dispositivo en el mapa | `RutaMapa.jsx` | no aplica |

`services/http.js` (`requestJson`) centraliza el `fetch`: pone `Content-Type` solo cuando hay cuerpo,
convierte fallos de red en un `ApiError` con mensaje legible y usa el `message` de la API cuando responde con error.

## 2. Qué se reemplazó: antes JavaScript, ahora API

| Qué | Antes (JavaScript) | aplicasión (API) | Respaldo si la API falla |
|---|---|---|---|
| Direcciones y coordenadas de los pedidos de ejemplo | | Nominatim: se consultan calles reales de Oaxaca (`q=calle` y `q=avenida` dentro de la caja de Oaxaca) con su colonia y coordenadas, y se guardan en el navegador | Datos inventados de `config/fallbackData.js` y se avisa en pantalla |
| Dirección de pedidos nuevos o editados | | La persona escribe calle y colonia; Nominatim las convierte en coordenadas | Ninguno: si no se encuentra la dirección, no se guarda y se muestra un mensaje |
| Orden de las paradas |  | OSRM `/trip` ordena las paradas saliendo del centro de distribución | Vecino más cercano local (`utils/geo.js`) y se avisa |
| Vehículos, repartidores y recorridos || Documento JSON en JSONBlob | Copia en `localStorage` |
| Pedidos creados, editados y eliminados | | Se guardan en el mismo documento de JSONBlob | Copia en `localStorage` |
| Estado de cada pedido | | Además se envía a DummyJSON `PATCH /todos/{id}` (`completed: true` solo si es *entregado*) | El estado cambia igual y se avisa |
| Sesión | | `GET /auth/me` valida el token al recargar; si venció (401) se cierra la sesión | Si no hay red, la sesión se conserva |
| Seguimiento en tiempo real || Botón **Mi ubicación en vivo** con la geolocalización del navegador | La simulación se conserva como demostración |

## 3. Flujos

**Inicio del sistema.** `LogisticaContext.loadAll()`: (1) lee el documento de JSONBlob si hay uno conectado, o la copia local;
(2) pide en paralelo carritos, clientes y calles de Oaxaca; (3) combina los pedidos de la API con los cambios guardados.

**Crear pedido.** Validar formulario → `geocodeAddress` (Nominatim) → `POST /carts/add` → agregar al estado → se guarda en JSONBlob.

**Editar pedido.** Confirmación → si cambió calle o colonia, `geocodeAddress` → `PUT /carts/{id}` → actualizar el estado.

**Crear recorrido.** Se eligen vehículo, fecha y pedidos → `optimizeStops` (OSRM `/trip`) → se guarda el recorrido.

**Cambiar estado de una parada.** `setEstadoPedido`: cambia en la app y envía `PATCH /todos/{id}`.

**Mapa.** `RutaMapa` pide a OSRM `/route` el camino con `[depósito, ...paradas]` y lo dibuja con Leaflet.

## 4. Qué sigue en JavaScript y por qué

Estas partes no tienen una API pública que las resuelva o es mejor resolverlas en el cliente.

| Qué | Por qué sigue en JavaScript |
|---|---|
| Validación de formularios (login, pedidos, vehículos) | Es validación de formato en el navegador, antes de enviar. Las APIs no validan estos campos |
| Folio de pedidos nuevos (mayor a 1000) | `POST /carts/add` devuelve siempre el mismo id (51); usarlo repetiría folios |
| Filtros y paginación de la tabla | Estado, zona y nombre del cliente no existen en la API de carritos; se piden todos los pedidos una vez y se filtran en el cliente |
| Convertir carritos en pedidos y asignarles una calle (`(id − 1) % n`) | Es la unión de dos APIs distintas; no existe una API de pedidos con direcciones de Oaxaca |
| Reglas de negocio (un recorrido por vehículo y día, capacidad del vehículo) | Son reglas de este sistema |
| Estados *en camino* y *no entregado* | La API de tareas solo distingue completada o no; esos estados se envían como `completed: false` |
| Guardado de vehículos y recorridos como un solo documento | JSONBlob guarda el documento completo (`PUT`); no ofrece un CRUD por registro |
| Todos los respaldos | Solo se usan cuando una API falla (ver tabla 2) |

## 5. Cuidados al usar estas APIs

- **Nominatim:** máximo 1 petición por segundo (la app espera 1.1 s entre peticiones) y no se usa para autocompletar.
  La consulta de calles se hace una vez y se guarda en el navegador.
- **OSRM público:** es un servidor de demostración; puede tardar o limitar peticiones.
- **JSONBlob es público:** cualquiera que tenga el ID puede leer o modificar el documento. Si dos personas guardan al mismo tiempo, gana el último guardado.
  El servicio puede borrar documentos inactivos.
- **DummyJSON** simula las escrituras: nada de lo que envía se guarda de verdad.
- Estas integraciones no se pudieron ejecutar al preparar el proyecto (sin red en el entorno de desarrollo);
  la colección de Bruno sirve para comprobar cada una antes de entregar.


