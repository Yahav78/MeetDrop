import { useState, useEffect } from 'react';

const ISRAELI_CITIES = [
  'Tel Aviv', 'Jerusalem', 'Haifa', 'Beersheba', 'Netanya', 'Ashdod', 'Petah Tikva', 'Rishon LeZion'
];

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', city: 'Tel Aviv', address: '', maxCapacity: '' });
  const [creating, setCreating] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/events/organizer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
        if (selectedEvent) {
           const updatedSelected = data.find(e => e._id === selectedEvent._id);
           if (updatedSelected) setSelectedEvent(updatedSelected);
        }
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000); // Poll for live updates
    return () => clearInterval(interval);
  }, []); // Remove selectedEvent from dependencies to avoid infinite re-renders on selection

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          maxCapacity: parseInt(formData.maxCapacity)
        })
      });
      if (res.ok) {
        alert('Event created successfully!');
        setFormData({ name: '', city: 'Tel Aviv', address: '', maxCapacity: '' });
        fetchEvents();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Failed to create event', err);
      alert('Network error');
    }
    setCreating(false);
  };

  const handleDeleteEvent = async (e, eventId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEvents(events.filter(ev => ev._id !== eventId));
        if (selectedEvent?._id === eventId) setSelectedEvent(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <h3 className="text-amber-400 font-display font-bold tracking-widest uppercase text-sm">Synchronizing Events...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight flex items-center">
            <span className="text-amber-400 mr-3">ORGANIZER</span> HUB
          </h2>
          <p className="text-slate-400 mt-1">Manage your conventions and network nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Creation Form */}
        <div className="lg:col-span-4 glass p-8 rounded-[2.5rem] border-white/5 space-y-6 sticky top-24">
          <h3 className="text-xl font-display font-bold text-white flex items-center">
            <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            New Convention
          </h3>
          
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Event Name</label>
              <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Tech Summit 2024" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                  <select className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}>
                     {ISRAELI_CITIES.map(city => <option key={city} value={city} className="bg-slate-900">{city}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Capacity</label>
                  <input required type="number" min="1" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" value={formData.maxCapacity} onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})} placeholder="100" />
               </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Address</label>
              <input required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="e.g. Rothschild 1" />
            </div>

            <button 
              disabled={creating} 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
            >
              {creating ? 'Initializing Node...' : 'Establish Convention'}
            </button>
          </form>
        </div>

        {/* Events List & Details */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-xl font-display font-bold text-white flex items-center">
            <svg className="w-5 h-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Active Registries
          </h3>

          {events.length === 0 ? (
            <div className="glass rounded-[2rem] p-12 text-center text-slate-500 border-white/5 italic">
              No active conventions detected in your registry.
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map(ev => {
                const isSelected = selectedEvent?._id === ev._id;
                const isFull = ev.connectedUsers.length >= ev.maxCapacity;
                
                return (
                  <div 
                    key={ev._id} 
                    onClick={() => setSelectedEvent(ev)}
                    className={`group glass rounded-2xl p-6 transition-all cursor-pointer border-white/5 hover:bg-white/[0.02] ${isSelected ? 'ring-2 ring-amber-500/50 bg-amber-500/[0.03]' : ''}`}
                  >
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                       <div className="space-y-1">
                          <h4 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{ev.name}</h4>
                          <div className="flex items-center text-slate-400 text-sm">
                             <svg className="w-4 h-4 mr-1 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             {ev.locationText || (ev.city && `${ev.city}${ev.address ? `, ${ev.address}` : ''}`)}
                          </div>
                       </div>
                       
                       <div className="flex items-center space-x-6">
                          <div className="text-right">
                             <div className={`text-lg font-black font-display ${isFull ? 'text-red-500' : 'text-emerald-500'}`}>
                                {ev.connectedUsers.length} <span className="text-xs text-slate-600">/ {ev.maxCapacity}</span>
                             </div>
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Capacity Status</div>
                          </div>
                          
                          <button 
                            onClick={(e) => handleDeleteEvent(e, ev._id)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                       </div>
                    </div>

                    {/* Participant Details (Expandable) */}
                    {isSelected && (
                      <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                           <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Connected Nodes</h5>
                           {ev.connectedUsers.length > 0 && <span className="text-[10px] font-bold text-slate-500">Live Updates Enabled</span>}
                        </div>
                        
                        {ev.connectedUsers.length === 0 ? (
                          <div className="bg-slate-900/40 rounded-xl p-4 text-center text-xs text-slate-600">No participants have initialized connection.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                             {ev.connectedUsers.map(u => (
                                <div key={u._id} className="flex items-center space-x-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                                   <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 border border-white/5">
                                      {u.firstName?.charAt(0)}
                                   </div>
                                   <div className="min-w-0">
                                      <div className="text-xs font-bold text-white truncate">{u.firstName} {u.lastName}</div>
                                      <div className="text-[10px] text-brand-400 truncate font-medium">{u.jobTitle || 'Visitor'}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

