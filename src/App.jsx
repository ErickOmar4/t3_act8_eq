import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PedidosPage from './pages/PedidosPage.jsx';
import VehiculosPage from './pages/VehiculosPage.jsx';
import RecorridosPage from './pages/RecorridosPage.jsx';
import RecorridoDetallePage from './pages/RecorridoDetallePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Todo lo que está dentro de ProtectedRoute exige sesión iniciada */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<PedidosPage />} />
          <Route path="vehiculos" element={<VehiculosPage />} />
          <Route path="recorridos" element={<RecorridosPage />} />
          <Route path="recorridos/:recorridoId" element={<RecorridoDetallePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
