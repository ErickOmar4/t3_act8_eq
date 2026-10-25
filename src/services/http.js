// Cliente HTTP mínimo: traduce los fallos de red y de la API a mensajes legibles.
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function requestJson(url, options = {}) {
  const headers = options.body ? { 'Content-Type': 'application/json' } : {};
  let response;
  try {
    response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.', 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // La respuesta no tiene cuerpo JSON.
  }

  if (!response.ok) {
    throw new ApiError(data?.message || `La solicitud falló (código ${response.status}).`, response.status, data);
  }
  return data;
}
