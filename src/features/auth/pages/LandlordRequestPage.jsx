import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

import { API_URL } from '../../../config.js';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.35-9.22-8.06C1.66 9.57 3.22 5.5 7.28 5.5c2.06 0 3.24 1.09 4.1 2.22.86-1.13 2.04-2.22 4.1-2.22 4.06 0 5.62 4.07 4.5 6.94C19.5 16.15 12 20.5 12 20.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LandlordRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [form, setForm] = useState({
    educationLevel: 'Secundaria',
    city: '',
    address: '',
    description: '',
    documentsSummary: '',
    nationalId: '',
    criminalRecordStatus: 'No registrado',
    termsAccepted: false,
    idDocumentPhoto: '',
    criminalRecordDocument: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [existingRequest, setExistingRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    const storedUser = localStorage.getItem('habitara_user');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    setLoadingUser(false);
  }, [navigate]);

  useEffect(() => {
    const fetchRequest = async () => {
      setLoadingRequest(true);
      setError('');

      try {
        const token = localStorage.getItem('habitara_token');
        const response = await fetch(`${API_URL}/landlord-requests/mine`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Error al cargar la solicitud existente');
        }

        const requestData = data.data || null;
        setExistingRequest(requestData);

        // Si la solicitud fue aprobada, refrescamos los datos del usuario
        // para actualizar el rol en localStorage (tenant → landlord)
        if (requestData?.status === 'approved') {
          try {
            const meResponse = await fetch(`${API_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const meData = await meResponse.json();
            if (meResponse.ok && meData.success && meData.data) {
              const storedUser = JSON.parse(localStorage.getItem('habitara_user') || '{}');
              const updatedUser = { ...storedUser, ...meData.data };
              localStorage.setItem('habitara_user', JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
          } catch {
            // No es crítico; el usuario puede refrescar manualmente
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingRequest(false);
      }
    };

    fetchRequest();
  }, []);



  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const file = files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/') && name === 'idDocumentPhoto') {
      setError('La foto de la cédula debe ser una imagen.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar los 5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      setForm((prev) => ({ ...prev, [name]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/', { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nationalId.trim()) {
      setError('Debes ingresar tu número de cédula.');
      return;
    }

    if (!form.idDocumentPhoto) {
      setError('Debes adjuntar una foto de tu cédula.');
      return;
    }

    if (!form.termsAccepted) {
      setError('Debes aceptar los términos y condiciones para continuar.');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('habitara_token');
      const response = await fetch(`${API_URL}/landlord-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          propertyTitle: `Solicitud de arrendador - ${form.educationLevel}`,
          propertyType: 'Residencial',
          city: form.city,
          address: form.address,
          description: form.description,
          documentsSummary: form.documentsSummary,
          nationalId: form.nationalId,
          educationLevel: form.educationLevel,
          criminalRecordStatus: form.criminalRecordStatus,
          termsAccepted: form.termsAccepted,
          idDocumentPhoto: form.idDocumentPhoto,
          criminalRecordDocument: form.criminalRecordDocument
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo enviar la solicitud');
      }

      setSuccess('Tu solicitud fue agregada con éxito y queda en espera de aprobación por parte de HABITARA S.A.S.');
      setExistingRequest({
        id: data.data?.id,
        status: 'pending',
        adminNote: null,
        createdAt: new Date().toISOString()
      });
      setShowSuccessModal(true);
      setForm({
        educationLevel: 'Secundaria',
        city: '',
        address: '',
        description: '',
        documentsSummary: '',
        nationalId: '',
        criminalRecordStatus: 'No registrado',
        termsAccepted: false,
        idDocumentPhoto: '',
        criminalRecordDocument: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser || loadingRequest) {
    return <div className="container page-detail-loading">Cargando...</div>;
  }

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>

          <div className="catalog-actions">
            {user && (
              <>
                <Link to="/favorites" className="icon-action" title="Mis favoritos" aria-label="Mis favoritos">
                  <HeartIcon />
                </Link>

                <UserMenu user={user} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="auth-shell">
        <div className="auth-card request-card">
          <div className="request-card__header">
            <span className="eyebrow">Solicitud de arrendador</span>
            <h1>Únete a HABITARA</h1>
            <h2>Comparte tus datos personales, nivel de estudio y ciudad de residencia para iniciar el proceso de revisión por parte de HABITARA S.A.S. La información suministrada será verificada antes de autorizarte para publicar y administrar alojamientos.</h2>
          </div>

          {error && <p className="error-message">{error}</p>}

          {existingRequest ? (
            <section className="request-status">
              <span className={`request-status__badge request-status__badge--${existingRequest.status}`}>
                {existingRequest.status === 'approved' ? 'Aprobada' : existingRequest.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
              </span>
              <h2>
                {existingRequest.status === 'approved'
                  ? 'Tu solicitud fue aprobada'
                  : existingRequest.status === 'rejected'
                    ? 'Tu solicitud fue rechazada'
                    : 'Tu solicitud está en revisión'}
              </h2>
              <p>
                {existingRequest.status === 'approved'
                  ? 'Ya puedes publicar y administrar alojamientos en HABITARA.'
                  : existingRequest.status === 'rejected'
                    ? 'HABITARA no aprobó tu solicitud en este momento.'
                    : 'HABITARA S.A.S. está revisando tu información. Puedes volver más tarde para consultar el estado.'}
              </p>
              {existingRequest.adminNote && (
                <div className="request-status__note">
                  <strong>Mensaje de revisión</strong>
                  <span>{existingRequest.adminNote}</span>
                </div>
              )}
              {existingRequest.status === 'approved' && (
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Link to="/dashboard/listings/new" className="primary-btn">
                    Publicar mi primer alojamiento
                  </Link>
                  <Link to="/dashboard" className="secondary-btn">
                    Ir al panel de arrendador
                  </Link>
                </div>
              )}
            </section>
          ) : (
            <>
          <form onSubmit={handleSubmit} className="auth-form request-form">
            <div className="request-form__section-header">
              <span>01</span>
              <div>
                <h3>Información personal y residencial</h3>
                <p>Datos básicos del usuario que solicita convertirse en arrendador.</p>
              </div>
            </div>

            <div className="request-form__grid">
              <div className="request-form__field">
                <label htmlFor="educationLevel">Nivel de estudio</label>
                <select id="educationLevel" name="educationLevel" value={form.educationLevel} onChange={handleChange}>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Tecnólogo">Tecnólogo</option>
                  <option value="Universitario">Universitario</option>
                  <option value="Posgrado">Posgrado</option>
                </select>
              </div>

              <div className="request-form__field">
                <label htmlFor="city">Ciudad de residencia</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Ej. Bogotá"
                  required
                />
              </div>
            </div>

            <div className="request-form__field request-form__field--full">
              <label htmlFor="address">Dirección de residencia</label>
              <input
                id="address"
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Dirección donde resides"
                required
              />
            </div>

            <div className="request-form__section-header">
              <span>02</span>
              <div>
                <h3>Verificación personal y de seguridad</h3>
                <p>Documentos e información utilizados para verificar tu identidad.</p>
              </div>
            </div>

            <div className="request-form__grid">
              <div className="request-form__field">
                <label htmlFor="nationalId">Número de cédula</label>
                <input
                  id="nationalId"
                  type="text"
                  name="nationalId"
                  value={form.nationalId}
                  onChange={handleChange}
                  placeholder="Ej. 1020304050"
                  required
                />
              </div>

              <div className="request-form__field">
                <label htmlFor="criminalRecordStatus">Antecedentes penales</label>
                <select id="criminalRecordStatus" name="criminalRecordStatus" value={form.criminalRecordStatus} onChange={handleChange}>
                  <option value="No registrado">No registrado</option>
                  <option value="Registrado">Registrado</option>
                  <option value="Pendiente de consulta">Pendiente de consulta</option>
                </select>
              </div>
            </div>

            <div className="request-form__grid">
              <div className="request-form__field">
                <label htmlFor="idDocumentPhoto">Foto de la cédula</label>
                <input
                  id="idDocumentPhoto"
                  type="file"
                  name="idDocumentPhoto"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>

              <div className="request-form__field">
                <label htmlFor="criminalRecordDocument">Certificado de antecedentes <span>(opcional)</span></label>
                <input
                  id="criminalRecordDocument"
                  type="file"
                  name="criminalRecordDocument"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="request-form__field request-form__field--full">
              <label htmlFor="description">Experiencia o información adicional</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe brevemente tu experiencia como arrendador"
                required
              />
            </div>

            <div className="request-form__field">
              <label>
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onChange={handleChange}
                  required
                />
                Acepto los términos y condiciones
              </label>
            </div>

            <button type="submit" className="request-form__submit" disabled={submitting}>
              {submitting ? 'Enviando solicitud...' : 'Enviar solicitud'}
            </button>
          </form>
            </>
          )}

          <p className="auth-link">
            <Link to="/">Volver al inicio</Link>
          </p>
        </div>

        {showSuccessModal && (
          <div className="auth-modal" role="dialog" aria-modal="true">
            <div className="auth-modal__card">
              <h3>Solicitud enviada</h3>
              <p>{success}</p>
              <div className="modal-actions">
                <button type="button" className="primary-btn" onClick={handleCloseSuccessModal}>
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LandlordRequestPage;
