import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import AuthScreens from './components/AuthScreens';
import EditProfile from './components/EditProfile';
import HistoryView from './components/HistoryView';
import CompleteProfile from './components/CompleteProfile';
import AdminDashboard from './components/AdminDashboard';
import ConnectButton from './components/ConnectButton';
import RadarLoading from './components/RadarLoading';
import DigitalCard from './components/DigitalCard';
import ConfirmationCard from './components/ConfirmationCard';
import OrganizerDashboard from './components/OrganizerDashboard';
import EventsTab from './components/EventsTab';

function MainApp({ user }) {
  const [matchingState, setMatchingState] = useState('IDLE'); // States: IDLE, MATCHING, PENDING_CONFIRMATION, WAITING_FOR_OTHER, SUCCESS, ERROR
  const [matchedUser, setMatchedUser] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConnect = async (lat, lon) => {
    setMatchingState('MATCHING');
    setErrorMsg('');
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, lat, lon })
      });
      const data = await res.json();
      if (res.ok) {
        setMatchedUser(data.match);
        setConnectionId(data.connectionId);
        if (data.status === 'pending') {
          setMatchingState('PENDING_CONFIRMATION');
        } else {
          setMatchingState('SUCCESS');
        }
      } else {
        setErrorMsg(data.error || 'Match failed');
        setMatchingState('ERROR');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection lost.');
      setMatchingState('ERROR');
    }
  };

  const handleAccept = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/connections/${connectionId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id })
      });
      if (res.ok) {
        const conn = await res.json();
        if (conn.status === 'accepted') {
          setMatchingState('SUCCESS');
        } else {
          setMatchingState('WAITING_FOR_OTHER');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      await fetch(`${API_URL}/api/connections/${connectionId}/reject`, { method: 'POST' });
    } catch (err) { console.error(err); }
    setMatchingState('IDLE');
  };

  useEffect(() => {
    let interval;
    if ((matchingState === 'WAITING_FOR_OTHER' || matchingState === 'PENDING_CONFIRMATION') && connectionId) {
      interval = setInterval(async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${API_URL}/api/connections/${connectionId}`);
          if (res.ok) {
            const conn = await res.json();
            if (conn.status === 'accepted') {
              setMatchingState('SUCCESS');
            } else if (conn.status === 'rejected') {
              setErrorMsg('The other person declined the match.');
              setMatchingState('ERROR');
            }
          }
        } catch (err) { console.error(err); }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [matchingState, connectionId]);

  return (
    <>
      {matchingState === 'IDLE' && <ConnectButton onConnect={handleConnect} />}
      {matchingState === 'MATCHING' && <RadarLoading />}
      {matchingState === 'PENDING_CONFIRMATION' && (
        <ConfirmationCard user={matchedUser} onAccept={handleAccept} onDecline={handleDecline} />
      )}
      {matchingState === 'WAITING_FOR_OTHER' && (
        <div className="radar-container animate-fade-in-up">
          <div className="radar-sweep" style={{ animationDuration: '4s' }}></div>
          <h3 className="loading-title">Waiting for response...</h3>
        </div>
      )}
      {matchingState === 'SUCCESS' && <DigitalCard user={matchedUser} onReset={() => setMatchingState('IDLE')} />}
      {matchingState === 'ERROR' && (
        <div className="error-container">
          <div className="error-icon-wrapper">
            <svg className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="text-center">
            <h2 className="error-title">Connection Failed</h2>
            <p className="error-desc">{errorMsg}</p>
            <button onClick={() => setMatchingState('IDLE')} className="btn-secondary">Try again</button>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      // Basic auth restore from localstorage for MVP
      const storedUser = localStorage.getItem('user');
      const storedAdmin = localStorage.getItem('isAdmin') === 'true';
      const storedOrganizer = localStorage.getItem('isOrganizer') === 'true';
      
      if (storedUser && !storedAdmin && !storedOrganizer) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); // Optimistic load
          
          // Fetch latest data from backend to prevent stale data across devices
          const API_URL = import.meta.env.VITE_API_URL || '';
          const res = await fetch(`${API_URL}/api/users/${parsedUser._id}`);
          if (res.ok) {
            const latestUser = await res.json();
            if (!latestUser.favorites) latestUser.favorites = [];
            if (!latestUser.hiddenConnections) latestUser.hiddenConnections = [];
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
            if (latestUser.role === 'organizer') {
              setIsOrganizer(true);
              localStorage.setItem('isOrganizer', 'true');
            }
          }
        } catch (err) {
          console.error('Error fetching latest user data:', err);
        }
      }
      
      setIsAdmin(storedAdmin);
      setIsOrganizer(storedOrganizer);
      setLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = (data) => {
    if (data.isAdmin) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    } else if (data.user?.role === 'organizer') {
      setIsOrganizer(true);
      localStorage.setItem('isOrganizer', 'true');
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      const u = data.user;
      if (!u.favorites) u.favorites = [];
      if (!u.hiddenConnections) u.hiddenConnections = [];
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    }
    localStorage.setItem('token', data.token);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setIsOrganizer(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isOrganizer');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const updateLocalUser = (updatedUser) => {
    if (!updatedUser.favorites) updatedUser.favorites = [];
    if (!updatedUser.hiddenConnections) updatedUser.hiddenConnections = [];
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-brand-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-display font-bold tracking-tight text-white group-hover:text-brand-400 transition-colors">MEETDROP</h1>
            </Link>

            <div className="flex items-center space-x-4">
              {user || isAdmin || isOrganizer ? (
                <div className="flex items-center space-x-1 sm:space-x-3 text-xs sm:text-sm font-medium">
                  <div className="hidden sm:flex items-center px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                    {isAdmin ? 'Overseer' : (isOrganizer ? 'Organizer' : 'Online')}
                  </div>

                  {!isAdmin && !isOrganizer && (
                    <nav className="flex items-center space-x-1 sm:space-x-4">
                      <Link to="/profile/edit" className="text-slate-400 hover:text-white transition-colors py-1">Profile</Link>
                      <Link to="/history" className="text-slate-400 hover:text-white transition-colors py-1">History</Link>
                      <Link to="/events" className="text-slate-400 hover:text-white transition-colors py-1">Events</Link>
                    </nav>
                  )}
                  
                  {isOrganizer && (
                    <Link to="/organizer" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
                  )}

                  <div className="w-px h-4 bg-slate-700/50"></div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="text-red-400 hover:text-red-300 transition-colors font-bold uppercase text-[10px] sm:text-xs tracking-wider"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center text-xs font-medium text-slate-500 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-slate-600 rounded-full mr-2"></div>
                  Disconnected
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Routes>
          <Route path="/login" element={(!user && !isAdmin) ? <AuthScreens onLogin={handleLogin} /> : <Navigate to={isAdmin ? "/admin" : "/"} />} />
          <Route path="/register" element={(!user && !isAdmin) ? <AuthScreens onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/complete-profile" element={<CompleteProfile onLogin={handleLogin} />} />

          {/* Protected Normal Routes */}
          <Route path="/" element={user ? (isOrganizer ? <Navigate to="/organizer" /> : <MainApp user={user} />) : <Navigate to="/login" />} />
          <Route path="/profile/edit" element={user ? <EditProfile user={user} onUpdate={updateLocalUser} /> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <HistoryView user={user} onUpdate={updateLocalUser} /> : <Navigate to="/login" />} />
          <Route path="/events" element={user ? <EventsTab currentUser={user} /> : <Navigate to="/login" />} />

          {/* Protected Admin Route */}
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />

          {/* Protected Organizer Route */}
          <Route path="/organizer" element={isOrganizer ? <OrganizerDashboard /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to={user ? (isOrganizer ? "/organizer" : "/") : (isAdmin ? "/admin" : "/login")} />} />
        </Routes>
      </main>
    </div>
  );
}


export default App;
