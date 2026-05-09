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
    <div className="max-w-2xl w-full mx-auto glass rounded-[2.5rem] border-white/5 shadow-2xl flex flex-col h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center text-brand-500 font-bold border border-brand-500/20">
            {otherUser.firstName?.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white leading-none">Chat with {otherUser.firstName}</h2>
            <div className="flex items-center mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Secure Line Active</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
        >
          Close
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-50">
             <div className="w-6 h-6 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fetching Signals</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full italic text-slate-500 text-sm">
             Send a secure handshake to begin...
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === currentUser._id;
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isMe 
                  ? 'bg-brand-500 text-white rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter mt-1.5 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area / Quick Replies */}
      <div className="p-6 bg-slate-900/40 border-t border-white/5">
        <div className="mb-3 flex items-center space-x-2">
           <svg className="w-3 h-3 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Relays</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_MESSAGES.map((text, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(text)}
              disabled={sending}
              className="px-4 py-2.5 bg-white/[0.03] hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/30 text-brand-400 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

