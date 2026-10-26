import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LoadingState } from '../ui/Feedback.jsx';

// Si no hay usuario en el estado, no se muestra el sistema: se manda al login
// y se recuerda la página que se quería abrir para volver después de entrar.
export default function ProtectedRoute() {
  const { user, validating } = useAuth();
  const location = useLocation();
  if (validating) return <LoadingState text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
