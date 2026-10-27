# Guía de commits: cómo se construye este proyecto paso a paso

El orden sigue las **dependencias**: primero lo que no depende de nada (configuración, utilidades, servicios),
luego el estado, luego la interfaz y al final las pantallas que usan todo lo anterior.
Así cada commit se apoya en los anteriores y el proyecto va creciendo sin romperse.

> Los comandos se ejecutan desde la carpeta raíz del proyecto (`rutaoax-logistica/`).
> Se reparten entre **Integrante A** y **Integrante B**; cada quien hace sus commits con su propio usuario de Git.

## Preparación (una sola vez)

```bash
git init -b main
git config user.name "Tu nombre"            # cada integrante, en su computadora
git config user.email "correo-de-tu-github@ejemplo.com"
git remote add origin https://github.com/TU-USUARIO/rutaoax-logistica.git
```

Antes de subir, revisa con `git status` que **no aparezca `node_modules/`** (el `.gitignore` lo excluye).
Para trabajar en equipo: uno crea el repositorio, agrega al otro como colaborador (Settings → Collaborators)
y antes de cada `git push` ambos hacen `git pull --rebase origin main`.

## Tabla de commits

| # | Quién | Preparar archivos | Mensaje del commit |
|---|---|---|---|
| 1 | A | `git add package.json vite.config.js index.html .gitignore .env.example public README.md` | `git commit -m "chore: proyecto base con Vite, React y .gitignore"` |
| 2 | A | `git add src/config src/utils` | `git commit -m "feat(config): constantes, datos de respaldo y utilidades de fechas, distancias y storage"` |
| 3 | A | `git add src/services/http.js src/services/authService.js` | `git commit -m "feat(api): cliente HTTP con errores legibles y servicio de login con DummyJSON"` |
| 4 | A | `git add src/context/ToastContext.jsx src/context/AuthContext.jsx` | `git commit -m "feat(estado): contexto de sesión con useState y avisos toast"` |
| 5 | A | `git add src/styles src/components/ui ':!src/components/ui/WorkspaceCard.jsx'` | `git commit -m "feat(ui): estilos base y componentes reutilizables (modal, paginación, estados)"` |
| 6 | A | `git add src/pages/LoginPage.jsx src/main.jsx src/App.jsx` | `git commit -m "feat(login): pantalla de login con validaciones y manejo de errores"` |
| 7 | B | `git add src/services/pedidosService.js src/services/geocodingService.js src/services/routingService.js src/services/storageService.js` | `git commit -m "feat(api): servicios de pedidos, geocodificación con Nominatim, rutas con OSRM y datos en línea con JSONBlob"` |
| 8 | B | `git add src/context/LogisticaContext.jsx` | `git commit -m "feat(estado): contexto de pedidos, vehículos y recorridos con guardado en JSONBlob"` |
| 9 | A | `git add src/components/layout src/components/auth src/components/ui/WorkspaceCard.jsx src/pages/DashboardPage.jsx src/pages/NotFoundPage.jsx src/App.jsx` | `git commit -m "feat(layout): sidebar, navbar con datos del usuario y rutas protegidas"` |
| 10 | B | `git add src/components/pedidos/PedidoForm.jsx src/pages/PedidosPage.jsx src/App.jsx` | `git commit -m "feat(pedidos): tabla con filtros, paginación en la URL y CRUD con confirmaciones"` |
| 11 | A | `git add src/components/vehiculos src/pages/VehiculosPage.jsx src/App.jsx` | `git commit -m "feat(vehiculos): registro de vehículos con repartidor asignado"` |
| 12 | B | `git add src/components/pedidos/PedidoPicker.jsx src/components/recorridos/RecorridoForm.jsx src/pages/RecorridosPage.jsx src/App.jsx` | `git commit -m "feat(recorridos): agenda por día y creación de recorridos con orden por cercanía"` |
| 13 | B | `git add src/components/recorridos/RutaMapa.jsx src/pages/RecorridoDetallePage.jsx src/App.jsx` | `git commit -m "feat(mapa): detalle del recorrido, cambio de estados y ruta en mapa de Oaxaca"` |
| 14 | A y B | `git add docs bruno README.md` | `git commit -m "docs: documentación, colección de Bruno y justificación de la rúbrica"` |

Después de cada commit (o al terminar cada fase): `git push -u origin main` la primera vez y `git push` las siguientes.
Con `git log --oneline` verifican que el historial se vea así y que cada uno aparezca como autor de los suyos.

## Qué se sube en cada commit, por qué y cómo se conecta

| # | Qué se sube | Por qué en este punto | Cómo interactúa con lo anterior y lo siguiente |
|---|---|---|---|
| 1 | `package.json` (React, Router, Leaflet, Vite), `vite.config.js`, `index.html`, `.gitignore`, favicon, README | Es el esqueleto: sin esto no se puede instalar ni ejecutar nada. El `.gitignore` va primero para no subir `node_modules` por accidente | Todo lo demás depende de estas dependencias. El `index.html` carga `src/main.jsx` (commit 6) |
| 2 | `config/constants.js` (depósito, estados, tipos de vehículo) y `config/fallbackData.js` (datos de respaldo) y `utils/` (`format`, `geo`, `storage`) | Son funciones y datos puros, sin React ni red; no dependen de nada y casi todo lo usará | `geo.js` es el respaldo de `geocodingService` y `routingService` (7); `format.js` las pantallas; `storage.js` el contexto (8) |
| 3 | `services/http.js` (`requestJson`, `ApiError`) y `authService.js` (login, buscar por correo, validar la sesión) | Las llamadas a la API se separan de los componentes desde el inicio | Lo usa `AuthContext` (4). `http.js` lo reutilizarán `pedidosService` y `routingService` (7) |
| 4 | `ToastContext` (avisos) y `AuthContext` (usuario en `useState`, `login`, `logout` y validación del token con `/auth/me`) | La sesión es global: la necesitan el login, la ruta protegida y el navbar | `AuthContext` llama a `authService` (3). `LoginPage` (6), `ProtectedRoute` y `Navbar` (9) lo consumen. Los toasts los usarán todas las acciones del CRUD |
| 5 | `styles/theme.css` y `app.css`, y `components/ui` (Icon, Modal, ConfirmDialog, StatusBadge, Feedback, ProgressBar, Pagination) | Piezas visuales reutilizables que se construyen una vez y se usan en todas las pantallas | El login (6) usa `Icon`; el CRUD (10) usa Modal, ConfirmDialog y Pagination. Los estilos dan identidad a todo lo posterior |
| 6 | `LoginPage`, `main.jsx` (providers + router) y un `App.jsx` temporal (ver abajo) | Cierra la **Fase 1**; ya se puede ejecutar y probar el login completo | Une 3, 4 y 5. `main.jsx` envuelve la app con Router, Toast y Auth. `App.jsx` se irá ampliando en los commits 9 a 13 |
| 7 | `pedidosService` (carritos, clientes, CRUD y estados con DummyJSON), `geocodingService` (Nominatim), `routingService` (OSRM) y `storageService` (JSONBlob) | Antes del estado hay que tener claro cómo se obtienen y modifican los datos | Convierte carritos en pedidos con calles reales de Nominatim. Los llaman `LogisticaContext` (8: pedidos y JSONBlob), `PedidosPage` (10: geocodificación) y `RecorridoForm` y `RutaMapa` (12 y 13: OSRM) |
| 8 | `LogisticaContext` (pedidos, vehículos, recorridos, datos derivados, guardado en JSONBlob y respaldo en `localStorage`) | Es el corazón: relaciona pedidos, vehículos y recorridos. Va antes de las pantallas porque todas lo consumen | Usa `pedidosService` y `storageService` (7) y `storage`/`format` (2). Páginas de 9 a 13 leen y modifican este estado |
| 9 | `Sidebar`, `Navbar`, `AppLayout`, `ProtectedRoute`, `DashboardPage`, `NotFoundPage`, `App.jsx` con rutas protegidas | Cierra la **Fase 2**: ya hay sistema con menú, datos del usuario y protección | `ProtectedRoute` lee `AuthContext` (4); `AppLayout` monta `LogisticaProvider` (8) para que solo se pidan datos tras iniciar sesión |
| 10 | `PedidoForm`, `PedidosPage` y su ruta | Cierra la **Fase 3**: tabla, filtros, paginación en URL y CRUD | Usa `pedidosService` y `geocodingService` (7), el estado (8), `Modal`/`ConfirmDialog`/`Pagination` (5) y toasts (4). Muestra a qué recorrido está asignado cada pedido, lo que cobra sentido en 12 |
| 11 | `VehiculoForm`, `VehiculosPage` y su ruta | Hay que registrar vehículos antes de poder asignarles recorridos | Alimenta la lista de vehículos del estado (8). Los chips de "próximos recorridos" enlazan al detalle (13) |
| 12 | `PedidoPicker`, `RecorridoForm`, `RecorridosPage` y su ruta | Es el punto que **relaciona** pedidos con vehículos y fechas | Toma pedidos sin asignar (10) y vehículos (11), ordena con la API de OSRM (`optimizeStops`, 7) y crea el recorrido en el estado (8) |
| 13 | `RutaMapa`, `RecorridoDetallePage` y su ruta | Último paso funcional: ejecutar el recorrido y verlo en el mapa | Lee las paradas del recorrido (12), cambia estados que se reflejan en el panel (9) y en la tabla (10), y usa `routingService` (7) |
| 14 | `docs/`, `bruno/` y README final | Se documenta cuando todo funciona | Explica 1 a 13: rúbrica, APIs y pruebas en Bruno |

## `App.jsx` por etapas

`App.jsx` es el único archivo que se modifica en varios commits, porque cada pantalla nueva agrega su ruta.
Los archivos del zip ya traen la **versión final**; para ir commit por commit, haz esto:

**Commit 6: versión temporal** (reemplaza el contenido de `src/App.jsx` antes de hacer `git add`):

```jsx
import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import { useAuth } from './context/AuthContext.jsx';

function Bienvenida() {
  const { user, logout } = useAuth();
  return (
    <p style={{ padding: 24 }}>
      Sesión iniciada como {user?.firstName}. <button onClick={logout}>Salir</button>
    </p>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Bienvenida />} />
    </Routes>
  );
}
```

**Commit 9: estructura con sistema protegido** (reemplaza la versión anterior):

```jsx
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

**Commits 10 a 13:** en cada uno agrega el `import` de la página y su `<Route>` **antes** de la ruta `path="*"`:

| Commit | Import | Ruta |
|---|---|---|
| 10 | `import PedidosPage from './pages/PedidosPage.jsx';` | `<Route path="pedidos" element={<PedidosPage />} />` |
| 11 | `import VehiculosPage from './pages/VehiculosPage.jsx';` | `<Route path="vehiculos" element={<VehiculosPage />} />` |
| 12 | `import RecorridosPage from './pages/RecorridosPage.jsx';` | `<Route path="recorridos" element={<RecorridosPage />} />` |
| 13 | `import RecorridoDetallePage from './pages/RecorridoDetallePage.jsx';` | `<Route path="recorridos/:recorridoId" element={<RecorridoDetallePage />} />` |

Al terminar el commit 13, tu `App.jsx` queda igual a la versión final del zip.

## Dos consejos para que el historial se vea profesional

- **Un commit por idea.** El commit 10 junta tabla, filtros, paginación y CRUD porque están en un solo archivo.
  Si quieren separarlo, usen `git add -p src/pages/PedidosPage.jsx` y elijan por bloques qué entra en cada commit
  (por ejemplo, la tabla y los filtros primero, y las funciones `handleCreate`, `handleConfirmEdit` y `handleConfirmDelete` después).
- **Probar antes de commitear.** Corran `npm run dev` y revisen en el navegador lo que acaban de agregar.
  Si algo falla, corrijan antes del commit; si se corrige después, usen `fix: ...` en vez de mezclar.

## Prefijos usados (convención *Conventional Commits*)

`chore` configuración · `feat` funcionalidad nueva · `fix` corrección · `docs` documentación · `refactor` reorganizar sin cambiar el comportamiento · `style` solo estilos.
