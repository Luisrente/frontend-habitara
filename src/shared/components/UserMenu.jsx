import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

/**
 * UserMenu — componente reutilizable de perfil con menú desplegable.
 *
 * Props:
 *  - user       {object}   Datos del usuario. Si no se pasa, los lee del localStorage.
 *  - onLogout   {function} Callback opcional. Si se pasa, reemplaza el logout por defecto.
 *                          Útil para páginas que necesitan limpiar estado local al salir.
 */
function UserMenu({ user: userProp, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Si no recibe user por prop, leer del localStorage
  const user = userProp ?? (() => {
    try { return JSON.parse(localStorage.getItem('habitara_user') || 'null'); }
    catch { return null; }
  })();

  // Cerrar al hacer clic fuera del menú
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cerrar al navegar
  useEffect(() => { setOpen(false); }, [location.pathname]);

  if (!user) return null;

  const role = (user.role || '').toLowerCase();
  const initial = (user.firstName || 'U').charAt(0).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('habitara_token');
      localStorage.removeItem('habitara_user');
      navigate('/login', { replace: true });
    }
  };

  const close = () => setOpen(false);
  const isOnAccount = location.pathname === '/account';

  return (
    <div className="um-root" ref={ref}>
      <button
        type="button"
        className="um-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="um-avatar">{initial}</span>
        <span className="um-name">{user.firstName || 'Usuario'}</span>
        <svg
          className={`um-caret${open ? ' um-caret--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="um-dropdown" role="menu">
          {/* Info del usuario */}
          <div className="um-dropdown__header">
            <span className="um-dropdown__name">
              {user.firstName} {user.lastName}
            </span>
            {user.email && (
              <span className="um-dropdown__email">{user.email}</span>
            )}
          </div>

          <div className="um-dropdown__divider" />

          {/* Navegación */}
          {!isOnAccount && (
            <Link to="/account" className="um-dropdown__item" onClick={close} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Mi cuenta
            </Link>
          )}

          {role === 'landlord' && (
            <Link to="/dashboard" className="um-dropdown__item" onClick={close} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Panel de arrendador
            </Link>
          )}

          {role === 'landlord' && (
            <Link to="/dashboard/listings/new" className="um-dropdown__item" onClick={close} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Publicar alojamiento
            </Link>
          )}

          {role === 'admin' && (
            <Link to="/admin/landlord-requests" className="um-dropdown__item" onClick={close} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Panel de administrador
            </Link>
          )}

          {role === 'tenant' && (
            <Link to="/become-landlord" className="um-dropdown__item" onClick={close} role="menuitem">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Convertirme en arrendador
            </Link>
          )}

          <div className="um-dropdown__divider" />

          {/* Cerrar sesión */}
          <button
            type="button"
            className="um-dropdown__item um-dropdown__item--danger"
            onClick={handleLogout}
            role="menuitem"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
