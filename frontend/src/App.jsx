import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import AuthScreens from './components/AuthScreens';
import EditProfile from './components/EditProfile';
import HistoryView from './components/HistoryView';
import AdminDashboard from './components/AdminDashboard';
import ConnectButton from './components/ConnectButton';
import RadarLoading from './components/RadarLoading';
import DigitalCard from './components/DigitalCard';

function MainApp({ user }) {
  const [matchingState, setMatchingState] = useState('IDLE');
  const [matchedUser, setMatchedUser] = useState(null);
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
        setMatchingState('SUCCESS');
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

  return (
    <>
      {matchingState === 'IDLE' && <ConnectButton onConnect={handleConnect} />}
      {matchingState === 'MATCHING' && <RadarLoading />}
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Basic auth restore from localstorage for MVP
    const storedUser = localStorage.getItem('user');
    const storedAdmin = localStorage.getItem('isAdmin') === 'true';
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsAdmin(storedAdmin);
    setLoading(false);
  }, []);

  const handleLogin = (data) => {
    if (data.isAdmin) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
    } else {
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    localStorage.setItem('token', data.token);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const updateLocalUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (loading) return null;

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="bg-layer-1"></div>
      <div className="bg-layer-2"></div>
      <div className="bg-layer-3"></div>
      <div className="bg-layer-4"></div>

      <header className="header">
         <div className="header-container">
           <Link to="/" style={{ textDecoration: 'none' }}>
             <h1 className="logo-title">MEETDROP</h1>
           </Link>
           <div className="status-indicator-wrap">
             {user || isAdmin ? (
               <>
                 <div className="status-indicator status-online"></div>
                 <span className="status-text">{isAdmin ? 'Overseer' : 'Online'}</span>
                 {!isAdmin && (
                   <>
                     <span style={{ color: 'var(--slate-700)', margin: '0 0.5rem' }}>|</span>
                     <Link to="/profile/edit" style={{ color: 'var(--slate-400)', fontSize: '0.75rem', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>Edit Profile</Link>
                     <span style={{ color: 'var(--slate-700)', margin: '0 0.5rem' }}>|</span>
                     <Link to="/history" style={{ color: 'var(--slate-400)', fontSize: '0.75rem', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600 }}>History</Link>
                   </>
                 )}
                 <span style={{ color: 'var(--slate-700)', margin: '0 0.5rem' }}>|</span>
                 <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-500)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, padding: 0 }}>Logout</button>
               </>
             ) : (
               <>
                 <div className="status-indicator status-offline"></div>
                 <span className="status-text">Offline</span>
               </>
             )}
           </div>
         </div>
      </header>

      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Routes>
          <Route path="/login" element={(!user && !isAdmin) ? <AuthScreens onLogin={handleLogin} /> : <Navigate to={isAdmin ? "/admin" : "/"} />} />
          <Route path="/register" element={(!user && !isAdmin) ? <AuthScreens onLogin={handleLogin} /> : <Navigate to="/" />} />
          
          {/* Protected Normal Routes */}
          <Route path="/" element={user ? <MainApp user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile/edit" element={user ? <EditProfile user={user} onUpdate={updateLocalUser} /> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <HistoryView user={user} /> : <Navigate to="/login" />} />
          
          {/* Protected Admin Route */}
          <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to={user ? "/" : (isAdmin ? "/admin" : "/login")} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
