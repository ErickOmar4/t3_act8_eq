# Cumplimiento de la rúbrica

Para cada criterio: qué se implementó, dónde está, cómo demostrarlo y qué decir con honestidad.

## 1. Login funcional con DummyJSON, validación correcta e incorrecta (6 pts)

**Qué se hizo**
- Formulario de usuario/correo y contraseña (`pages/LoginPage.jsx`).
- Petición real `POST https://dummyjson.com/auth/login` (`services/authService.js`).
- **Validación antes de enviar:** campos vacíos, usuario de menos de 3 caracteres, contraseña de menos de 4. Los mensajes aparecen por campo al salir del campo o al enviar, y no se hace la petición si hay errores.
- **Credenciales incorrectas:** la API responde 400 y se muestra "Usuario o contraseña incorrectos."
- **Credenciales correctas:** los datos del usuario (incluida `image`) se guardan en `useState` (`context/AuthContext.jsx`) y se cambia de pantalla.
- Extras: aceptar correo, mostrar/ocultar contraseña, botón deshabilitado con "Verificando…", error de red legible.

**Cómo demostrarlo**
1. Enviar vacío → mensajes "Escribe tu usuario o correo." y "Escribe tu contraseña."
2. `emilys` / `abc` → "La contraseña debe tener al menos 4 caracteres."
3. `emilys` / `clavemala` → alerta roja "Usuario o contraseña incorrectos."
4. `emilys` / `emilyspass` → entra al sistema.
5. En Bruno: `01 Login correcto` (200) y `02 Login incorrecto` (400).

## 2. Sidebar y navbar con datos del usuario, y protección de la vista (5 pts)

**Qué se hizo**
- `components/layout/Sidebar.jsx`: 4 opciones (Panel, Pedidos, Vehículos, Recorridos por día) con la activa resaltada; en pantallas chicas es un menú deslizable.
- `components/layout/Navbar.jsx`: foto de perfil (`user.image`), nombre, usuario y botón **Cerrar sesión**, que limpia el estado y regresa al login.
- `components/auth/ProtectedRoute.jsx`: si `user` es `null`, redirige a `/login` y recuerda la página pedida; tras iniciar sesión vuelve a ella.

**Cómo demostrarlo**
1. Ventana de incógnito → abrir `/pedidos` directamente → te manda al login → al entrar, regresa a `/pedidos`.
2. Cerrar sesión → vuelve al login; el botón "atrás" no deja ver el sistema.

**Nota honesta:** el estado `user` es la fuente de verdad, pero se copia a `sessionStorage` para sobrevivir a una recarga de la pestaña. Se borra al cerrar sesión o la pestaña. Al recargar con una sesión guardada, el token se valida con `GET /auth/me`; si venció, se cierra la sesión.

## 3. Tabla de datos con filtros funcionando (5 pts)

**Qué se hizo** (`pages/PedidosPage.jsx`)
- Datos reales de DummyJSON (`/carts` + `/users`).
- Filtro de texto (cliente, dirección o folio), filtro por **estado** y filtro por **zona**; se pueden combinar.
- Botón **Limpiar filtros**, mensaje cuando no hay resultados, indicador **cargando** y error con **Reintentar**.

**Cómo demostrarlo:** escribir "Av. Juárez", elegir estado "Pendiente", elegir una zona, limpiar. Apagar el internet y pulsar "Sincronizar con la API" para ver el error.

## 4. Paginación con selector de cantidad y reflejo en la URL (7 pts)

**Qué se hizo**
- `components/ui/Pagination.jsx`: anterior/siguiente, números de página, "Mostrando 11–20 de 50" y selector **10 / 20 / 40 / 50**.
- Todo vive en la URL: `/pedidos?page=2&limit=20&estado=pendiente&zona=Jalatlaco&q=ana`.
- Compartir el enlace reproduce la misma vista; el botón "atrás" del navegador regresa a la página/filtros anteriores.
- Cambiar un filtro o el límite regresa a la página 1; los valores inválidos de la URL se corrigen (límite no permitido → 10, página mayor a la última → la última).

**Cómo demostrarlo:** ir a la página 3, cambiar a 20 por página, copiar la URL en otra pestaña, usar "atrás".

**Nota honesta:** se piden todos los pedidos una vez (`limit=0`) y la paginación se hace en el cliente, porque los datos se transforman y combinan localmente. Con una API grande se usarían `limit` y `skip` del servidor.

## 5. CRUD con llamada real a la API y reflejo en estado local (10 pts)

**Qué se hizo** (`PedidosPage.jsx` + `services/pedidosService.js` + `LogisticaContext.jsx`)

| Acción | Petición real | Después, estado local | Confirmación |
|---|---|---|---|
| Agregar | Ubicar la dirección (Nominatim) y `POST /carts/add` | `addPedido()` | No (valida el formulario) |
| Editar | (Nominatim si cambió la dirección) y `PUT /carts/{id}` | `updatePedido()` | Sí: "¿Quieres guardar los cambios del pedido #X?" |
| Eliminar | `DELETE /carts/{id}` | `removePedido()` | Sí: "¿Eliminar el pedido #X?" |

- El orden es `await petición` → estado. Si la API falla en un pedido de la API, se muestra el error y **no** se cambia la tabla.
- Se muestra un aviso con la respuesta de la API (ej. "la API respondió con el folio 51, simulado").
- Eliminar también quita el pedido del recorrido al que estuviera asignado.
- Los cambios sobreviven a una recarga: se guardan en JSONBlob (o en el navegador si no hay documento conectado).

**Cómo demostrarlo:** crear un pedido; editar uno (aparece la confirmación); eliminar uno (confirmación). Abrir en Bruno `2-04`, `2-05` y `2-07` para ver las mismas peticiones y sus respuestas.

**Nota honesta:** los pedidos creados en la app no existen en DummyJSON, así que su `PUT`/`DELETE` devuelve 404 (Bruno `2-06` y `2-08`). Para esos casos la app avisa y aplica el cambio local de todos modos. Se hace la llamada real, pero el cambio no depende de su éxito. Conviene explicarlo al presentar.

## 6. Buenas prácticas de código (3 pts)

| Práctica | Evidencia |
|---|---|
| Carpetas claras | `components/` (ui, layout, auth, pedidos, vehiculos, recorridos), `pages/`, `services/`, `context/`, `utils/`, `config/`, `styles/` |
| Componentización | `Modal`, `ConfirmDialog`, `Pagination`, `StatusBadge`, `PedidoForm`, `PedidoPicker`, `Sidebar`, `Navbar`, `RutaMapa`… |
| Llamadas a API separadas | Todo en `services/`; ningún componente usa `fetch` |
| Manejo de errores visible | `ApiError` con mensajes legibles; alertas en el login, estados de error con "Reintentar", avisos (toast) en el CRUD |
| Validación del login | Antes de enviar (ver criterio 1) |
| Nombres descriptivos | `handleConfirmDelete`, `fetchPedidosFromApi`, `resolveUsernameByEmail`, `sortByNearest`… |
| `.gitignore` | Excluye `node_modules`, `dist`, `.env` |
| Commits descriptivos y frecuentes | Ver `docs/GUIA_COMMITS.md` (14 commits por fase) |

**Importante:** el punto de commits solo cuenta si **cada integrante** los hace con su propio usuario de GitHub y se refleja el avance real. La guía es un plan; lo que se evalúa es el historial que ustedes generen.

## Pendientes que dependen de ustedes
- Comparar las pantallas con su mockup de Figma de la Actividad 7 y ajustar lo que difiera (el diseño se hizo sin verlo).
- Ejecutar el proyecto antes de entregar y probar los casos de arriba.
