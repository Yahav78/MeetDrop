import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DigitalCard from './DigitalCard';

export default function HistoryView({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/users/${user._id}/history`);
        const data = await res.json();
        if (res.ok) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

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
          {history.map((connUser, idx) => (
             <div 
               key={idx} 
               onClick={() => setSelectedUser(connUser)}
               style={{ 
                 display: 'flex', alignItems: 'center', padding: '1rem', 
                 backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: '0.75rem', cursor: 'pointer',
                 border: '1px solid rgba(51,65,85,0.5)', transition: 'background 0.2s'
               }}
               onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--slate-800)'}
               onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.5)'}
             >
                <div className="card-avatar" style={{ width: '3rem', height: '3rem', marginTop: 0, border: '2px solid var(--slate-600)', boxShadow: 'none' }}>
                  <span style={{ fontSize: '1.2rem' }}>{connUser.name.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ marginLeft: '1rem', flex: 1 }}>
                   <h4 style={{ margin: 0, color: 'var(--white)', fontWeight: 600 }}>{connUser.name}</h4>
                   <p style={{ margin: 0, color: 'var(--emerald-400)', fontSize: '0.75rem' }}>{connUser.jobTitle || 'No Title'}</p>
                </div>
                <div>
                   <svg style={{ width: '1.5rem', height: '1.5rem', color: 'var(--slate-500)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                   </svg>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
