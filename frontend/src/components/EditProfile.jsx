import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EditProfile({ user, onUpdate }) {
  const [formData, setFormData] = useState({ name: '', jobTitle: '', bio: '', githubUrl: '', linkedinUrl: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
       setFormData({
         name: user.name || '',
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
    <div className="form-container glass-panel animate-fade-in-up" style={{ marginTop: '2rem' }}>
      <h2 className="form-title">Edit Profile</h2>
      <p className="form-subtitle">Update your digital business card.</p>
      
      <form onSubmit={handleSubmit} className="form-group-list">
        <div className="form-group">
          <label>Name *</label>
          <input required name="name" value={formData.name} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group">
          <label>Job Title</label>
          <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="form-textarea" />
        </div>
        <div className="form-group">
          <label>GitHub URL</label>
          <input name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="form-input" />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate('/')} className="btn-secondary" style={{ flex: 1, padding: '1rem' }}>Cancel</button>
          <button disabled={loading} type="submit" className="btn-primary" style={{ flex: 2, marginTop: '0' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
