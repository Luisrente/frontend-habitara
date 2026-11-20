import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';

const navItems = [
  {
    to: '/dashboard',
    end: true,
    label: 'Inicio',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    to: '/dashboard/listings',
    label: 'Mis alojamientos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    to: '/dashboard/reservations',
    label: 'Reservas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
];

function Layout() {
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('habitara_user') || 'null'); }
    catch { return null; }
  })();

  const initials = user
    ? `${(user.firstName || 'A').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase()
    : 'A';

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sb">
        {/* Brand */}
        <div className="sb__top">
          <Link to="/" className="sb__brand">HABITARA</Link>
          <span className="sb__role">Panel de arrendador</span>
        </div>

        {/* Nav */}
        <nav className="sb__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sb__link${isActive ? ' sb__link--active' : ''}`}
            >
              <span className="sb__icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Publicar CTA */}
        <Link to="/dashboard/listings/new" className="sb__publish">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Publicar alojamiento
        </Link>

        {/* Divider */}
        <div className="sb__divider" />

        {/* Footer: user + logout */}
        <div className="sb__footer">
          <div className="sb__user">
            <span className="sb__avatar">{initials}</span>
            <div className="sb__user-info">
              <span className="sb__user-name">{user?.firstName || 'Arrendador'} {user?.lastName || ''}</span>
              <span className="sb__user-email">{user?.email || ''}</span>
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

      <main className="sb__main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
