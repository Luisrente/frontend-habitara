import { useState, useRef, useEffect } from 'react';

function fmtCardNumber(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function fmtExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
}
function cardBrand(num) {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'generic';
}

function PaymentModal({ onClose, onConfirm, totalLabel, nights }) {
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [errors, setErrors]   = useState({});
  const [flipped, setFlipped] = useState(false);
  const [step, setStep]       = useState('form'); // 'form' | 'processing' | 'success'
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const brand = cardBrand(card.number);

  function validate() {
    const e = {};
    const num = card.number.replace(/\s/g, '');
    if (num.length < 13) e.number = 'Número de tarjeta inválido';
    if (!card.name.trim()) e.name = 'Ingresa el nombre del titular';
    const [mm, yy] = card.expiry.split('/');
    const now = new Date();
    const expY = 2000 + parseInt(yy || '0', 10);
    const expM = parseInt(mm || '0', 10);
    if (!mm || !yy || expM < 1 || expM > 12 || expY < now.getFullYear() ||
        (expY === now.getFullYear() && expM < now.getMonth() + 1)) {
      e.expiry = 'Fecha de vencimiento inválida';
    }
    if (card.cvv.length < 3) e.cvv = 'CVV inválido';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep('processing');
    setTimeout(() => { setStep('success'); }, 1800);
    setTimeout(() => { onConfirm(); }, 3200);
  }

  const displayNum = card.number || '•••• •••• •••• ••••';
  const displayName = card.name || 'NOMBRE APELLIDO';
  const displayExp = card.expiry || 'MM/AA';

  return (
    <div className="pay-overlay" onClick={step === 'form' ? onClose : undefined}>
      <div className="pay-modal" onClick={e => e.stopPropagation()}>

        {step === 'form' && (
          <>
            <div className="pay-modal__head">
              <div>
                <p className="pay-modal__title">Pago seguro</p>
                <p className="pay-modal__sub">{nights} noche{nights !== 1 ? 's' : ''} · {totalLabel}</p>
              </div>
              <button type="button" className="pay-modal__close" onClick={onClose} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Card preview */}
            <div className={`pay-card-scene${flipped ? ' pay-card-scene--flipped' : ''}`}>
              <div className="pay-card pay-card--front">
                <div className="pay-card__top">
                  <span className="pay-card__chip">
                    <svg viewBox="0 0 36 28" width="36" height="28" fill="none">
                      <rect x="1" y="1" width="34" height="26" rx="3" stroke="rgba(255,255,255,.5)" strokeWidth="1.2"/>
                      <line x1="1" y1="10" x2="35" y2="10" stroke="rgba(255,255,255,.4)" strokeWidth="1.2"/>
                      <line x1="1" y1="18" x2="35" y2="18" stroke="rgba(255,255,255,.4)" strokeWidth="1.2"/>
                      <line x1="13" y1="1" x2="13" y2="27" stroke="rgba(255,255,255,.4)" strokeWidth="1.2"/>
                      <line x1="23" y1="1" x2="23" y2="27" stroke="rgba(255,255,255,.4)" strokeWidth="1.2"/>
                    </svg>
                  </span>
                  <span className="pay-card__brand">
                    {brand === 'visa' && <span className="pay-brand-visa">VISA</span>}
                    {brand === 'mastercard' && (
                      <svg width="40" height="26" viewBox="0 0 40 26">
                        <circle cx="15" cy="13" r="12" fill="#eb001b" opacity=".9"/>
                        <circle cx="25" cy="13" r="12" fill="#f79e1b" opacity=".9"/>
                      </svg>
                    )}
                    {brand === 'amex' && <span style={{fontSize:'.7rem',fontWeight:800,letterSpacing:1,color:'#fff'}}>AMEX</span>}
                  </span>
                </div>
                <div className="pay-card__number">{displayNum}</div>
                <div className="pay-card__bottom">
                  <div>
                    <div className="pay-card__label">TITULAR</div>
                    <div className="pay-card__value">{displayName.toUpperCase()}</div>
                  </div>
                  <div>
                    <div className="pay-card__label">VENCE</div>
                    <div className="pay-card__value">{displayExp}</div>
                  </div>
                </div>
              </div>
              <div className="pay-card pay-card--back">
                <div className="pay-card__stripe" />
                <div className="pay-card__cvv-row">
                  <span className="pay-card__cvv-label">CVV</span>
                  <span className="pay-card__cvv-box">{card.cvv ? '•'.repeat(card.cvv.length) : '•••'}</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form className="pay-form" onSubmit={handleSubmit} noValidate>
              <div className="pay-field">
                <label className="pay-label">Número de tarjeta</label>
                <input
                  className={`pay-input${errors.number ? ' pay-input--err' : ''}`}
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  inputMode="numeric"
                  onChange={e => {
                    setCard(p => ({ ...p, number: fmtCardNumber(e.target.value) }));
                    setErrors(p => ({ ...p, number: '' }));
                  }}
                />
                {errors.number && <span className="pay-err">{errors.number}</span>}
              </div>

              <div className="pay-field">
                <label className="pay-label">Nombre del titular</label>
                <input
                  ref={nameRef}
                  className={`pay-input${errors.name ? ' pay-input--err' : ''}`}
                  placeholder="Como aparece en la tarjeta"
                  value={card.name}
                  onChange={e => {
                    setCard(p => ({ ...p, name: e.target.value }));
                    setErrors(p => ({ ...p, name: '' }));
                  }}
                />
                {errors.name && <span className="pay-err">{errors.name}</span>}
              </div>

              <div className="pay-row">
                <div className="pay-field">
                  <label className="pay-label">Vencimiento</label>
                  <input
                    className={`pay-input${errors.expiry ? ' pay-input--err' : ''}`}
                    placeholder="MM/AA"
                    value={card.expiry}
                    inputMode="numeric"
                    onChange={e => {
                      setCard(p => ({ ...p, expiry: fmtExpiry(e.target.value) }));
                      setErrors(p => ({ ...p, expiry: '' }));
                    }}
                  />
                  {errors.expiry && <span className="pay-err">{errors.expiry}</span>}
                </div>
                <div className="pay-field">
                  <label className="pay-label">CVV</label>
                  <input
                    className={`pay-input${errors.cvv ? ' pay-input--err' : ''}`}
                    placeholder="•••"
                    value={card.cvv}
                    inputMode="numeric"
                    maxLength={4}
                    onFocus={() => setFlipped(true)}
                    onBlur={() => setFlipped(false)}
                    onChange={e => {
                      setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }));
                      setErrors(p => ({ ...p, cvv: '' }));
                    }}
                  />
                  {errors.cvv && <span className="pay-err">{errors.cvv}</span>}
                </div>
              </div>

              <div className="pay-secure-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Pago seguro con encriptación SSL</span>
              </div>

              <button type="submit" className="pay-btn">
                Confirmar pago · {totalLabel}
              </button>
            </form>
          </>
        )}

        {step === 'processing' && (
          <div className="pay-processing">
            <div className="pay-spinner" />
            <p className="pay-processing__title">Procesando pago…</p>
            <p className="pay-processing__sub">Por favor espera un momento</p>
          </div>
        )}

        {step === 'success' && (
          <div className="pay-success">
            <div className="pay-success__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="pay-success__title">¡Pago aprobado!</p>
            <p className="pay-success__sub">Tu reserva está siendo procesada…</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default PaymentModal;
