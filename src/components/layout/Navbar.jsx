import { useAuth } from '../../context/AuthContext.jsx';
import { useLogistica } from '../../context/LogisticaContext.jsx';
import { formatDateLong, todayISO } from '../../utils/format.js';
import Icon from '../ui/Icon.jsx';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { sync } = useLogistica();

  return (
    <header className="navbar">
      <button type="button" className="icon-button navbar-menu" onClick={onMenuClick} aria-label="Abrir menú">
        <Icon name="menu" />
      </button>
      <p className="navbar-date">{formatDateLong(todayISO())}</p>
      <span className={`sync-pill sync-pill-${sync.status}`} title={sync.message}>
        {{ local: 'Datos solo en este navegador', saving: 'Guardando…', saved: 'Datos en línea', error: 'Error al sincronizar' }[sync.status]}
      </span>
      <div className="navbar-user">
        <img src={user.image} alt={`Foto de perfil de ${user.firstName}`} className="avatar" />
        <div className="navbar-user-text">
          <strong>{user.firstName} {user.lastName}</strong>
          <span>@{user.username}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
          <Icon name="logout" size={16} /> Cerrar sesión
        </button>
      </div>
    </header>
  );
}
