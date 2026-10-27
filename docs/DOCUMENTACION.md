# Documentación del proyecto RutaOax
## 1. Idea general

El sistema responde a esta pregunta: **¿qué vehículo entrega qué pedidos, en qué fecha y por qué camino?**

Se relaciona así:

```
Pedido ──(se asigna a)──► Recorrido ◄──(lo realiza)── Vehículo (con su repartidor)
                          (vehículo + fecha + lista ordenada de pedidos)
```

- **Pedido**: paquete a entregar (cliente, dirección, zona, coordenadas, estado).
- **Vehículo**: combi, moto, camioneta, etc., con placa, repartidor y capacidad.
- **Recorrido**: plan de **un vehículo en una fecha**. Un vehículo puede tener un recorrido distinto cada día,
  pero solo uno por día. Un pedido pertenece a un solo recorrido.

Esta relación es la que conecta todas las vistas: el menú **Recorridos por día** es la agenda; desde ahí se
entra al detalle de cada recorrido, donde se actualizan los estados y se abre el mapa.
## 2. Pantallas

| Ruta | Pantalla | Qué hace |
|---|---|---|
| `/login` | Login | Valida campos, llama a DummyJSON, muestra error claro. Acepta usuario o correo. |
| `/` | Panel general | Indicadores, recorridos de hoy con avance y distribución por estado. |
| `/pedidos` | Pedidos | Tabla con filtros, paginación en la URL y CRUD. |
| `/vehiculos` | Vehículos | Registro de vehículos con su repartidor y sus próximos recorridos. |
| `/recorridos?fecha=AAAA-MM-DD` | Recorridos por día | Agenda de un día: tarjetas por vehículo y vehículos libres para planear. |
| `/recorridos/:id` | Detalle de recorrido | Lista de paradas, cambio de estado, reordenar, agregar/quitar y **Abrir mapa de Oaxaca**. |
## 3. Cómo se cumplió cada requisito de la actividad

### Fase 1 · Login
- Formulario con usuario/correo y contraseña. **Validación antes de enviar** (vacío, mínimo de caracteres) con mensajes por campo.
- `POST https://dummyjson.com/auth/login` en `services/authService.js`.
- Si el usuario escribe un correo, se busca su `username` con `GET /users/filter?key=email&value=...`.
- Error `400` → "Usuario o contraseña incorrectos." Fallo de red → mensaje de conexión.
- Los datos del usuario (incluida `image`) se guardan en `useState` dentro de `AuthContext`.
  Se copian también a `sessionStorage` solo para no perder la sesión al recargar la pestaña.

### Fase 2 · Sidebar + Navbar
- `Sidebar.jsx`: 4 opciones (Panel, Pedidos, Vehículos, Recorridos por día). En pantallas pequeñas se vuelve un menú deslizable.
- `Navbar.jsx`: foto de perfil, nombre, usuario y botón **Cerrar sesión**.
- `ProtectedRoute.jsx`: si `user` es `null`, redirige a `/login` y recuerda la página pedida para volver después de entrar.

### Fase 3 · Tabla, filtros, paginación y CRUD
- **API elegida: DummyJSON `/carts`** (los carritos se usan como pedidos) cruzada con `/users` para tener nombre y teléfono del cliente.
  Como la API no trae direcciones de Oaxaca, las calles, colonias y coordenadas salen de Nominatim (OpenStreetMap).
- **Filtros**: texto (cliente, dirección o folio), estado y zona.
- **Paginación**: botones de página y selector 10/20/40/50.
- **URL**: todo vive en parámetros (`/pedidos?page=2&limit=20&estado=pendiente&zona=...&q=...`), así se puede compartir
  el enlace y funciona el botón "atrás". La búsqueda por texto usa `replace` para no llenar el historial.
- **Cargando / error**: `LoadingState` mientras llega la API y `ErrorState` con botón **Reintentar** si falla.
- **CRUD** (en `PedidosPage.jsx`): primero se hace la petición real y después se refleja en el estado local.

| Acción | Petición | Confirmación |
|---|---|---|
| Crear | `POST /carts/add` | No (el formulario ya valida) |
| Editar | `PUT /carts/{id}` | **Sí**, antes de guardar |
| Eliminar | `DELETE /carts/{id}` | **Sí**, antes de eliminar |

  Los pedidos creados en la app no existen en DummyJSON, así que su `PUT`/`DELETE` responde 404.
  Para esos casos se muestra un aviso y el cambio se aplica igual en la app.

### Buenas prácticas
- Carpetas separadas (`components`, `pages`, `services`, `context`, `utils`, `config`).
- Ningún `fetch` dentro de componentes: todo pasa por `services/` y `services/http.js`.
- Componentes reutilizables: `Modal`, `ConfirmDialog`, `Pagination`, `StatusBadge`, `PedidoPicker`, etc.
- Errores visibles al usuario con avisos (`Toast`), alertas y estados de error.
- `.gitignore` incluido (`node_modules`, `dist`, `.env`, etc.).
## 4. Decisiones de diseño del sistema de logística

1. **Todo con APIs.** Pedidos, login, estados, direcciones, rutas y almacenamiento usan APIs públicas gratuitas
   (ver [INTEGRACION_APIS.md](INTEGRACION_APIS.md)). Lo que sigue en JavaScript está justificado ahí.
2. **Persistencia.** DummyJSON no guarda escrituras, así que vehículos, recorridos y cambios a pedidos se guardan en un
   documento de **JSONBlob**. Siempre queda una copia en `localStorage` como respaldo sin conexión. Si no hay documento conectado,
   funciona solo con esa copia. El documento se conecta desde el Panel general o con `VITE_JSONBLOB_ID`.
3. **Direcciones.** Los pedidos de ejemplo reciben calles reales de Oaxaca consultadas a Nominatim. Al crear o editar un pedido,
   la dirección escrita se convierte en coordenadas con la misma API.
4. **Orden de la ruta.** OSRM (`/trip`) ordena las paradas saliendo del centro de distribución. Se puede volver a calcular con
   **Optimizar orden** (las paradas ya entregadas se respetan) y reordenar a mano con las flechas.
5. **Capacidad.** No se puede asignar a un vehículo más pedidos que su capacidad.
6. **Mapa.** Leaflet + teselas de OpenStreetMap. El camino por calles lo calcula OSRM; si no responde, se dibujan las paradas
   unidas en línea recta con un aviso. Los pines son numerados y cambian de color según el estado.
7. **Tiempo real.** El estado de cada parada se actualiza al instante en todas las vistas y se envía a la API. El botón
   **Mi ubicación en vivo** muestra la posición real del dispositivo (geolocalización del navegador) y **Simular seguimiento**
   mueve un punto sobre la ruta como demostración. Seguir a varios repartidores a la vez requeriría que cada uno envíe su ubicación a un servidor.
8. **Estados del pedido.** `pendiente → en_camino → entregado` o `no_entregado`. Si un pedido sale de un recorrido sin haberse entregado, vuelve a `pendiente`.
## 5. Diseño visual

Paleta inspirada en Oaxaca, pensada para uso prolongado (fondo claro de piedra, contraste alto en texto, color solo donde importa):

| Color | Uso |
|---|---|
| Añil `#1E2A47` | Barra lateral, títulos, indicador principal del panel |
| Verde cantera `#1F6F5C` | Acciones principales y progreso |
| Maíz `#E0A526` | Acento de marca y estado *pendiente* |
| Azul / verde / grana | Estados *en camino*, *entregado*, *no entregado* |

Los colores están como variables en `src/styles/theme.css`; cambiar ahí un valor cambia todo el sistema.
La interfaz es responsive y tiene foco visible para teclado.
## 6. Dónde cambiar cosas

| Quiero… | Archivo |
|---|---|
| Cambiar el punto de salida de los recorridos | `src/config/constants.js` → `DEPOSITO` |
| Cambiar la zona de búsqueda de direcciones | `src/config/constants.js` → `OAXACA_VIEWBOX` |
| Cambiar los datos de respaldo | `src/config/fallbackData.js` |
| Agregar tipos de vehículo | `src/config/constants.js` → `TIPOS_VEHICULO` |
| Usar otra API de pedidos | `src/services/pedidosService.js` (adapta `mapCartToPedido`) |
| Cambiar de servicio de direcciones | `src/services/geocodingService.js` |
| Cambiar de servicio de rutas | `src/services/routingService.js` |
| Cambiar dónde se guardan los datos | `src/services/storageService.js` y `LogisticaContext.jsx` |
| Cambiar colores | `src/styles/theme.css` |
| Cambiar las opciones por página | `src/config/constants.js` → `LIMIT_OPTIONS` |
| Agregar un estado de entrega | `src/config/constants.js` → `ESTADOS` (y una clase `.tone-*` / `.badge-*` si usa un tono nuevo) |
| Agregar una pantalla | Crea la página en `src/pages/`, registra la ruta en `src/App.jsx` y el enlace en `Sidebar.jsx` |
## 7. Modelo de datos (resumen)

```js
Pedido    { id, local, cliente, telefono, direccion, zona, lat, lng, articulos, resumen, total, estado, notas }
Vehiculo  { id, tipo, placa, repartidor, telefono, capacidad }
Recorrido { id, vehiculoId, fecha: 'AAAA-MM-DD', pedidoIds: [ids en orden de visita] }
```
## 8. Trabajo en equipo con Git (requisito de la actividad)

La tabla completa de 14 commits, con los comandos y la explicación de cada uno, está en [GUIA_COMMITS.md](GUIA_COMMITS.md). Resumen:

Cada integrante debe trabajar con **su propio usuario de Git** y hacer commits frecuentes. Una división posible:

| Persona | Fase | Ejemplos de commits |
|---|---|---|
| Integrante A | Fase 1 y 2 | `feat(login): formulario con validaciones`, `feat(auth): conectar con DummyJSON`, `feat(layout): sidebar y navbar`, `feat(auth): proteger rutas` |
| Integrante B | Fase 3 | `feat(pedidos): tabla con datos de la API`, `feat(pedidos): filtros y paginación en URL`, `feat(pedidos): crear, editar y eliminar con confirmación` |
| Ambos | Extra | `feat(vehiculos): registro de vehículos`, `feat(recorridos): agenda por día`, `feat(mapa): ruta con Leaflet y OSRM`, `docs: documentación` |

```bash
git init
git config user.name "Tu nombre"
git config user.email "tu-correo@ejemplo.com"
git add .
git commit -m "chore: proyecto base con Vite y React"
```
## 9. Limitaciones conocidas

- Las integraciones con Nominatim, OSRM y JSONBlob no se pudieron ejecutar al preparar el proyecto (sin red en el entorno de desarrollo).
  Pruébalas con la colección de Bruno y revisa el comportamiento en el navegador antes de entregar.
- Nominatim limita a 1 petición por segundo; la primera carga de pedidos tarda unos segundos extra mientras consulta las calles.
- Los servidores públicos de OSRM y Nominatim son de uso moderado; para producción conviene alojar los propios.
- JSONBlob es público: cualquiera con el ID puede leer o modificar el documento. Usa solo datos de práctica.
- Si dos personas guardan al mismo tiempo, gana el último guardado.
- Si publicas el proyecto como sitio estático, configura que todas las rutas apunten a `index.html` (por usar `BrowserRouter`).
