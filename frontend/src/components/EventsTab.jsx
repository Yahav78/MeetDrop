import { useState, useEffect } from 'react';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default function EventsTab({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [connectingId, setConnectingId] = useState(null);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSortByDistance = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        
        const sorted = [...events].sort((a, b) => {
          const distA = getDistanceFromLatLonInKm(latitude, longitude, a.lat, a.lon);
          const distB = getDistanceFromLatLonInKm(latitude, longitude, b.lat, b.lon);
          return distA - distB;
        });
        setEvents(sorted);
      },
      (error) => {
        console.error("Error obtaining location:", error);
        alert('Failed to get location.');
      }
    );
  };

  const handleConnect = async (eventId) => {
    setConnectingId(eventId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}/connect`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      if (res.ok) {
        alert('Successfully connected to the event!');
        fetchEvents(); // Refresh list to show updated capacity
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to connect');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
    setConnectingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
        <h3 className="text-slate-400 font-display font-bold tracking-widest uppercase text-sm">Scanning Global Nodes...</h3>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-white tracking-tight">Events</h2>
          <p className="text-slate-400 mt-1">Discover and join physical networking nodes.</p>
        </div>
        <button 
          onClick={handleSortByDistance} 
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
        >
          Sort by Distance
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass rounded-[2rem] p-12 text-center text-slate-500 border-white/5 italic">
          No active networking events found in your vicinity.
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((ev) => {
            const isFull = ev.connectedUsers.length >= ev.maxCapacity;
            const isJoined = ev.connectedUsers.includes(currentUser._id);
            const distance = userLocation ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, ev.lat, ev.lon).toFixed(1) : null;

            return (
              <div key={ev._id} className="group glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-all border-white/5">
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">{ev.name}</h4>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-3 text-slate-400 text-sm">
                      <span className="flex items-center">
                         <svg className="w-4 h-4 mr-1 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         </svg>
                         {ev.locationText}
                      </span>
                      {distance && (
                        <span className="px-2 py-0.5 bg-slate-800 rounded-md text-[10px] font-bold text-slate-500 uppercase">
                           {distance} km
                        </span>
                      )}
                    </div>
                    {ev.organizerId && (
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <svg className="w-3.5 h-3.5 mr-1 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Organized by {ev.organizerId.firstName} {ev.organizerId.lastName}
                      </div>
                    )}
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-widest pt-1 ${isFull ? 'text-red-500/80' : 'text-emerald-500/80'}`}>
                    {ev.maxCapacity - ev.connectedUsers.length} Slots Available
                  </div>
                </div>

                <button 
                  disabled={isFull || isJoined || connectingId === ev._id}
                  onClick={() => handleConnect(ev._id)}
                  className={`px-8 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg ${
                    isJoined 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : (isFull ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed' : 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20')
                  }`}
                >
                  {connectingId === ev._id ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : (isJoined ? 'Joined' : (isFull ? 'Registry Full' : 'Initialize Connection'))}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

