import { useState } from 'react';

export default function ProfileSetup({ onComplete }) {
  const [formData, setFormData] = useState({ name: '', jobTitle: '', bio: '', githubUrl: '', linkedinUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) { onComplete(data._id); } else { alert(data.error || 'Registration failed'); }
    } catch (err) {
      console.error(err); alert('Failed to save profile. Check connection.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="form-container glass-panel animate-fade-in-up">
      <div className="form-icon-wrapper">
        <div className="form-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <h2 className="form-title">MeetDrop</h2>
      <p className="form-subtitle">Create your digital card to start networking nearby.</p>
      
      <form onSubmit={handleSubmit} className="form-group-list">
        <div className="form-group">
          <label>Name *</label>
          <input required name="name" value={formData.name} onChange={handleChange} className="form-input" placeholder="Jane Doe" />
        </div>
        <div className="form-group">
          <label>Job Title</label>
          <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="form-input" placeholder="Software Engineer" />
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} className="form-textarea" placeholder="I love building scalable web apps..." />
        </div>
        <div className="form-group">
          <label>GitHub URL</label>
          <input name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="form-input" placeholder="https://github.com/janedoe" />
        </div>
        <div className="form-group">
          <label>LinkedIn URL</label>
          <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="form-input" placeholder="https://linkedin.com/in/janedoe" />
        </div>
        <button disabled={loading} type="submit" className="btn-primary">
          {loading ? 'Initializing Interface...' : 'Enter the Grid'}
        </button>
      </form>
    </div>
  );
}
