import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthScreens({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', // Auth
    name: '', jobTitle: '', bio: '', githubUrl: '', linkedinUrl: '' // Profile
  });

  const handleChange = (e) => setFormData(prev => ({...prev, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
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

  return (
    <div className="form-container glass-panel animate-fade-in-up" style={{ marginTop: '2rem' }}>
      <div className="form-icon-wrapper">
        <div className="form-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
      </div>
      <h2 className="form-title">MeetDrop</h2>
      <p className="form-subtitle">{isLogin ? 'Authenticate to connect' : 'Create your network identity'}</p>
      
      <form onSubmit={handleSubmit} className="form-group-list">
        {!isLogin && (
           <>
              <div className="form-group">
                <label>Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Jane Doe" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" placeholder="jane@example.com" />
              </div>
           </>
        )}
        <div className="form-group">
          <label>Username *</label>
          <input required name="username" value={formData.username} onChange={handleChange} className="form-input" placeholder="jdoe99" />
        </div>
        <div className="form-group">
           <label>Password *</label>
           <input required type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" placeholder="••••••••" />
        </div>

        {!isLogin && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <p style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', marginBottom: '1rem', textAlign: 'center' }}>PROFESSIONAL DETAILS</p>
             <div className="form-group-list">
               <div className="form-group">
                 <label>Job Title</label>
                 <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="form-input" placeholder="Software Engineer" />
               </div>
               <div className="form-group">
                 <label>Bio</label>
                 <textarea name="bio" value={formData.bio} onChange={handleChange} className="form-textarea" placeholder="I build web apps..." />
               </div>
               <div className="form-group">
                 <label>GitHub URL</label>
                 <input name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="form-input" placeholder="https://github.com/..." />
               </div>
               <div className="form-group">
                 <label>LinkedIn URL</label>
                 <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="form-input" placeholder="https://linkedin.com/..." />
               </div>
             </div>
          </div>
        )}

        <button disabled={loading} type="submit" className="btn-primary" style={{ marginTop: '1.5rem' }}>
          {loading ? 'Processing...' : (isLogin ? 'Login to Network' : 'Register Profile')}
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
         <button className="btn-reset" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
         </button>
      </div>
    </div>
  );
}
