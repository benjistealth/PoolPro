import React from 'react';
import { LogIn, LogOut, Chrome, Apple, Disc, Mail } from 'lucide-react';

interface AuthTileProps {
  user: { name: string; email: string; photo?: string } | null;
  onLogin: (provider: string) => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  themeColor: string;
  deviceInfo: any;
}

export const AuthTile: React.FC<AuthTileProps> = ({ 
  user, onLogin, onLogout, isLoggingIn, themeColor, deviceInfo 
}) => {
  return (
    <section className="space-y-6">
      <h3 
        className="font-black uppercase tracking-widest pb-4 border-b-2 text-left w-full"
        style={{ 
          borderImage: `linear-gradient(to right, ${themeColor} 50%, transparent 50%) 1`, 
          color: 'white',
          fontSize: deviceInfo.titleSizes.section
        }}
      >
        Login
      </h3>
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl px-6 py-6 shadow-xl relative overflow-hidden group">
        {/* Glow Effect */}
        <div 
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20"
          style={{ backgroundColor: themeColor }}
        />

        {user ? (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center p-1">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover rounded-xl shadow-lg ring-1 ring-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-xl bg-slate-700 flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-400">{user.name[0]}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-900 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="text-xl font-black text-white uppercase tracking-tight">{user.name}</h4>
                <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[0.6rem] font-black text-emerald-400 uppercase tracking-widest">Admin Privileges</div>
              </div>
              <p className="text-sm font-bold text-slate-400">{user.email}</p>
            </div>

            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-red-400/5 hover:bg-red-400/10 border border-red-400/10 rounded-2xl text-red-400/60 hover:text-red-400 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center sm:text-left space-y-2">
              <h4 className="text-xl font-black text-white uppercase tracking-tight">Login</h4>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Authenticate to access admin controls, advanced tournament settings, and secure cloud synchronization.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => onLogin('google')}
                disabled={isLoggingIn}
                className="group relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Chrome className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Continue with</span>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">Google</span>
                </div>
              </button>

              <button 
                onClick={() => onLogin('apple')}
                disabled={isLoggingIn}
                className="group relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Continue with</span>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">Apple ID</span>
                </div>
              </button>

              <button 
                onClick={() => onLogin('facebook')}
                disabled={isLoggingIn}
                className="group relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Disc className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Continue with</span>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">Facebook</span>
                </div>
              </button>

              <button 
                onClick={() => onLogin('email')}
                disabled={isLoggingIn}
                className="group relative flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[0.6rem] font-black text-slate-500 uppercase tracking-widest mb-1">Continue with</span>
                  <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-amber-400 transition-colors">Email</span>
                </div>
              </button>
            </div>
            
            <p className="text-[0.6rem] font-bold text-slate-600 text-center uppercase tracking-widest">
              By signing in you agree to our <span className="text-slate-400">Terms of Service</span>
            </p>
          </div>
        )}

        {isLoggingIn && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[0.6rem] font-black text-emerald-400 uppercase tracking-[0.3em] animate-pulse">Launching Secure Portal</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
