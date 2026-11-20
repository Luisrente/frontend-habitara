import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('habitara_token');

  // Leer el rol del caché local como valor inicial
  let cachedRole = null;
  try {
    const u = JSON.parse(localStorage.getItem('habitara_user') || 'null');
    cachedRole = u?.role || null;
  } catch {
    cachedRole = null;
  }

  const [role, setRole] = useState(cachedRole);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    // Verificar el rol real desde el backend para evitar que un usuario
    // con solicitud aprobada quede bloqueado por el caché desactualizado
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const cached = JSON.parse(localStorage.getItem('habitara_user') || '{}');
          const updated = { ...cached, ...data.data };
          localStorage.setItem('habitara_user', JSON.stringify(updated));
          setRole(data.data.role || null);
        } else {
          setRole(null);
        }
      })
      .catch(() => {
        // Si falla la red, usar el rol en caché
        setRole(cachedRole);
      })
      .finally(() => setChecking(false));
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    // Mientras verifica, mostrar el contenido si el caché ya dice landlord,
    // o una pantalla de carga si el caché no dice nada todavía
    if (cachedRole === 'landlord') return children;
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Verificando acceso...</div>;
  }

  if (role !== 'landlord') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
