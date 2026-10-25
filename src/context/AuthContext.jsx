import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginRequest, resolveUsernameByEmail } from '../services/authService.js';
import { ApiError } from '../services/http.js';

const AuthContext = createContext(null);
const SESSION_KEY = 'rutaoax_session';

function readStoredSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // El usuario vive en el estado de la app (useState). sessionStorage solo evita
  // perder la sesión al recargar la pestaña; se borra al cerrarla.
  const [user, setUser] = useState(readStoredSession);
  // Si hay una sesión guardada, se valida su token con la API antes de mostrar el sistema.
  const [validating, setValidating] = useState(() => Boolean(readStoredSession()));

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  useEffect(() => {
    if (!validating) return undefined;
    let cancelled = false;
    fetchCurrentUser(user.token)
      .catch((err) => {
        // Token vencido o inválido: se cierra la sesión. Un fallo de red no la cierra.
        if (err.status === 401 || err.status === 403) logout();
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (identifier, password) => {
    const username = identifier.includes('@') ? await resolveUsernameByEmail(identifier) : identifier;
    if (!username) throw new ApiError('Usuario o contraseña incorrectos.', 400);

    const data = await loginRequest(username, password);
    const sessionUser = {
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      image: data.image,
      token: data.accessToken,
    };
    setUser(sessionUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  }, []);

  const value = useMemo(() => ({ user, validating, login, logout }), [user, validating, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
