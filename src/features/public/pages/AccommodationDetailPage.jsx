import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';

const API_URL = 'http://localhost:4000/api';

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function toDateKey(date) {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
}

function AccommodationDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [reservationForm, setReservationForm] = useState({
    startDate: '',
    endDate: ''
  });
  const [reservationError, setReservationError] = useState('');
  const [reservationSuccess, setReservationSuccess] = useState('');
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const monthLabel = calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const monthGrid = buildMonthGrid(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const isBooked = (date) => {
    const iso = toDateKey(date);
    return bookedDates.includes(iso);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('habitara_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

    fetch(`${API_URL}/accommodations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoom(data.data);
          setSelectedImageIndex(0);
        } else {
          setRoom(null);
        }
      })
      .catch(() => setRoom(null))
      .finally(() => setLoading(false));

    fetch(`${API_URL}/reservations/accommodation/${id}/booked-dates`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setBookedDates(data.data);
        } else {
          setBookedDates([]);
        }
      })
      .catch(() => setBookedDates([]));
  }, [id]);


  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    setUser(null);
  };

  const handleReservationChange = (event) => {
    const { name, value } = event.target;
    setReservationForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReservationSubmit = async (event) => {
    event.preventDefault();
    setReservationError('');
    setReservationSuccess('');

    if (!user) {
      setReservationError('Debes iniciar sesión para reservar este alojamiento.');
      return;
    }

    if (!reservationForm.startDate || !reservationForm.endDate) {
      setReservationError('Selecciona la fecha de inicio y fin de la reserva.');
      return;
    }

    try {
      setSubmittingReservation(true);
      const token = localStorage.getItem('habitara_token');

      const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accommodationId: room.id,
          startDate: reservationForm.startDate,
          endDate: reservationForm.endDate
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'No se pudo crear la reserva');
      }

      setReservationSuccess('Reserva enviada correctamente. El arrendador la revisará.');
      setReservationForm({ startDate: '', endDate: '' });
    } catch (error) {
      setReservationError(error.message);
    } finally {
      setSubmittingReservation(false);
    }
  };

  const changeMonth = (direction) => {
    setCalendarMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + direction, 1);
      return next;
    });
  };

  if (loading) {
    return <div className="container page-detail-loading">Cargando alojamiento...</div>;
  }

  if (!room) {
    return (
      <div className="container detail-empty-state">
        <h2>No se encontró este alojamiento</h2>
        <Link to="/" className="link-button primary">Volver al catálogo</Link>
      </div>
    );
  }

  const roomLocation = room.location || {};
  const galleryImages = room.photos && room.photos.length > 0
    ? room.photos.map((photo) => photo.url || photo).filter(Boolean)
    : [];
  const hasPhotos = galleryImages.length > 0;
  const visibleThumbs = galleryImages.slice(0, 4);
  const selectedImage = hasPhotos ? (galleryImages[selectedImageIndex] || galleryImages[0]) : null;
  const services = room.amenities?.map((item) => item.name || item) || [];

  return (
    <div className="detail-page">
      <header className="detail-header">
        <div className="container detail-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>
          <div className="catalog-actions">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Link to="/login" className="link-button muted">Iniciar sesión</Link>
            )}
          </div>
        </div>
      </header>

      <main className="container detail-main">
        <div className={`gallery-shell${visibleThumbs.length > 1 ? '' : ' gallery-shell--single'}`}>
          {visibleThumbs.length > 1 && (
            <div className="gallery-thumbs">
              {visibleThumbs.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`gallery-thumb ${selectedImageIndex === index ? 'is-active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image} alt={`${room.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}

          <div className="gallery-main">
            {selectedImage ? (
              <img src={selectedImage} alt={room.title} className="gallery-main__image" />
            ) : (
              <div className="gallery-main__placeholder">
                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>Sin imágenes disponibles</span>
              </div>
            )}
          </div>
        </div>

        <div className="detail-content">
          <div className="detail-left">
            <span className="eyebrow">{room.roomType || 'Habitación'}</span>
            <h1>{room.title}</h1>
            <p className="detail-location">📍 {roomLocation.district || 'Ubicación'} · {roomLocation.city || 'Lima'} · {roomLocation.address || ''}</p>

            <div className="detail-price-box">
              <span>Desde</span>
              <strong>COP $ {Number(room.price || 0).toLocaleString('es-CO')}</strong>
            </div>

            <div className="detail-section">
              <h3>Descripción</h3>
              <p>{room.description}</p>
            </div>

            <div className="detail-section">
              <h3>Incluye</h3>
              <div className="room-services">
                {services.length > 0 ? (
                  services.map((service) => (
                    <span key={service} className="service-pill">{service}</span>
                  ))
                ) : (
                  <span className="service-pill">Servicios disponibles</span>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h3>Detalles</h3>
              <ul className="detail-list">
                <li>Habitaciones: {room.bedrooms || 1}</li>
                <li>Baños: {room.bathrooms || 1}</li>
                <li>Inquilinos: {room.maxTenants || 1}</li>
                <li>Amueblado: {room.isFurnished ? 'Sí' : 'No'}</li>
                {room.areaM2 ? <li>Área: {Number(room.areaM2).toFixed(1)} m²</li> : null}
                {room.distanceToUniversityKm ? <li>Distancia a la universidad: {Number(room.distanceToUniversityKm).toFixed(1)} km</li> : null}
                {room.availableFrom ? <li>Disponible desde: {new Date(`${room.availableFrom}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</li> : null}
                {room.idealFor ? <li>Ideal para: {room.idealFor}</li> : null}
              </ul>
            </div>

            {room.availabilityNote && (
              <div className="detail-section">
                <h3>Disponibilidad</h3>
                <p>{room.availabilityNote}</p>
              </div>
            )}
          </div>

          <aside className="detail-side">
            <div className="booking-card">
              <div className="booking-card__price-row">
                <div>
                  <p className="booking-card__from">Precio mensual</p>
                  <p className="booking-card__amount">
                    COP <strong>{Number(room.price || 0).toLocaleString('es-CO')}</strong>
                  </p>
                </div>
                <span className="booking-card__badge">Disponible</span>
              </div>

              <div className="booking-card__divider" />

              <p className="booking-card__subtitle">Solicitar estancia</p>

              <div className="booking-card__meta">
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Pago seguro
                </span>
                <span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Confirmación rápida
                </span>
              </div>

              <form onSubmit={handleReservationSubmit} className="reservation-form">
                <div className="booking-dates">
                  <div className="booking-date-field booking-date-field--top">
                    <span className="booking-date-field__label">Entrada</span>
                    <input
                      type="date"
                      name="startDate"
                      value={reservationForm.startDate}
                      onChange={handleReservationChange}
                      required
                    />
                  </div>
                  <div className="booking-dates__divider" />
                  <div className="booking-date-field booking-date-field--bottom">
                    <span className="booking-date-field__label">Salida</span>
                    <input
                      type="date"
                      name="endDate"
                      value={reservationForm.endDate}
                      onChange={handleReservationChange}
                      required
                    />
                  </div>
                </div>

                {reservationError && (
                  <div className="booking-msg booking-msg--error">{reservationError}</div>
                )}
                {reservationSuccess && (
                  <div className="booking-msg booking-msg--success">{reservationSuccess}</div>
                )}

                <button type="submit" className="booking-submit-btn" disabled={submittingReservation}>
                  {submittingReservation ? 'Enviando...' : 'Reservar ahora'}
                </button>
              </form>
            </div>

            <div className="availability-card">
              <div className="availability-header">
                <h3>Disponibilidad</h3>
                <span className="availability-legend">
                  <span className="legend-dot booked"></span> Ocupado
                </span>
              </div>

              <div className="mini-calendar-nav">
                <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(-1)} aria-label="Mes anterior">←</button>
                <p className="availability-label">{monthLabel}</p>
                <button type="button" className="calendar-nav-btn" onClick={() => changeMonth(1)} aria-label="Mes siguiente">→</button>
              </div>

              <div className="mini-calendar">
                <div className="mini-calendar__weekdays">
                  {weekdayLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="mini-calendar__days">
                  {monthGrid.map((date, index) => {
                    if (!date) {
                      return <span key={`empty-${index}`} className="day-cell empty" />;
                    }

                    const isDayBooked = isBooked(date);
                    return (
                      <span
                        key={toDateKey(date)}
                        className={`day-cell ${isDayBooked ? 'booked' : 'free'}`}
                        title={isDayBooked ? 'Día ocupado' : 'Disponible'}
                      >
                        {date.getDate()}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AccommodationDetailPage;
