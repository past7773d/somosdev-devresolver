import React from 'react';
import { User } from 'firebase/auth';
import { LogIn, LogOut, Terminal, History, ShieldCheck, Share2 } from 'lucide-react';
import { loginWithGoogle, logoutUser } from '@/src/services/firebase.ts';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenHistory: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenHistory,
  savedCount,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        await logoutUser();
      } else {
        await loginWithGoogle();
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Terminal className="w-4 h-4" />
          </div>
          <button
            onClick={() => setActiveTab('overview')}
            className="text-base font-bold tracking-tight text-white hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded text-left"
          >
            SOMOSDEV <span className="text-sky-400">DevResolver</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-xs lg:text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white ${
              activeTab === 'overview' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white flex items-center gap-1 ${
              activeTab === 'pipeline' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pipeline & OCON</span>
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white flex items-center gap-1 ${
              activeTab === 'dispatch' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Anúncios Devs</span>
          </button>
          <button
            onClick={() => setActiveTab('appsheet')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white ${
              activeTab === 'appsheet' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            AppSheet PDF Fixer
          </button>
          <button
            onClick={() => setActiveTab('dataplex')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white ${
              activeTab === 'dataplex' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Dataplex
          </button>
          <button
            onClick={() => setActiveTab('arcade')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors hover:text-white ${
              activeTab === 'arcade' ? 'text-sky-400 border-b-2 border-sky-400 font-semibold' : 'text-slate-400'
            }`}
          >
            Arcade Hub
          </button>
        </nav>

        {/* Zone 3: Primary Action & User Status */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser && (
            <button
              onClick={onOpenHistory}
              title="Ver diagnósticos salvos"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-750 hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Salvos</span>
              <span className="font-mono text-slate-400">({savedCount})</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {currentUser.displayName || 'Dev'}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                  {currentUser.email}
                </span>
              </div>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Avatar'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                  {currentUser.displayName?.[0] || 'U'}
                </div>
              )}
              <button
                onClick={handleAuth}
                disabled={loading}
                title="Sair da conta"
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-900"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAuth}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar com Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
