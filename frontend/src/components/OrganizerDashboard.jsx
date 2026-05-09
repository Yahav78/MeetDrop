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
  }, [selectedEvent]);

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

  if (loading) return <div className="loading-title" style={{ marginTop: '5rem' }}>Loading Dashboard...</div>;

  return (
    <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '64rem', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="form-title" style={{ textAlign: 'left', margin: 0, color: 'var(--amber-400)' }}>ORGANIZER DASHBOARD</h2>
            <p className="form-subtitle" style={{ textAlign: 'left', margin: 0 }}>Manage your events and participants</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
             <h3 className="form-title" style={{ textAlign: 'left', margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Create New Event</h3>
             <form onSubmit={handleCreateEvent} className="form-group-list">
                <div className="form-group">
                   <label>Event Name</label>
                   <input required className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                   <label>City</label>
                   <select className="form-input" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}>
                      {ISRAELI_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                   </select>
                </div>
                <div className="form-group">
                   <label>Address</label>
                   <input required className="form-input" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="e.g. Rothschild 1" />
                </div>
                <div className="form-group">
                   <label>Max Capacity</label>
                   <input required type="number" min="1" className="form-input" value={formData.maxCapacity} onChange={(e) => setFormData({...formData, maxCapacity: e.target.value})} />
                </div>
                <button disabled={creating} type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                   {creating ? 'Creating...' : 'Create Event'}
                </button>
             </form>
          </div>

          <div style={{ flex: '2 1 400px' }}>
             <h3 className="form-title" style={{ textAlign: 'left', margin: '0 0 1rem 0', fontSize: '1.25rem' }}>My Events</h3>
             {events.length === 0 ? (
                <p style={{ color: 'var(--slate-500)' }}>You haven't created any events yet.</p>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {events.map(ev => (
                      <div key={ev._id} 
                           onClick={() => setSelectedEvent(ev)}
                           style={{ 
                             padding: '1rem', 
                             background: selectedEvent?._id === ev._id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(30,41,59,0.5)', 
                             borderRadius: '0.75rem', 
                             border: '1px solid rgba(255,255,255,0.1)',
                             cursor: 'pointer'
                           }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: 'var(--white)' }}>{ev.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                               <span style={{ fontSize: '0.8rem', color: ev.connectedUsers.length >= ev.maxCapacity ? 'var(--red-400)' : 'var(--emerald-400)' }}>
                                  {ev.connectedUsers.length} / {ev.maxCapacity}
                               </span>
                               <button 
                                 onClick={(e) => handleDeleteEvent(e, ev._id)}
                                 style={{ background: 'none', border: 'none', color: 'var(--red-500)', cursor: 'pointer', padding: '0.25rem' }}
                               >
                                 <svg style={{ width: '1rem', height: '1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                            </div>
                         </div>
                         <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--slate-400)' }}>📍 {ev.locationText}</p>
                      </div>
                   ))}
                </div>
             )}

             {selectedEvent && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(15,23,42,0.6)', borderRadius: '0.75rem', border: '1px solid var(--slate-700)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--white)' }}>Live Participants: {selectedEvent.name}</h4>
                      <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--slate-400)', cursor: 'pointer' }}>Close</button>
                   </div>
                   {selectedEvent.connectedUsers.length === 0 ? (
                      <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>No users have connected yet.</p>
                   ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {selectedEvent.connectedUsers.map(u => (
                            <li key={u._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                               <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'white' }}>
                                  {u.firstName?.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <div style={{ color: 'var(--white)', fontSize: '0.9rem' }}>{u.firstName} {u.lastName}</div>
                                  <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>{u.jobTitle || 'No title'}</div>
                               </div>
                            </li>
                         ))}
                      </ul>
                   )}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
