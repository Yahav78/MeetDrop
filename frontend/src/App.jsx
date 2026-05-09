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
              // If we are here, it means the OTHER person rejected the connection
              // because the person who rejects calls handleDecline which sets state to IDLE immediately
              setErrorMsg(`${matchedUser?.firstName || 'The other person'} declined the match.`);
              setMatchingState('ERROR');
            }
          }
        } catch (err) { console.error(err); }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [matchingState, connectionId, matchedUser]);

  return (
    <>
      {matchingState === 'IDLE' && <ConnectButton onConnect={handleConnect} />}
      {matchingState === 'MATCHING' && <RadarLoading />}
      {matchingState === 'PENDING_CONFIRMATION' && (
        <ConfirmationCard user={matchedUser} onAccept={handleAccept} onDecline={handleDecline} />
      )}
      {matchingState === 'WAITING_FOR_OTHER' && (
        <div className="max-w-md w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="glass rounded-[2.5rem] p-10 border-brand-500/10 shadow-2xl text-center relative overflow-hidden group">
            {/* Pulsing Sync Glow */}
            <div className="absolute -inset-24 bg-brand-500/5 blur-[80px] rounded-full animate-pulse"></div>
            
            <div className="relative space-y-8">
              {/* Spinning Sync Icon */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-2 border-brand-500/10 border-b-brand-500/40 rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <svg className="w-8 h-8 text-brand-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                   </svg>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-display font-black text-white tracking-tight italic">Awaiting Confirmation</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  We've notified <span className="text-white font-bold">{matchedUser?.firstName}</span>. <br/> 
                  Stand by while the secure handshake completes.
                </p>
              </div>

              {/* Matched User Preview */}
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center space-x-4">
                 <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-brand-500 font-bold border border-brand-500/20">
                    {matchedUser?.firstName?.charAt(0)}
                 </div>
                 <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{matchedUser?.firstName} {matchedUser?.lastName}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{matchedUser?.jobTitle || 'Pro Member'}</div>
                 </div>
              </div>

              <div className="flex items-center justify-center space-x-2">
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleDecline}
            className="w-full text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            Cancel Handshake
          </button>
        </div>
      )}

      {matchingState === 'SUCCESS' && <DigitalCard user={matchedUser} onReset={() => setMatchingState('IDLE')} />}
      {matchingState === 'ERROR' && (
        <div className="max-w-md w-full mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="glass rounded-[2.5rem] p-10 border-red-500/10 shadow-2xl text-center relative overflow-hidden group">
            {/* Background Danger Glow */}
            <div className="absolute -inset-24 bg-red-500/5 blur-[80px] rounded-full group-hover:bg-red-500/10 transition-all"></div>
            
            <div className="relative space-y-6">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-500 shadow-lg shadow-red-500/5">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-display font-black text-white tracking-tight">Was not able to connect</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{errorMsg || "We couldn't establish a secure connection at this time."}</p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setMatchingState('IDLE')} 
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl border border-white/5 transition-all active:scale-[0.98] shadow-xl"
                >
                  Return to Radar
                </button>
              </div>
            </div>
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
  const [isDark, setIsDark] = useState(true); // Default to dark as requested
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };


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
    <div className={`min-h-screen bg-[var(--bg-dark)] text-[var(--text-primary)] selection:bg-brand-500/30`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-display font-black tracking-tight text-[var(--text-primary)] group-hover:text-brand-500 transition-colors hidden xs:block uppercase">MEETDROP</h1>
            </Link>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:scale-110 transition-all border border-slate-200 dark:border-white/5 shadow-sm"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {user || isAdmin || isOrganizer ? (
                <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-sm font-medium">
                  {!isAdmin && !isOrganizer && (
                    <nav className="flex items-center space-x-2 sm:space-x-4">
                      <Link to="/profile/edit" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white transition-colors py-1">Profile</Link>
                      <Link to="/history" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white transition-colors py-1">History</Link>
                      <Link to="/events" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white transition-colors py-1">Events</Link>
                    </nav>
                  )}
                  
                  {isOrganizer && (
                    <Link to="/organizer" className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white transition-colors">Dashboard</Link>
                  )}

                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700/50"></div>
                  
                  <button 
                    onClick={handleLogout} 
                    className="text-red-500 hover:text-red-400 transition-colors font-black uppercase text-[10px] tracking-wider"
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
