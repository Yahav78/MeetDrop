import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CompleteProfile({ onLogin }) {
    const location = useLocation();
    const navigate = useNavigate();
    const googleUser = location.state?.googleUserData;

    const [formData, setFormData] = useState({
        firstName: googleUser?.firstName || '',
        lastName: googleUser?.lastName || '',
        email: googleUser?.email || '',
        username: '',
        jobTitle: '',
        bio: '',
        githubUrl: '',
        linkedinUrl: ''
    });

    const [loading, setLoading] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'taken', or null
    const [usernameQuery, setUsernameQuery] = useState('');

    // Debounced Username Check
    useEffect(() => {
        const handler = setTimeout(async () => {
            if (usernameQuery.length > 2) {
                setUsernameStatus('checking');
                try {
                    const API_URL = import.meta.env.VITE_API_URL || '';
                    const res = await fetch(`${API_URL}/api/auth/check-username/${usernameQuery}`);
                    const data = await res.json();
                    setUsernameStatus(data.available ? 'available' : 'taken');
                } catch (err) {
                    console.error(err);
                    setUsernameStatus(null);
                }
            } else {
                setUsernameStatus(null);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [usernameQuery]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'username') {
            setUsernameQuery(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (usernameStatus === 'taken' || !formData.username) return;

        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('tempToken');

        try {
            const res = await fetch(`${API_URL}/api/auth/complete-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                // Successful profile completion
                // Cleanup temp token and login normally
                localStorage.removeItem('tempToken');
                onLogin({ token: token, user: data.user, isAdmin: false });
                navigate('/');
            } else {
                alert(data.error || 'Failed to complete profile');
            }
        } catch (err) {
            console.error(err);
            alert('Network error.');
        }
        setLoading(false);
    };

    // Prevent direct access if no google state
    if (!googleUser) {
        navigate('/login');
        return null;
    }

    return (
        <div className="form-container glass-panel animate-fade-in-up" style={{ marginTop: '2rem' }}>
            <h2 className="form-title">Complete Your Profile</h2>
            <p className="form-subtitle">Almost there! Choose a username and add your details.</p>

            <form onSubmit={handleSubmit} className="form-group-list">
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>First Name *</label>
                        <input required name="firstName" value={formData.firstName} onChange={handleChange} className="form-input" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Last Name *</label>
                        <input required name="lastName" value={formData.lastName} onChange={handleChange} className="form-input" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input name="email" value={formData.email} readOnly className="form-input" style={{ opacity: 0.7 }} />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                    <label>Choose Username *</label>
                    <input required name="username" value={formData.username} onChange={handleChange} className="form-input" placeholder="jdoe99" />

                    {usernameStatus === 'checking' && <span style={{ color: 'var(--slate-400)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Checking availability...</span>}
                    {usernameStatus === 'available' && <span style={{ color: 'var(--emerald-400)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Username is available!</span>}
                    {usernameStatus === 'taken' && <span style={{ color: 'var(--red-400)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>Username already taken. Please choose another.</span>}
                </div>

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

                <button
                    disabled={loading || usernameStatus === 'taken' || !formData.username || usernameStatus === 'checking'}
                    type="submit"
                    className="btn-primary"
                    style={{ marginTop: '1.5rem' }}
                >
                    {loading ? 'Processing...' : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
}
