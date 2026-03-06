import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DigitalCard from './DigitalCard';

export default function HistoryView({ user, onUpdate }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
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
              const aFav = user.favorites?.includes(a._id) ? 1 : 0;
              const bFav = user.favorites?.includes(b._id) ? 1 : 0;
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
         setHistory(prev => prev.filter(u => u._id !== targetId));
      }
    } catch (err) {
      console.error('Failed to hide connection', err);
    }
  };

  if (loading) {
    return (
      <div className="radar-container" style={{ marginTop: '2rem' }}>
         <h3 className="loading-title">Scanning Archives...</h3>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="animate-fade-in-up w-full">
         <button onClick={() => setSelectedUser(null)} className="btn-secondary" style={{ marginBottom: '1rem', width: 'auto', padding: '0.5rem 1rem' }}>&larr; Back to History</button>
         <DigitalCard user={selectedUser} onReset={() => setSelectedUser(null)} />
      </div>
    );
  }

  return (
    <div className="form-container glass-panel animate-fade-in-up" style={{ marginTop: '2rem', maxWidth: '40rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2 className="form-title" style={{ margin: 0, textAlign: 'left' }}>My Connections</h2>
         <button onClick={() => navigate('/')} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Radar</button>
      </div>
      <p className="form-subtitle" style={{ textAlign: 'left', marginTop: '0.5rem' }}>People you've networked with.</p>
      
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
           <p style={{ color: 'var(--slate-500)' }}>You haven't made any connections yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          {history.map((connUser, idx) => {
             const isFav = user.favorites?.includes(connUser._id);
             return (
               <div 
                 key={idx} 
                 onClick={() => setSelectedUser(connUser)}
                 className={`history-card ${isFav ? 'favorite-card' : ''}`}
                 style={{ 
                   display: 'flex', alignItems: 'center', padding: '1rem', 
                   backgroundColor: isFav ? 'rgba(5, 150, 105, 0.1)' : 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', cursor: 'pointer',
                   border: `1px solid ${isFav ? 'rgba(16, 185, 129, 0.4)' : 'rgba(51,65,85,0.5)'}`, transition: 'background 0.2s', position: 'relative'
                 }}
               >
                  <div className="card-avatar" style={{ width: '3rem', height: '3rem', marginTop: 0, border: '2px solid var(--slate-600)', boxShadow: 'none' }}>
                    <span style={{ fontSize: '1.2rem' }}>{connUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div style={{ marginLeft: '1rem', flex: 1 }}>
                     <h4 style={{ margin: 0, color: 'var(--white)', fontWeight: 600 }}>{connUser.name}</h4>
                     <p style={{ margin: 0, color: 'var(--emerald-400)', fontSize: '0.75rem' }}>{connUser.jobTitle || 'No Title'}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button className="btn-icon" onClick={(e) => toggleFavorite(e, connUser._id)} title={isFav ? "Unfavorite" : "Favorite"}>
                        <svg className={isFav ? "icon-fav active" : "icon-fav"} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFav ? 0 : 2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                     </button>
                     <button className="btn-icon" onClick={(e) => hideConnection(e, connUser._id)} title="Hide">
                        <svg className="icon-hide" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
