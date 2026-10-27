# Colección de Bruno · RutaOax

Pruebas de **todas las peticiones HTTP** que hace el programa. Las URLs y los valores están escritos
directamente en cada solicitud, así que **no necesitas configurar variables ni elegir un entorno**.

## Cómo abrirla

1. Instala [Bruno](https://www.usebruno.com/).
2. **Open Collection** → selecciona esta carpeta `bruno/` (la que contiene `bruno.json`).
3. Abre una solicitud y pulsa **Send** (`Ctrl+Enter`).
4. Revisa la respuesta a la derecha y la pestaña **Tests** (aquí se ven las verificaciones en verde o rojo).
5. Para correr todas: clic derecho sobre la colección → **Run**.

Necesitas internet. Cada solicitud tiene su explicación en la pestaña **Docs**.

**Solicitudes que dependen de otra** (usan una variable que la primera guarda sola):
- `1-06 Usuario de la sesión` necesita haber ejecutado antes `1-01 Login correcto` (variable `accessToken`).
- `6-02`, `6-03` y `6-04` necesitan haber ejecutado antes `6-01 Crear documento` (variable `blobId`).
  Si prefieres, reemplaza `{{blobId}}` en la URL por el ID que quieras probar.
Todas las demás son independientes y no usan variables.

## Qué deberías ver en cada una

| Solicitud | Petición | Resultado esperado |
|---|---|---|
| 1-01 Login correcto | `POST dummyjson.com/auth/login` con `emilys` / `emilyspass` | **200**, con `firstName: "Emily"`, `image` y `accessToken` |
| 1-02 Login incorrecto | mismo endpoint con contraseña `clavemala` | **400**, `message: "Invalid credentials"` |
| 1-03 Login con otro usuario | `michaelw` / `michaelwpass` | **200**, `firstName: "Michael"` |
| 1-04 Buscar usuario por correo | `GET /users/filter?key=email&value=emily.johnson@x.dummyjson.com` | **200**, `users[0].username: "emilys"` |
| 1-05 Correo que no existe | mismo endpoint con `nadie@ejemplo.com` | **200**, `users: []` (no es un error) |
| 1-06 Usuario de la sesión | `GET /auth/me` con el token del login | **200**, `username: "emilys"` (ejecuta antes 1-01) |
| 2-01 Listar pedidos | `GET /carts?limit=0` | **200**, lista `carts` con productos |
| 2-02 Ver un pedido | `GET /carts/1` | **200**, `id: 1` |
| 2-03 Listar clientes | `GET /users?limit=0&select=firstName,lastName,phone` | **200**, usuarios con id, nombre y teléfono |
| 2-04 Crear pedido | `POST /carts/add` | **200 o 201**, carrito nuevo (id 51), `totalQuantity: 3` |
| 2-05 Editar pedido | `PUT /carts/1` con `merge: true` | **200**, carrito 1 con más productos |
| 2-06 Editar pedido de la app | `PUT /carts/1001` | **404** (esperado) |
| 2-07 Eliminar pedido | `DELETE /carts/1` | **200**, `isDeleted: true` y `deletedOn` |
| 2-08 Eliminar pedido de la app | `DELETE /carts/1001` | **404** (esperado) |
| 2-09 Cambiar estado | `PATCH /todos/1` con `completed: true` | **200**, `completed: true` |
| 3-01 Ruta por calles | `GET router.project-osrm.org/route/v1/driving/…` | **200**, `code: "Ok"`, distancia y duración |
| 3-02 Ruta a Xoxocotlán | igual, con 2 puntos | **200**, `code: "Ok"` |
| 3-03 Optimizar orden | `GET /trip/v1/driving/…` (OSRM) | **200**, `code: "Ok"`, 4 waypoints con `waypoint_index` |
| 4-01 / 4-02 Pedidos paginados | `GET /carts?limit=10&skip=0` y `skip=10` | **200**, 10 pedidos; la página 2 empieza en el pedido 11 |
| 4-03 Carritos de un usuario | `GET /carts/user/5` | **200**, lista (puede venir vacía) |
| 5-01 Buscar calles de Oaxaca | `GET nominatim.openstreetmap.org/search?q=calle&bounded=1…` | **200**, lista con `lat`, `lon` y `address` |
| 5-02 Ubicar una dirección | `GET …/search?q=Avenida Independencia, Centro, Oaxaca…` | **200**, 1 resultado con coordenadas de Oaxaca |
| 5-03 Dirección que no existe | `GET …/search?q=Calle Inexistente…` | **200**, lista vacía |
| 6-01 Crear documento | `POST jsonblob.com/api/jsonBlob` | **201**, el ID viene en la cabecera `Location` |
| 6-02 Leer documento | `GET /api/jsonBlob/{id}` | **200**, con `vehiculos` y `recorridos` (ejecuta antes 6-01) |
| 6-03 Guardar cambios | `PUT /api/jsonBlob/{id}` | **200** |
| 6-04 Borrar documento | `DELETE /api/jsonBlob/{id}` | **200**; después 6-02 da 404 |

Las dos solicitudes **404 son correctas**: demuestran que un pedido creado en la app (folio mayor a 1000)
no existe en DummyJSON, por eso la app avisa que el cambio fue "solo en la app".

## Qué otros valores puedes probar

| Dato | Valores válidos | Cómo saber más |
|---|---|---|
| **Usuario y contraseña** (login) | Cualquier usuario de la lista. La contraseña es el usuario + `pass`: `michaelw` → `michaelwpass`, `sophiab` → `sophiabpass`, `jamesd` → `jamesdpass` | Abre https://dummyjson.com/users y copia `username` y `password` (hay 208 usuarios; la API pagina de 30 en 30, usa `?limit=0` para verlos todos) |
| **Correo** (buscar usuario) | `nombre.apellido@x.dummyjson.com`, por ejemplo `michael.williams@x.dummyjson.com` | Campo `email` en `/users`. Uno inventado devuelve `users: []` |
| **Id de pedido** (`/carts/{id}`) | Del 1 al 50 aprox. | Revisa `total` en la respuesta de *2-01 Listar pedidos*. Un id que no existe da **404**, como el 1001 |
| **userId** al crear un pedido | 1 al 208 | Campo `id` en `/users` |
| **Producto** (`"id": 144` en crear/editar) | Ids de productos (1 al 194 aprox.) | Abre https://dummyjson.com/products y revisa `id` y `total`. Un id inexistente suele dar error 404 |
| **quantity** | Número entero mayor a 0 | Revisa `totalQuantity` y `total` en la respuesta, cambian con la cantidad |
| **`merge`** (editar) | `true` conserva los productos anteriores; sin él los reemplaza | Compara `products` con y sin `merge` |
| **`limit` y `skip`** | `limit` = cuántos registros (0 = todos); `skip` = cuántos saltar. Página n → `skip = (n - 1) × limit` | Los campos `total`, `skip` y `limit` de la respuesta lo confirman |
| **`select`** | Campos separados por coma: `firstName,lastName,phone,email` | Cualquier campo que aparezca en `/users` |
| **Dirección a ubicar** (`q=` en Nominatim) | Cualquier calle de Oaxaca de Juárez. Espacios como `%20` y comas como `%2C` | Prueba `Calle%20Macedonio%20Alc%C3%A1la`, `Avenida%20Universidad` o una colonia. Una dirección inventada devuelve lista vacía |
| **Documento de JSONBlob** (`{{blobId}}`) | El ID que devolvió *6-01* (último tramo de la cabecera `Location`) | También puedes usar el ID de un documento creado desde el Panel de la app |
| **Coordenadas de la ruta** | `longitud,latitud` (**primero la longitud**), separadas por `;` en el orden de visita | Usa las zonas de abajo o pega un punto de Google Maps (clic derecho muestra `latitud, longitud`; invierte el orden) |

### Coordenadas de las zonas de Oaxaca que usa la app (`longitud,latitud`)

| Zona | Coordenadas |
|---|---|
| Centro de distribución (salida) | `-96.719,17.0505` |
| Centro Histórico | `-96.7253,17.0609` |
| Jalatlaco | `-96.7176,17.0663` |
| Colonia Reforma | `-96.716,17.0745` |
| Xochimilco | `-96.727,17.072` |
| Colonia América | `-96.73,17.07` |
| Colonia Volcanes | `-96.71,17.0835` |
| Cinco Señores | `-96.7081,17.0415` |
| Santa Lucía del Camino | `-96.6906,17.0707` |
| Santa Cruz Xoxocotlán | `-96.737,17.0242` |
| San Felipe del Agua | `-96.718,17.102` |

Ejemplo con cuatro paradas, solo cambiando la parte de la URL después de `/driving/`:

```
https://router.project-osrm.org/route/v1/driving/-96.719,17.0505;-96.7253,17.0609;-96.727,17.072;-96.716,17.0745?overview=full&geometries=geojson
```

Cambiar el **orden** de los puntos cambia la distancia total: es lo que hace la app al reordenar las paradas.
Las coordenadas son aproximadas.

## Si algo no sale como se espera

| Síntoma | Causa probable |
|---|---|
| `getaddrinfo ENOTFOUND` o *Error: connect* | Sin internet o bloqueo de red (VPN, proxy, red de la escuela) |
| **429** en las solicitudes de ruta | El servidor público de OSRM limita el uso; espera un minuto |
| **404** en login o en pedidos del 1 al 50 | Revisa que la URL no tenga espacios ni caracteres de más al copiarla |
| Los tests no aparecen | En la pestaña **Tests** de la respuesta; si Bruno está en *Safe Mode* y no se ejecutan, cambia a *Developer Mode* en la esquina inferior derecha |
| Los datos de `PUT` o `DELETE` no cambian al volver a pedir `/carts` | Es normal: DummyJSON **simula** las escrituras y no guarda nada |
| Una verificación falla por un número | DummyJSON puede cambiar sus datos de ejemplo; compara con la respuesta real y ajusta el valor de la pestaña **Assert** |
