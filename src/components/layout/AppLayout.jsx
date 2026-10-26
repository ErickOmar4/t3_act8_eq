import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LogisticaProvider } from '../../context/LogisticaContext.jsx';
import Sidebar from './Sidebar.jsx';
import Navbar from './Navbar.jsx';

// Estructura del sistema una vez iniciada la sesión: sidebar + navbar + contenido.
export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LogisticaProvider>
      <div className="app-shell">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-main">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    </LogisticaProvider>
  );
}
