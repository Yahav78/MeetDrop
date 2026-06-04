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
        <div className="max-w-md w-full mx-auto mt-12 p-8 glass rounded-3xl animate-float">
            <div className="flex flex-col items-center mb-8">
                <h2 className="text-3xl font-display font-black text-[var(--text-primary)] tracking-tight text-center">Complete Profile</h2>
                <p className="text-[var(--text-secondary)] mt-2 text-center font-medium">Almost there! Choose a username and add your details.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">First Name *</label>
                        <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Last Name *</label>
                        <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Email</label>
                    <input name="email" value={formData.email} readOnly className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-secondary)] opacity-70 cursor-not-allowed focus:outline-none" />
                </div>

                <div className="space-y-1 relative">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Choose Username *</label>
                    <input required name="username" value={formData.username} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="jdoe99" />

                    {usernameStatus === 'checking' && <span className="text-slate-400 dark:text-slate-500 text-xs mt-1 ml-1 block">Checking availability...</span>}
                    {usernameStatus === 'available' && <span className="text-emerald-500 text-xs mt-1 ml-1 block">Username is available!</span>}
                    {usernameStatus === 'taken' && <span className="text-red-500 text-xs mt-1 ml-1 block">Username already taken. Please choose another.</span>}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <p className="text-[10px] font-black text-brand-500 dark:text-brand-400 uppercase tracking-[0.2em] mb-4 text-center">Professional Details</p>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Job Title</label>
                            <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="Software Engineer" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all h-24 resize-none" placeholder="I build web apps..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">GitHub URL</label>
                            <input name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="https://github.com/..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider ml-1">LinkedIn URL</label>
                            <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleChange} className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all" placeholder="https://linkedin.com/..." />
                        </div>
                    </div>
                </div>

                <button
                    disabled={loading || usernameStatus === 'taken' || !formData.username || usernameStatus === 'checking'}
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
                    ) : 'Complete Registration'}
                </button>
            </form>
        </div>
    );
}
