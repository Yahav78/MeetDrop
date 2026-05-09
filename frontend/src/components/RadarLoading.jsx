export default function RadarLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 py-12 animate-in fade-in duration-700">
      {/* Futuristic Radar Animation */}
      <div className="relative w-48 h-48 sm:w-64 sm:h-64">
        {/* Outer Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 animate-ping"></div>
        <div className="absolute inset-4 rounded-full border border-brand-500/10 animate-[ping_3s_infinite_1s]"></div>
        
        {/* Radar Base */}
        <div className="absolute inset-0 rounded-full bg-slate-900/40 border border-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
          {/* Scanning Sweep */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/20 animate-[spin_4s_linear_infinite] origin-center"></div>
          
          {/* Grid Lines */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/2 left-0 w-full h-px bg-white"></div>
            <div className="absolute left-1/2 top-0 w-px h-full bg-white"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full border border-white"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full border border-white"></div>
          </div>
          
          {/* Searching Dots */}
          <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-brand-400 rounded-full animate-pulse blur-[1px]"></div>
          <div className="absolute bottom-1/3 left-1/4 w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse blur-[1px]" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Center Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-brand-500 rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)] z-10"></div>
      </div>

      {/* Status Text */}
      <div className="text-center space-y-3 max-w-xs mx-auto">
        <h3 className="text-2xl font-display font-bold text-white tracking-tight animate-pulse">Scanning the area...</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Broadcasting your node to nearby participants. <br/>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-500 mt-4 inline-block">Establishing Sync</span>
        </p>
      </div>
    </div>
  );
}

