import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';


import { API_URL } from '../../../config.js';

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    if (token) navigate('/', { replace: true });
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Error al iniciar sesión');
      localStorage.setItem('habitara_token', data.data.token);
      localStorage.setItem('habitara_user', JSON.stringify(data.data.user));
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-topbar__brand">HABITARA</Link>
      </header>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card__head">
            <h1>Bienvenido de nuevo</h1>
            <p>Inicia sesión para continuar</p>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Correo electrónico</label>
              <input
                type="email"
                name="email"
                placeholder="tu@correo.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="auth-link">
            ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
