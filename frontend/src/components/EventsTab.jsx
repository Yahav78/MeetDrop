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

  if (loading) return <div className="loading-title">Loading Events...</div>;

  return (
    <div className="animate-fade-in-up w-full" style={{ maxWidth: '40rem', marginTop: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="form-title" style={{ textAlign: 'left', margin: 0 }}>AVAILABLE EVENTS</h2>
            <p className="form-subtitle" style={{ textAlign: 'left', margin: 0 }}>Discover conferences and meetups</p>
          </div>
          <button onClick={handleSortByDistance} className="btn-secondary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
            Sort by Distance
          </button>
        </div>

        {events.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '2rem' }}>No active events found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((ev) => {
              const isFull = ev.connectedUsers.length >= ev.maxCapacity;
              const isJoined = ev.connectedUsers.includes(currentUser._id);
              const distance = userLocation ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, ev.lat, ev.lon).toFixed(1) : null;

              return (
                <div key={ev._id} className="history-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--white)', fontSize: '1.1rem' }}>{ev.name}</h4>
                    <p style={{ margin: '0.25rem 0', color: 'var(--slate-400)', fontSize: '0.85rem' }}>📍 {ev.locationText} {distance && `(${distance} km away)`}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: isFull ? 'var(--red-400)' : 'var(--emerald-400)' }}>
                      {ev.maxCapacity - ev.connectedUsers.length} spots remaining
                    </p>
                  </div>
                  <button 
                    disabled={isFull || isJoined || connectingId === ev._id}
                    onClick={() => handleConnect(ev._id)}
                    className={isJoined ? "btn-secondary" : "btn-primary"}
                    style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    {connectingId === ev._id ? '...' : (isJoined ? 'Joined' : (isFull ? 'Full' : 'Connect'))}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
