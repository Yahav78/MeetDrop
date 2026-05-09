import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DigitalCard from './DigitalCard';
import ChatWindow from './ChatWindow';

export default function HistoryView({ user, onUpdate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/users/${user._id}/history`);
        let data = await res.json();

        if (res.ok) {
          // Sort history so favorites are at the top
          data.sort((a, b) => {
            const aFav = user.favorites?.includes(a.user._id) ? 1 : 0;
            const bFav = user.favorites?.includes(b.user._id) ? 1 : 0;
            return bFav - aFav;
          });
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const toggleFavorite = async (e, targetId) => {
    e.stopPropagation(); // prevent card click
    const isFav = user.favorites?.includes(targetId);
    const method = isFav ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`/api/users/${user._id}/favorites/${targetId}`, { method });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const hideConnection = async (e, targetId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently hide this connection?")) return;

    try {
      const res = await fetch(`/api/users/${user._id}/history/hide/${targetId}`, { method: 'POST' });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdate(updatedUser);
        // Filter out hidden from local array
        setHistory(prev => prev.filter(item => item.user._id !== targetId));
      }
    } catch (err) {
      console.error('Failed to hide connection', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <h3 className="text-slate-400 font-display font-bold tracking-widest uppercase text-sm">Scanning Archives...</h3>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedUser(null)} 
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-bold text-sm uppercase tracking-wider">Back to History</span>
        </button>
        <DigitalCard user={selectedUser} onReset={() => setSelectedUser(null)} />
      </div>
    );
  }

  if (activeChat) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <ChatWindow 
          connectionId={activeChat.connectionId} 
          currentUser={user} 
          otherUser={activeChat.user} 
          onClose={() => setActiveChat(null)} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight">Connections</h2>
          <p className="text-slate-400 mt-1">Your professional network, archived.</p>
        </div>
        <div className="flex items-center space-x-2">
           <div className="px-3 py-1 bg-brand-500/10 text-brand-400 rounded-full text-xs font-bold border border-brand-500/20">
              {history.length} Total
           </div>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-brand-500 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all backdrop-blur-sm"
          placeholder="Search your network..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {history.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          </div>
          <p className="text-slate-500 font-medium">You haven't made any connections yet.</p>
          <button onClick={() => navigate('/')} className="text-brand-400 font-bold text-sm hover:text-brand-300 transition-colors">Start Scanning Now &rarr;</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {history
            .filter(item => {
              const fullName = `${item.user.firstName} ${item.user.lastName}`.toLowerCase();
              return fullName.includes(searchTerm.toLowerCase());
            })
            .map((historyItem, idx) => {
              const connUser = historyItem.user;
              const isFav = user.favorites?.includes(connUser._id);
              
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedUser(connUser)}
                  className={`group relative glass rounded-2xl p-4 flex items-center space-x-4 cursor-pointer hover:bg-white/[0.03] transition-all hover:translate-x-1`}
                >
                  
                  <div className="relative">
                    <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-xl font-display font-bold text-slate-400 group-hover:text-brand-400 transition-colors border border-white/5">
                      {connUser.firstName?.charAt(0).toUpperCase()}
                    </div>
                    {isFav && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full border-2 border-[#0f172a] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h4 className="text-lg font-bold text-white truncate">{connUser.firstName} {connUser.lastName}</h4>
                    <p className="text-brand-400 text-sm font-semibold truncate">{connUser.jobTitle || 'Professional'}</p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveChat(historyItem); }} 
                      className="p-2 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => toggleFavorite(e, connUser._id)} 
                      className={`p-2 rounded-lg transition-all ${isFav ? 'text-brand-500 hover:bg-brand-500/10' : 'text-slate-400 hover:text-brand-400 hover:bg-brand-500/10'}`}
                    >
                      <svg className="w-5 h-5" fill={isFav ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => hideConnection(e, connUser._id)} 
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

