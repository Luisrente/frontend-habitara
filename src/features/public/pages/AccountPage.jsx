import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

import { API_URL } from '../../../config.js';

function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    const storedUser = localStorage.getItem('habitara_user');

    if (!token || !storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    let parsedUser = null;
    try {
      parsedUser = JSON.parse(storedUser);
    } catch {
      navigate('/login', { replace: true });
      return;
    }

    // Mostrar los datos guardados de inmediato para no bloquear la UI
    setUser(parsedUser);
    setForm({
      firstName: parsedUser.firstName || '',
      lastName: parsedUser.lastName || '',
      email: parsedUser.email || '',
      phone: parsedUser.phone || ''
    });

    // Refrescar desde el backend para que el rol siempre esté actualizado
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const updatedUser = { ...parsedUser, ...data.data };
          localStorage.setItem('habitara_user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setForm({
            firstName: updatedUser.firstName || '',
            lastName: updatedUser.lastName || '',
            email: updatedUser.email || '',
            phone: updatedUser.phone || ''
          });
        }
      })
      .catch(() => {/* no-op; usamos los datos en caché */});
  }, [navigate]);



  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = localStorage.getItem('habitara_token');
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo actualizar tu información');
      }

      const updatedUser = {
        ...user,
        ...data.data,
        firstName: data.data.firstName,
        lastName: data.data.lastName,
        email: data.data.email,
        phone: data.data.phone
      };

      localStorage.setItem('habitara_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccess('Tu información personal se actualizó correctamente.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="container page-detail-loading">Cargando tu cuenta...</div>;
  }

  const roleLabel = user.role === 'landlord' ? 'Arrendador' : user.role === 'admin' ? 'Administrador' : 'Inquilino';
  const userRole = (user.role || '').toLowerCase();

  return (
    <div className="catalog-page account-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>

          <div className="catalog-actions">
            <Link to="/favorites" className="icon-action" title="Mis favoritos" aria-label="Mis favoritos">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.35-9.22-8.06C1.66 9.57 3.22 5.5 7.28 5.5c2.06 0 3.24 1.09 4.1 2.22.86-1.13 2.04-2.22 4.1-2.22 4.06 0 5.62 4.07 4.5 6.94C19.5 16.15 12 20.5 12 20.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link to="/reservations" className="icon-action" title="Mis reservas" aria-label="Mis reservas">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4.5" width="18" height="16.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 2.5v4M16 2.5v4M3 9.5h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Link>
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="container account-main">
        <section className="account-hero">
          <div className="account-hero__avatar">{(user.firstName || 'U').charAt(0)}{(user.lastName || 'S').charAt(0)}</div>
          <div>
            <span className="eyebrow">Perfil</span>
            <h1>{user.firstName || 'Usuario'} {user.lastName || ''}</h1>
            <p>{roleLabel}</p>
          </div>
        </section>

        <div className="account-grid">
          <section className="account-card">
            <div className="account-card__header">
              <h2>Información personal</h2>
              {!isEditing && (
                <button type="button" className="link-button muted" onClick={() => setIsEditing(true)}>
                  Editar información
                </button>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {!isEditing ? (
              <>
                <div className="account-row">
                  <span>Nombre</span>
                  <strong>{user.firstName || 'No disponible'} {user.lastName || ''}</strong>
                </div>
                <div className="account-row">
                  <span>Email</span>
                  <strong>{user.email || 'No disponible'}</strong>
                </div>
                <div className="account-row">
                  <span>Teléfono</span>
                  <strong>{user.phone || 'No registrado'}</strong>
                </div>
                <div className="account-row">
                  <span>Rol</span>
                  <strong>{roleLabel}</strong>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="account-form">
                <div className="two-columns">
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Nombres"
                  />
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Apellidos"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Correo electrónico"
                />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Teléfono"
                />

                <div className="account-form__actions">
                  <button type="button" className="secondary-btn" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="account-card">
            <h2>Acceso rápido</h2>
            <div className="account-actions">
              <Link to="/favorites" className="account-action">Favoritos</Link>
              <Link to="/reservations" className="account-action">Reservas</Link>
              {userRole === 'landlord' && (
                <Link to="/dashboard/listings/new" className="account-action primary">Publicar alojamiento</Link>
              )}
              {userRole === 'tenant' && (
                <Link to="/become-landlord" className="account-action primary">Convertirme en arrendador</Link>
              )}
              {userRole === 'admin' && (
                <Link to="/admin/landlord-requests" className="account-action primary">Solicitudes de arrendador</Link>
              )}
            </div>
          </section>
        </div>

        <section className="account-card account-card--wide">
          <h2>Resumen</h2>
          <div className="stats-grid account-stats">
            <div className="stat-box">
              <span>Alojamientos</span>
              <strong>0</strong>
            </div>
            <div className="stat-box">
              <span>Reservas</span>
              <strong>0</strong>
            </div>
            <div className="stat-box">
              <span>Favoritos</span>
              <strong>0</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AccountPage;
