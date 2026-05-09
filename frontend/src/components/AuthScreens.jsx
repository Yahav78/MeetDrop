import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthScreens({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', // Auth
    firstName: '', lastName: '', jobTitle: '', bio: '', githubUrl: '', linkedinUrl: '' // Profile
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use an empty string fallback so Vercel uses the relative '/api' path as configured in vercel.json
    const API_URL = import.meta.env.VITE_API_URL || '';
    const endpoint = isLogin ? `${API_URL}/api/auth/login` : `${API_URL}/api/auth/register`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          onLogin(data);
          if (data.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          alert('Registration successful! Please login.');
          setIsLogin(true);
        }
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    // Use an empty string fallback so Vercel uses the relative '/api' path
    const API_URL = import.meta.env.VITE_API_URL || '';
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requiresProfileSetup) {
          // Temporarily store token so CompleteProfile can use it, but don't perform full `onLogin` yet.
          localStorage.setItem('tempToken', data.token);
          navigate('/complete-profile', { state: { googleUserData: data.user } });
        } else {
          onLogin(data);
          if (data.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      } else {
        alert(data.error || 'Google Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during Google Auth.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md w-full mx-auto mt-12 p-8 glass rounded-3xl animate-float">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <h2 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight">MeetDrop</h2>
        <p className="text-[var(--text-secondary)] mt-2 text-center font-medium">{isLogin ? 'Authenticate to connect' : 'Create your network identity'}</p>
      </div>

      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => alert('Google Login Failed')}
          useOneTap
        />
      </div>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-slate-700/50"></div>
        <span className="px-4 text-xs text-slate-500 uppercase tracking-widest font-semibold">or</span>
        <div className="flex-1 h-px bg-slate-700/50"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">First Name</label>
                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="Jane" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Last Name</label>
                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="jane@example.com" />
            </div>
          </>
        )}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Username</label>
          <input required name="username" value={formData.username} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="jdoe99" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Password</label>
          <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="••••••••" />
        </div>

        {!isLogin && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em] mb-4 text-center">Professional Details</p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Title</label>
                <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="Software Engineer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all h-24 resize-none" placeholder="I build web apps..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">GitHub</label>
                <input name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="https://github.com/..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">LinkedIn</label>
                <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="https://linkedin.com/..." />
              </div>
            </div>
          </div>
        )}

        <button 
          disabled={loading} 
          type="submit" 
          className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
             <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
             </div>
          ) : (isLogin ? 'Login to Network' : 'Create Profile')}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button 
          className="text-brand-400 hover:text-brand-300 font-semibold text-sm transition-colors" 
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "New to the network? Join now" : 'Already a member? Sign In'}
        </button>
      </div>
    </div>
  );
}

