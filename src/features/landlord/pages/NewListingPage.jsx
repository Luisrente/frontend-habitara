import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

import { API_URL } from '../../../config.js';

const amenityOptions = [
  { id: 1, label: 'WiFi', icon: '📶' },
  { id: 2, label: 'Agua', icon: '💧' },
  { id: 3, label: 'Luz', icon: '💡' },
  { id: 4, label: 'Gas', icon: '🔥' },
  { id: 5, label: 'Amueblado', icon: '🛋️' },
  { id: 6, label: 'Seguridad', icon: '🔒' },
  { id: 7, label: 'Limpieza', icon: '✨' },
  { id: 8, label: 'Cocina', icon: '🍳' }
];

const roomTypeLabels = {
  individual: 'Habitación individual',
  shared: 'Compartida',
  apartment: 'Apartamento',
  pension: 'Pensión completa',
  studio: 'Studio'
};

function NewListingPage() {
  const navigate = useNavigate();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('habitara_user') || 'null'); } catch { return null; }
  })();

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    roomType: 'individual',
    isFurnished: true,
    bedrooms: 1,
    bathrooms: 1,
    maxTenants: 1,
    areaM2: '',
    distanceToUniversityKm: '',
    idealFor: '',
    availableFrom: '',
    availabilityNote: '',
    location: {
      address: '',
      district: '',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'Colombia',
      postalCode: ''
    },
    amenities: [1, 2, 3, 5],
    photos: ['', '', ''],
    rulesText: 'No fumar\nNo mascotas\nHorario de ingreso respetado'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null); // { title }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, location: { ...form.location, [name]: value } });
  };

  const handleAmenityToggle = (id) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((item) => item !== id)
        : [...prev.amenities, id]
    }));
  };

  const handlePhotoChange = (index, value) => {
    setForm((prev) => {
      const next = [...prev.photos];
      next[index] = value;
      return { ...prev, photos: next };
    });
  };

  const addPhotoField = () => setForm((prev) => ({ ...prev, photos: [...prev.photos, ''] }));
  const removePhotoField = (index) =>
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('habitara_token');
      const rules = form.rulesText.split(/\n|;/).map((r) => r.trim()).filter(Boolean);

      const payload = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        roomType: form.roomType,
        isFurnished: form.isFurnished,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        maxTenants: Number(form.maxTenants),
        areaM2: form.areaM2 ? Number(form.areaM2) : null,
        distanceToUniversityKm: form.distanceToUniversityKm ? Number(form.distanceToUniversityKm) : null,
        idealFor: form.idealFor,
        availableFrom: form.availableFrom || null,
        availabilityNote: form.availabilityNote,
        location: form.location,
        amenities: form.amenities,
        photos: form.photos.filter((p) => p && p.trim()).map((p) => ({ url: p })),
        rules
      };

      const response = await fetch(`${API_URL}/accommodations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Error al crear alojamiento');

      setSuccessData({ title: form.title });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nl-page">
      {/* ── Header ── */}
      <header className="nl-header">
        <div className="nl-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>

          <div className="nl-header__user">
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="nl-body">
        <div className="nl-container">

          {/* Page heading */}
          <div className="nl-heading">
            <h1>Nueva publicación</h1>
            <p>Completa la información para publicar tu alojamiento en HABITARA.</p>
          </div>

          {error && (
            <div className="nl-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="nl-form">

            {/* ── Sección 1: Información básica ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">01</span>
                <div>
                  <h2>Información básica</h2>
                  <p>Título, descripción, precio y tipo de alojamiento.</p>
                </div>
              </div>

              <div className="nl-fields">
                <div className="nl-field nl-field--full">
                  <label>Título del anuncio</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Ej: Habitación amoblada cerca de la universidad"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="nl-field nl-field--full">
                  <label>Descripción</label>
                  <textarea
                    name="description"
                    placeholder="Describe el alojamiento, la zona, los servicios, la convivencia..."
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="nl-field">
                  <label>Precio mensual (COP $)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    placeholder="800000"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="nl-field">
                  <label>Tipo de alojamiento</label>
                  <select name="roomType" value={form.roomType} onChange={handleChange}>
                    {Object.entries(roomTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="nl-field">
                  <label>Habitaciones</label>
                  <input type="number" name="bedrooms" min="1" value={form.bedrooms} onChange={handleChange} />
                </div>

                <div className="nl-field">
                  <label>Baños</label>
                  <input type="number" name="bathrooms" min="1" value={form.bathrooms} onChange={handleChange} />
                </div>

                <div className="nl-field">
                  <label>Máx. inquilinos</label>
                  <input type="number" name="maxTenants" min="1" value={form.maxTenants} onChange={handleChange} />
                </div>

                <div className="nl-field nl-field--checkbox">
                  <label className="nl-toggle">
                    <input
                      type="checkbox"
                      name="isFurnished"
                      checked={form.isFurnished}
                      onChange={handleChange}
                    />
                    <span className="nl-toggle__track" />
                    <span className="nl-toggle__label">Amueblado</span>
                  </label>
                </div>
              </div>
            </section>

            {/* ── Sección 2: Ubicación ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">02</span>
                <div>
                  <h2>Ubicación</h2>
                  <p>Dirección, barrio y ciudad en Colombia.</p>
                </div>
              </div>

              <div className="nl-fields">
                <div className="nl-field nl-field--full">
                  <label>Dirección</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Cra. / Cll. / Av. / Transversal"
                    value={form.location.address}
                    onChange={handleLocationChange}
                    required
                  />
                </div>

                <div className="nl-field">
                  <label>Barrio / Localidad</label>
                  <input
                    type="text"
                    name="district"
                    placeholder="Chapinero, Usaquén, La Candelaria..."
                    value={form.location.district}
                    onChange={handleLocationChange}
                    required
                  />
                </div>

                <div className="nl-field">
                  <label>Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Bogotá"
                    value={form.location.city}
                    onChange={handleLocationChange}
                    required
                  />
                </div>

                <div className="nl-field">
                  <label>Departamento</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Cundinamarca"
                    value={form.location.state}
                    onChange={handleLocationChange}
                  />
                </div>

                <div className="nl-field">
                  <label>Código postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="110111"
                    value={form.location.postalCode}
                    onChange={handleLocationChange}
                  />
                </div>
              </div>
            </section>

            {/* ── Sección 3: Servicios ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">03</span>
                <div>
                  <h2>Servicios incluidos</h2>
                  <p>Selecciona todo lo que está incluido en el precio.</p>
                </div>
              </div>

              <div className="nl-amenities">
                {amenityOptions.map((amenity) => {
                  const active = form.amenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      className={`nl-amenity${active ? ' nl-amenity--on' : ''}`}
                      onClick={() => handleAmenityToggle(amenity.id)}
                    >
                      <span>{amenity.icon}</span>
                      {amenity.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Sección 4: Fotos ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">04</span>
                <div>
                  <h2>Fotos</h2>
                  <p>Agrega URLs de imágenes del alojamiento.</p>
                </div>
              </div>

              <div className="nl-photos">
                {form.photos.map((photo, index) => (
                  <div key={index} className="nl-photo-row">
                    <div className="nl-photo-preview">
                      {photo ? (
                        <img src={photo} alt={`Foto ${index + 1}`} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span className="nl-photo-placeholder">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder={`URL de imagen ${index + 1}`}
                      value={photo}
                      onChange={(e) => handlePhotoChange(index, e.target.value)}
                      className="nl-photo-input"
                    />
                    {form.photos.length > 1 && (
                      <button
                        type="button"
                        className="nl-photo-remove"
                        onClick={() => removePhotoField(index)}
                        aria-label="Quitar foto"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="nl-add-photo" onClick={addPhotoField}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar otra foto
                </button>
              </div>
            </section>

            {/* ── Sección 5: Reglas ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">05</span>
                <div>
                  <h2>Reglas del alojamiento</h2>
                  <p>Una regla por línea o separadas por punto y coma.</p>
                </div>
              </div>

              <div className="nl-fields">
                <div className="nl-field nl-field--full">
                  <textarea
                    name="rulesText"
                    value={form.rulesText}
                    onChange={handleChange}
                    placeholder="No fumar&#10;No mascotas&#10;Horario de ingreso respetado"
                    style={{ minHeight: '110px' }}
                  />
                </div>
              </div>
            </section>

            {/* ── Sección 6: Detalles adicionales ── */}
            <section className="nl-section">
              <div className="nl-section__label">
                <span className="nl-section__num">06</span>
                <div>
                  <h2>Detalles adicionales</h2>
                  <p>Información opcional que puede ayudar a los inquilinos.</p>
                </div>
              </div>

              <div className="nl-fields">
                <div className="nl-field">
                  <label>Área (m²)</label>
                  <input
                    type="number"
                    name="areaM2"
                    min="0"
                    step="0.1"
                    placeholder="18"
                    value={form.areaM2}
                    onChange={handleChange}
                  />
                </div>

                <div className="nl-field">
                  <label>Distancia a la universidad (km)</label>
                  <input
                    type="number"
                    name="distanceToUniversityKm"
                    min="0"
                    step="0.1"
                    placeholder="1.5"
                    value={form.distanceToUniversityKm}
                    onChange={handleChange}
                  />
                </div>

                <div className="nl-field">
                  <label>Ideal para</label>
                  <input
                    type="text"
                    name="idealFor"
                    placeholder="Estudiantes universitarios, profesionales..."
                    value={form.idealFor}
                    onChange={handleChange}
                  />
                </div>

                <div className="nl-field">
                  <label>Disponible desde</label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={form.availableFrom}
                    onChange={handleChange}
                  />
                </div>

                <div className="nl-field nl-field--full">
                  <label>Nota de disponibilidad</label>
                  <input
                    type="text"
                    name="availabilityNote"
                    placeholder="Disponible desde el 15 de noviembre"
                    value={form.availabilityNote}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            {/* ── Submit ── */}
            <div className="nl-submit-row">
              <Link to="/dashboard/listings" className="nl-cancel">
                Cancelar
              </Link>
              <button type="submit" className="nl-submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="nl-spinner" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Publicar alojamiento
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* ── Modal de éxito ── */}
      {successData && (
        <div className="nl-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="nl-modal-title">
          <div className="nl-modal">
            <div className="nl-modal__icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="9 12 11.5 14.5 16 9.5" />
              </svg>
            </div>

            <h2 id="nl-modal-title">¡Alojamiento publicado!</h2>

            <p>
              <strong>"{successData.title}"</strong> fue creado correctamente y ya está disponible en el catálogo.
            </p>

            <div className="nl-modal__actions">
              <button
                type="button"
                className="nl-modal__btn nl-modal__btn--secondary"
                onClick={() => {
                  setForm({
                    title: '', description: '', price: '', roomType: 'individual',
                    isFurnished: true, bedrooms: 1, bathrooms: 1, maxTenants: 1,
                    areaM2: '', distanceToUniversityKm: '', idealFor: '',
                    availableFrom: '', availabilityNote: '',
                    location: { address: '', district: '', city: 'Bogotá', state: 'Cundinamarca', country: 'Colombia', postalCode: '' },
                    amenities: [1, 2, 3, 5],
                    photos: ['', '', ''],
                    rulesText: 'No fumar\nNo mascotas\nHorario de ingreso respetado'
                  });
                  setError('');
                  setSuccessData(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Publicar otro
              </button>
              <button
                type="button"
                className="nl-modal__btn nl-modal__btn--primary"
                onClick={() => navigate('/dashboard/listings', { replace: true })}
              >
                Ver mis alojamientos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewListingPage;
