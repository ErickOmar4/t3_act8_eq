import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Panel general', icon: 'home', end: true },
  { to: '/pedidos', label: 'Pedidos', icon: 'package' },
  { to: '/vehiculos', label: 'Vehículos', icon: 'truck' },
  { to: '/recorridos', label: 'Recorridos por día', icon: 'clipboard' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="sidebar-scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#2A3A5E" />
            <path d="M14 46 C24 46 22 24 32 24 S42 18 50 18" fill="none" stroke="#E0A526" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 8" />
            <circle cx="14" cy="46" r="6" fill="#fff" />
            <circle cx="50" cy="18" r="6" fill="#4CB59B" />
          </svg>
          <div>
            <strong>RutaOax</strong>
            <span>Entregas en Oaxaca</span>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-footer">Mapas © OpenStreetMap · Datos de prueba DummyJSON</p>
      </aside>
    </>
  );
}
