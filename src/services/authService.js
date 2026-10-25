import { requestJson } from './http.js';

const BASE_URL = 'https://dummyjson.com';

// POST https://dummyjson.com/auth/login
export function loginRequest(username, password) {
  return requestJson(`${BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ username, password, expiresInMins: 60 }),
  });
}

// DummyJSON solo acepta "username". Si la persona escribe un correo, buscamos su usuario.
export async function resolveUsernameByEmail(email) {
  const data = await requestJson(
    `${BASE_URL}/users/filter?key=email&value=${encodeURIComponent(email)}&select=username`,
  );
  return data?.users?.[0]?.username ?? null;
}

// GET /auth/me: comprueba que el token de la sesión siga vigente (dura 60 minutos).
export function fetchCurrentUser(token) {
  return requestJson(`${BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
}
