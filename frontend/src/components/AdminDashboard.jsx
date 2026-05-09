import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
   const [users, setUsers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [orgForm, setOrgForm] = useState({ username: '', email: '', password: '', firstName: '', lastName: '' });
   const [orgLoading, setOrgLoading] = useState(false);
   const navigate = useNavigate();

   useEffect(() => {
      const fetchUsers = async () => {
         try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/admin/users', {
               headers: { 'Authorization': `Bearer ${token}` }
            });
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

   const handleDeleteUser = async (userId, username) => {
      if (!window.confirm(`Are you sure you want to permanently delete user @${username}?`)) return;

      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
            // Remove user from state avoiding an extra fetch request
            setUsers(users.filter(u => u._id !== userId));
         } else {
            const data = await res.json();
            alert(data.error || 'Failed to delete user');
         }
      } catch (err) {
         console.error('Failed to delete user', err);
         alert('Network error when attempting deletion');
      }
   };

   const handleCreateOrganizer = async (e) => {
      e.preventDefault();
      setOrgLoading(true);
      try {
         const token = localStorage.getItem('token');
         const res = await fetch('/api/admin/organizers', {
            method: 'POST',
            headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(orgForm)
         });
         const data = await res.json();
         if (res.ok) {
            alert('Event Organizer created successfully!');
            setOrgForm({ username: '', email: '', password: '', firstName: '', lastName: '' });
            setUsers([data.user, ...users]);
         } else {
            alert(data.error || 'Failed to create organizer');
         }
      } catch (err) {
         console.error('Failed to create organizer', err);
         alert('Network error');
      }
      setOrgLoading(false);
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
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {users.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
                           <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--slate-500)' }}>{u._id}</td>
                           <td style={{ padding: '1rem', color: 'var(--white)', fontWeight: 600 }}>{u.firstName || u.name} {u.lastName}</td>
                           <td style={{ padding: '1rem', color: 'var(--emerald-400)' }}>@{u.username}</td>
                           <td style={{ padding: '1rem' }}>{u.email}</td>
                           <td style={{ padding: '1rem' }}>{u.jobTitle || '-'}</td>
                           <td style={{ padding: '1rem', textAlign: 'right' }}>
                              <button onClick={() => handleDeleteUser(u._id, u.username)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--red-500)', color: 'var(--red-400)' }}>Delete User</button>
                           </td>
                        </tr>
                     ))}
                     {users.length === 0 && (
                        <tr>
                           <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>No users in database.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

             <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--slate-700)' }}>
                <h3 className="form-title" style={{ textAlign: 'left', margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Create Event Organizer</h3>
                <form onSubmit={handleCreateOrganizer} className="form-group-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div className="form-group">
                      <label>First Name</label>
                      <input required className="form-input" value={orgForm.firstName} onChange={(e) => setOrgForm({...orgForm, firstName: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label>Last Name</label>
                      <input required className="form-input" value={orgForm.lastName} onChange={(e) => setOrgForm({...orgForm, lastName: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label>Email</label>
                      <input required type="email" className="form-input" value={orgForm.email} onChange={(e) => setOrgForm({...orgForm, email: e.target.value})} />
                   </div>
                   <div className="form-group">
                      <label>Username</label>
                      <input required className="form-input" value={orgForm.username} onChange={(e) => setOrgForm({...orgForm, username: e.target.value})} />
                   </div>
                   <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Password</label>
                      <input required type="password" className="form-input" value={orgForm.password} onChange={(e) => setOrgForm({...orgForm, password: e.target.value})} />
                   </div>
                   <div style={{ gridColumn: '1 / -1' }}>
                      <button disabled={orgLoading} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                         {orgLoading ? 'Creating...' : 'Create Organizer Account'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
       </div>
   );
}
