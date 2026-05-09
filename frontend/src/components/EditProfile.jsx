import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EditProfile({ user, onUpdate }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', jobTitle: '', bio: '', githubUrl: '', linkedinUrl: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        jobTitle: user.jobTitle || '',
        bio: user.bio || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        alert('Profile updated!');
        navigate('/');
      } else {
        alert(data.error || 'Update failed');
      }
    } catch (err) {
      console.error(err); alert('Network Error');
    }
    setLoading(false);
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="max-w-2xl w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center sm:text-left">
        <h2 className="text-4xl font-display font-black text-white tracking-tight">Edit Profile</h2>
        <p className="text-slate-400 mt-1">Update your professional identity on the network.</p>
      </div>

      <div className="glass p-8 rounded-[2.5rem] border-white/5 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">First Name *</label>
              <input 
                required 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name *</label>
              <input 
                required 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
            <input 
              name="jobTitle" 
              value={formData.jobTitle} 
              onChange={handleChange} 
              placeholder="e.g. Senior Software Engineer"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              placeholder="Tell the community about yourself..."
              rows={3}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all resize-none" 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">GitHub URL</label>
              <input 
                name="githubUrl" 
                value={formData.githubUrl} 
                onChange={handleChange} 
                placeholder="https://github.com/..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">LinkedIn URL</label>
              <input 
                name="linkedinUrl" 
                value={formData.linkedinUrl} 
                onChange={handleChange} 
                placeholder="https://linkedin.com/in/..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-white/5"
            >
              Cancel
            </button>
            <button 
              disabled={loading} 
              type="submit" 
              className="flex-[2] bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Synchronizing...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

