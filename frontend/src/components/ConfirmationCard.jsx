export default function ConfirmationCard({ user, onAccept, onDecline, loading }) {
  if (!user) return null;

  return (
    <div className="max-w-md w-full mx-auto relative group animate-float">
      {/* Decorative Outer Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-brand-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      <div className="relative glass rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Info Header Banner */}
        <div className="bg-amber-500/20 py-3 flex items-center justify-center space-x-2 border-b border-amber-500/20">
           <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
           </div>
           <span className="text-amber-400 font-bold text-xs uppercase tracking-[0.2em]">Potential Match Found</span>
        </div>

        <div className="p-8 flex flex-col items-center">
           {/* Avatar Section */}
           <div className="relative mb-6">
              <div className="absolute -inset-4 bg-brand-500/10 rounded-full blur-xl"></div>
              <div className="relative w-24 h-24 bg-slate-800 border-2 border-brand-500 rounded-full flex items-center justify-center text-4xl font-display font-bold text-brand-500 shadow-xl">
                 {user.firstName?.charAt(0).toUpperCase()}
              </div>
           </div>

           {/* User Info */}
           <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl font-display font-black text-white tracking-tight">{user.firstName} {user.lastName}</h2>
              {user.jobTitle && (
                <div className="inline-block px-3 py-1 bg-brand-500/10 text-brand-400 rounded-lg text-sm font-semibold tracking-wide border border-brand-500/10">
                   {user.jobTitle}
                </div>
              )}
           </div>

           {/* Bio Section */}
           {user.bio && (
             <div className="w-full bg-slate-100 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-white/5 mb-8 italic text-[var(--text-secondary)] text-center text-sm leading-relaxed">
                &ldquo;{user.bio}&rdquo;
             </div>
           )}

           {/* Action Buttons */}
           <div className="grid grid-cols-2 gap-4 w-full">
              <button 
                onClick={onDecline} 
                disabled={loading}
                className="flex items-center justify-center py-4 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl border border-white/5 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="font-bold text-sm uppercase tracking-widest">Decline</span>
              </button>
              <button 
                onClick={onAccept} 
                disabled={loading}
                className="flex items-center justify-center py-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="font-bold text-sm uppercase tracking-widest">Accept</span>
                )}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

