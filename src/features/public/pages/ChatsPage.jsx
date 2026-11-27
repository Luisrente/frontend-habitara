import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserMenu from '../../../shared/components/UserMenu';
import ChatModal from '../../../shared/components/ChatModal.jsx';
import { API_URL } from '../../../config.js';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 1)   return 'ahora';
  if (mins < 60)  return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${days} d`;
}

function ChatsPage() {
  const navigate = useNavigate();
  const [user, setUser]               = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState('');
  const [activeChat, setActiveChat]   = useState(null); // { id, otherName }

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('habitara_user') || 'null');
    if (!stored) { navigate('/login', { replace: true }); return; }
    setUser(stored);

    const token = localStorage.getItem('habitara_token');
    fetch(`${API_URL}/messages/conversations/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d.success) setConversations(d.data);
        else setFetchError(d.message || 'No se pudieron cargar las conversaciones');
      })
      .catch(err => setFetchError(err.message || 'Error de conexión'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('habitara_token');
    localStorage.removeItem('habitara_user');
    navigate('/', { replace: true });
  };

  return (
    <div className="chats-page">
      <header className="catalog-header">
        <div className="container catalog-header__inner">
          <Link to="/" className="brand-mark">HABITARA</Link>
          <div className="catalog-actions">
            {user && <UserMenu user={user} onLogout={handleLogout} />}
          </div>
        </div>
      </header>

      <main className="container chats-main">
        <div className="chats-header">
          <h1>Mensajes</h1>
          <p>{conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}</p>
        </div>

        {loading ? (
          <div className="chats-skeleton-list">
            {[1, 2, 3].map(i => <div key={i} className="chats-skeleton" />)}
          </div>
        ) : fetchError ? (
          <div className="chats-empty">
            <div className="chats-empty__icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p style={{color:'#b91c1c'}}>Error al cargar conversaciones</p>
            <p className="chats-empty__sub">{fetchError}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="chats-empty">
            <div className="chats-empty__icon">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p>No tienes conversaciones activas.</p>
            <p className="chats-empty__sub">Los mensajes aparecen cuando una reserva es confirmada.</p>
          </div>
        ) : (
          <ul className="chats-list">
            {conversations.map(c => (
              <li key={c.id}>
                <button
                  type="button"
                  className="chats-item"
                  onClick={() => setActiveChat({ id: c.id, otherName: c.otherName })}
                >
                  <div className="chats-item__avatar">
                    {(c.otherName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="chats-item__body">
                    <div className="chats-item__top">
                      <span className="chats-item__name">{c.otherName}</span>
                      <span className="chats-item__time">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="chats-item__acc">{c.accommodationTitle}</p>
                    {c.lastMessage ? (
                      <p className="chats-item__preview">
                        {c.lastSenderIsMe ? 'Tú: ' : ''}{c.lastMessage.length > 60 ? c.lastMessage.slice(0, 60) + '…' : c.lastMessage}
                      </p>
                    ) : (
                      <p className="chats-item__preview chats-item__preview--empty">Sin mensajes aún</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {activeChat && (
        <ChatModal
          conversationId={activeChat.id}
          otherName={activeChat.otherName}
          onClose={() => setActiveChat(null)}
        />
      )}
    </div>
  );
}

export default ChatsPage;
