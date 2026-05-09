import { useState, useEffect, useRef } from 'react';

const PREDEFINED_MESSAGES = [
  "Nice to meet you!",
  "Let's connect on LinkedIn.",
  "Are you available for a quick chat?",
  "I'd love to hear more about your work.",
  "Great seeing you!"
];

export default function ChatWindow({ connectionId, currentUser, otherUser, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/connections/${connectionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [connectionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (sending) return;
    setSending(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/connections/${connectionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser._id, text })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
    setSending(false);
  };

  return (
    <div className="form-container glass-panel animate-fade-in-up w-full" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', height: '600px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          <h2 className="form-title" style={{ margin: 0, textAlign: 'left', fontSize: '1.25rem' }}>Chat with {otherUser.firstName}</h2>
          <p className="form-subtitle" style={{ textAlign: 'left', marginTop: '0.25rem', fontSize: '0.8rem' }}>Recent messages (Max 5)</p>
        </div>
        <button onClick={onClose} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Close</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--slate-400)' }}>Loading chat...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--slate-500)', margin: 'auto 0' }}>Say hi to start the conversation!</div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === currentUser._id;
            return (
              <div key={idx} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '1rem',
                  backgroundColor: isMe ? 'var(--blue-600)' : 'rgba(30,41,59,0.8)',
                  color: 'white',
                  borderBottomRightRadius: isMe ? '0' : '1rem',
                  borderBottomLeftRadius: isMe ? '1rem' : '0',
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: '0.5rem' }}>Quick Replies:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PREDEFINED_MESSAGES.map((text, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(text)}
              disabled={sending}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--emerald-400)',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                cursor: sending ? 'wait' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.1)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
