import { ApiError, requestJson } from './http.js';

// JSONBlob: API pública y gratuita para guardar un documento JSON (sin cuenta ni API key).
// Aquí se guardan vehículos, recorridos y los cambios a los pedidos, para que no dependan de un navegador.
const BASE_URL = 'https://jsonblob.com/api/jsonBlob';
const ACCEPT_JSON = { Accept: 'application/json' };

// POST: crea un documento nuevo. El identificador viene en la cabecera Location.
export async function createWorkspaceRequest(data) {
  let response;
  try {
    response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ACCEPT_JSON },
      body: JSON.stringify(data),
    });
  } catch {
    throw new ApiError('No se pudo conectar con JSONBlob. Revisa tu conexión a internet.', 0);
  }
  if (!response.ok) throw new ApiError(`JSONBlob no pudo crear el espacio (código ${response.status}).`, response.status);

  const location = response.headers.get('Location') || response.headers.get('X-jsonblob');
  const id = location ? location.split('/').pop() : '';
  if (!id) {
    throw new ApiError(
      'El espacio se creó, pero el navegador no pudo leer su identificador. Créalo con la colección de Bruno (carpeta 6) y pega el ID en "Conectar".',
      0,
    );
  }
  return id;
}

// GET: lee el documento.
export const readWorkspaceRequest = (id) => requestJson(`${BASE_URL}/${id}`, { headers: ACCEPT_JSON });

// PUT: reemplaza el documento completo.
export const saveWorkspaceRequest = (id, data) =>
  requestJson(`${BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: ACCEPT_JSON });
