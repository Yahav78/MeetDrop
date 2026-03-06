import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
           const data = await res.json();
           setUsers(data);
        } else {
           alert('Unauthorized');
           navigate('/');
        }
      } catch (err) {
        console.error('Failed to fetch admin users', err);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return <div className="loading-title" style={{ marginTop: '5rem' }}>Loading Node Infrastructure...</div>;

  return (
    <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '64rem', margin: '2rem auto', padding: '0 1rem' }}>
       <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <div>
                <h2 className="form-title" style={{ textAlign: 'left', margin: 0, color: 'var(--red-500)' }}>OVERSEER DASHBOARD</h2>
                <p className="form-subtitle" style={{ textAlign: 'left', margin: 0 }}>System Administrators Only</p>
             </div>
             <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Purge Session</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'var(--slate-300)' }}>
               <thead>
                  <tr style={{ borderBottom: '1px solid var(--slate-700)', color: 'var(--slate-400)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                     <th style={{ padding: '1rem' }}>ID</th>
                     <th style={{ padding: '1rem' }}>Name</th>
                     <th style={{ padding: '1rem' }}>Username</th>
                     <th style={{ padding: '1rem' }}>Email</th>
                     <th style={{ padding: '1rem' }}>Job Title</th>
                  </tr>
               </thead>
               <tbody>
                  {users.map(u => (
                     <tr key={u._id} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--slate-500)' }}>{u._id}</td>
                        <td style={{ padding: '1rem', color: 'var(--white)', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--emerald-400)' }}>@{u.username}</td>
                        <td style={{ padding: '1rem' }}>{u.email}</td>
                        <td style={{ padding: '1rem' }}>{u.jobTitle || '-'}</td>
                     </tr>
                  ))}
                  {users.length === 0 && (
                     <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>No users in database.</td>
                     </tr>
                  )}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  );
}
