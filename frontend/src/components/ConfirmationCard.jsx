export default function ConfirmationCard({ user, onAccept, onDecline, loading }) {
  if (!user) return null;

  return (
    <div className="card-wrapper animate-fade-in-up">
      <div className="card-border-glow" style={{ opacity: 0.5 }}></div>
      <div className="card-panel">
        <div className="card-success-header" style={{ background: 'var(--amber-500)' }}>
          <span className="card-success-text">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Potential Match Found
          </span>
        </div>

        <div className="card-avatar">
          <span>{user.firstName?.charAt(0).toUpperCase()}</span>
        </div>

        <h2 className="card-name">{user.firstName} {user.lastName}</h2>
        {user.jobTitle && <p className="card-job">{user.jobTitle}</p>}

        {user.bio && (
          <div className="card-bio-box">
            <p className="card-bio">&ldquo;{user.bio}&rdquo;</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%' }}>
          <button 
            onClick={onDecline} 
            disabled={loading}
            className="btn-secondary" 
            style={{ flex: 1, margin: 0, padding: '0.75rem', borderColor: 'var(--red-500)', color: 'var(--red-400)' }}
          >
            Decline
          </button>
          <button 
            onClick={onAccept} 
            disabled={loading}
            className="btn-primary" 
            style={{ flex: 1, margin: 0, padding: '0.75rem' }}
          >
            {loading ? 'Confirming...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
