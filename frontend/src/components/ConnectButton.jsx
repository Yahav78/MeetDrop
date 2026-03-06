import { useState } from 'react';

export default function ConnectButton({ onConnect }) {
  const [loadingLoc, setLoadingLoc] = useState(false);
  
  const handleConnectClick = () => {
    setLoadingLoc(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setLoadingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoadingLoc(false);
        onConnect(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLoadingLoc(false);
        console.error("Error obtaining location:", error);
        alert('Failed to get location. Please ensure location permissions are granted.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="connect-container">
      <div className="connect-btn-wrapper" onClick={loadingLoc ? undefined : handleConnectClick}>
        <div className="connect-glow"></div>
        <button disabled={loadingLoc} className="connect-btn">
          {loadingLoc ? (
             <div className="connect-loading-text">LOCATING...</div>
          ) : (
            <>
              <svg className="connect-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              <span className="connect-text">CONNECT</span>
            </>
          )}
        </button>
      </div>
      <p className="connect-desc">Ready to drop your profile to someone nearby. Ensure you are within 50 meters of another user.</p>
    </div>
  );
}
