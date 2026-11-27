import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../../config.js';

function fmt(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function ChatModal({ reservationId, otherName, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages]             = useState([]);
  const [text, setText]                     = useState('');
  const [loading, setLoading]               = useState(true);
  const [sending, setSending]               = useState(false);
  const [error, setError]                   = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // 1. Obtener o crear la conversación
  useEffect(() => {
    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/messages/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reservationId }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setConversationId(d.data.conversationId);
        else setError(d.message || 'Error al abrir conversación');
      })
      .catch(() => setError('No se pudo conectar con el servidor'))
      .finally(() => setLoading(false));
  }, [reservationId]);

  // 2. Cargar mensajes cuando ya tenemos conversationId
  useEffect(() => {
    if (!conversationId) return;
    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/messages/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.data); })
      .catch(() => {});
  }, [conversationId]);

  // 3. Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Focus al input
  useEffect(() => {
    if (!loading && !error) inputRef.current?.focus();
  }, [loading, error]);

  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    setSending(true);
    const token = localStorage.getItem('habitara_token');
    try {
      const res  = await fetch(`${API_URL}/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setText('');
      }
    } catch { /* ignore */ }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Group messages by date
  const grouped = messages.reduce((acc, m) => {
    const day = new Date(m.createdAt).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(m);
    return acc;
  }, {});

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="chat-modal__head">
          <div className="chat-modal__avatar">
            {(otherName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="chat-modal__name">{otherName || 'Usuario'}</p>
            <p className="chat-modal__sub">Conversación de reserva</p>
          </div>
          <button type="button" className="chat-modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="chat-modal__body">
          {loading ? (
            <p className="chat-status">Cargando conversación…</p>
          ) : error ? (
            <p className="chat-status chat-status--error">{error}</p>
          ) : messages.length === 0 ? (
            <p className="chat-status">No hay mensajes aún. ¡Sé el primero en escribir!</p>
          ) : (
            Object.entries(grouped).map(([day, msgs]) => (
              <div key={day}>
                <div className="chat-date-sep">
                  <span>{fmtDate(msgs[0].createdAt)}</span>
                </div>
                {msgs.map(m => (
                  <div key={m.id} className={`chat-bubble-wrap${m.mine ? ' chat-bubble-wrap--mine' : ''}`}>
                    <div className={`chat-bubble${m.mine ? ' chat-bubble--mine' : ''}`}>
                      <p>{m.content}</p>
                      <span className="chat-bubble__time">{fmt(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!loading && !error && (
          <div className="chat-modal__footer">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              placeholder="Escribe un mensaje…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              disabled={sending}
            />
            <button
              type="button"
              className="chat-send"
              onClick={handleSend}
              disabled={sending || !text.trim()}
              aria-label="Enviar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatModal;
