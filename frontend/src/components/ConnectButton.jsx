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
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="relative group cursor-pointer" onClick={loadingLoc ? undefined : handleConnectClick}>
        {/* Animated Background Glow */}
        <div className="absolute -inset-4 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-all animate-pulse"></div>
        
        {/* Outer Ring */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 border-brand-500/20 flex items-center justify-center p-4">
           <div className="absolute inset-0 rounded-full border border-brand-500/10 animate-[ping_3s_infinite]"></div>
           
           {/* Inner Button */}
           <button 
             disabled={loadingLoc}
             className="relative w-full h-full rounded-full bg-slate-900 border border-slate-700 shadow-2xl flex flex-col items-center justify-center group-active:scale-95 transition-all overflow-hidden"
           >
              {/* Inner Glow Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/10 via-transparent to-brand-400/5"></div>
              
              {loadingLoc ? (
                <div className="flex flex-col items-center">
                   <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-4"></div>
                   <span className="text-brand-400 font-display font-black tracking-[0.2em] text-sm">LOCATING...</span>
                </div>
              ) : (
                <>
                  <svg className="w-12 h-12 sm:w-16 sm:h-16 text-brand-500 mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  <span className="text-xl sm:text-2xl font-display font-black tracking-[0.25em] text-white">CONNECT</span>
                  <div className="mt-2 w-8 h-1 bg-brand-500 rounded-full"></div>
                </>
              )}
           </button>
        </div>
      </div>
      
      <div className="mt-12 max-w-sm space-y-4">
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Drop your profile to someone nearby. <br className="hidden sm:block" />
          Ensure you are within <span className="text-brand-400 font-bold">50 meters</span> of another user.
        </p>
        <div className="flex justify-center space-x-2">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-500/20"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-brand-500/40"></div>
           <div className="w-1.5 h-1.5 rounded-full bg-brand-500/20"></div>
        </div>
      </div>
    </div>
  );
}
