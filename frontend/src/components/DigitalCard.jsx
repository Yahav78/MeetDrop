export default function DigitalCard({ user, onReset }) {
  if (!user) return null;

  return (
    <div className="card-wrapper">
      <div className="card-border-glow"></div>
      <div className="card-panel">
        <div className="card-success-header">
          <span className="card-success-text">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Match Confirmed
          </span>
        </div>

        <div className="card-avatar">
          <span>{user.name.charAt(0).toUpperCase()}</span>
        </div>

        <h2 className="card-name">{user.name}</h2>
        {user.jobTitle && <p className="card-job">{user.jobTitle}</p>}

        {user.bio && (
          <div className="card-bio-box">
            <p className="card-bio">&ldquo;{user.bio}&rdquo;</p>
          </div>
        )}

        <div className="card-links">
          {user.githubUrl && (
            <a href={user.githubUrl} target="_blank" rel="noopener noreferrer" className="link-github">GitHub</a>
          )}
          {user.linkedinUrl && (
            <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link-linkedin">LinkedIn</a>
          )}
        </div>

        <button onClick={onReset} className="btn-reset">
          Connect with someone else
        </button>
      </div>
    </div>
  );
}
