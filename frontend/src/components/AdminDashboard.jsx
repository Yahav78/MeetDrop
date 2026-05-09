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

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
            <h3 className="text-red-400 font-display font-bold tracking-widest uppercase text-sm">Loading Node Infrastructure...</h3>
         </div>
      );
   }

   return (
      <div className="max-w-6xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
               <h2 className="text-4xl font-display font-black text-white tracking-tight flex items-center">
                  <span className="text-red-500 mr-3">SYSTEM</span> OVERSEER
               </h2>
               <p className="text-slate-400 mt-1">Global user management and node control.</p>
            </div>
            <button 
               onClick={handleLogout} 
               className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
               Purge Session
            </button>
         </div>

         <div className="glass rounded-[2rem] overflow-hidden border-white/5">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        <th className="px-6 py-4">Node ID</th>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Network Handle</th>
                        <th className="px-6 py-4">Professional Status</th>
                        <th className="px-6 py-4 text-right">Control</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {users.map(u => (
                        <tr key={u._id} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="px-6 py-4 font-mono text-[10px] text-slate-600">
                              {u._id.substring(0, 8)}...
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                 <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 border border-white/5">
                                    {u.firstName?.charAt(0) || u.username?.charAt(0)}
                                 </div>
                                 <div>
                                    <div className="text-sm font-bold text-white">{u.firstName || u.name} {u.lastName}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm font-medium text-brand-400">
                              @{u.username}
                           </td>
                           <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                              {u.jobTitle || 'Unassigned'}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                 onClick={() => handleDeleteUser(u._id, u.username)} 
                                 className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold border border-red-500/20 transition-all"
                              >
                                 Delete Node
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="glass rounded-[2rem] p-8 border-white/5">
            <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center">
               <svg className="w-5 h-5 text-brand-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
               </svg>
               Create Event Organizer
            </h3>
            
            <form onSubmit={handleCreateOrganizer} className="space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                     <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={orgForm.firstName} onChange={(e) => setOrgForm({...orgForm, firstName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                     <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={orgForm.lastName} onChange={(e) => setOrgForm({...orgForm, lastName: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                     <input required type="email" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={orgForm.email} onChange={(e) => setOrgForm({...orgForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Network Handle</label>
                     <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={orgForm.username} onChange={(e) => setOrgForm({...orgForm, username: e.target.value})} />
                  </div>
               </div>
               
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Credentials</label>
                  <input required type="password" placeholder="Set a secure password" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" value={orgForm.password} onChange={(e) => setOrgForm({...orgForm, password: e.target.value})} />
               </div>

               <button 
                  disabled={orgLoading} 
                  type="submit" 
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
               >
                  {orgLoading ? 'Deploying Organizer Node...' : 'Authorize Organizer Account'}
               </button>
            </form>
         </div>
      </div>
   );
}

