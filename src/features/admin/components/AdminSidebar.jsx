import { Link, NavLink, useNavigate } from 'react-router-dom';

const linkClass = ({ isActive }) => `sb__link${isActive ? ' sb__link--active' : ''}`;

const ICON_PROPS = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
};

function AdminSidebar({ adminUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    navigate('/login', { replace: true });
  };

  const initials = adminUser
    ? `${(adminUser.firstName || 'A').charAt(0)}${(adminUser.lastName || '').charAt(0)}`.toUpperCase()
    : 'A';

  return (
    <aside className="sb">
      <div className="sb__top">
        <Link to="/" className="sb__brand">HABITARA</Link>
        <span className="sb__role">Panel de administrador</span>
      </div>

      <nav className="sb__nav">
        <NavLink to="/admin/stats" className={linkClass}>
          <span className="sb__icon">
            <svg {...ICON_PROPS}>
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </span>
          Estadísticas
        </NavLink>

        <NavLink to="/admin/landlord-requests" className={linkClass}>
          <span className="sb__icon">
            <svg {...ICON_PROPS}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          Solicitudes
        </NavLink>

        <NavLink to="/admin/reservations" className={linkClass}>
          <span className="sb__icon">
            <svg {...ICON_PROPS}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          Reservas
        </NavLink>

        <NavLink to="/" end className={linkClass}>
          <span className="sb__icon">
            <svg {...ICON_PROPS}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          Ir al inicio
        </NavLink>
      </nav>

      <div className="sb__divider" />

      <div className="sb__footer">
        <div className="sb__user">
          <span className="sb__avatar">{initials}</span>
          <div className="sb__user-info">
            <span className="sb__user-name">{adminUser?.firstName || 'Admin'} {adminUser?.lastName || ''}</span>
            <span className="sb__user-email">{adminUser?.email || ''}</span>
          </div>
        </div>
        <button type="button" className="sb__logout" onClick={handleLogout} title="Cerrar sesión">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
