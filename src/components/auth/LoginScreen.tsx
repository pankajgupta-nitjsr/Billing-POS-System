import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  Store,
  UserCheck,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, loginWithCashierCredentials, isAuthenticated, isOwner } = useAuth();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'OWNER' | 'CASHIER'>('OWNER');
  const [cashierIdentifier, setCashierIdentifier] = useState('CSH-101');
  const [cashierSecret, setCashierSecret] = useState('5678');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(isOwner ? '/' : '/pos', { replace: true });
    }
  }, [isAuthenticated, isOwner, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        navigate('/');
      } else {
        setErrorMsg(res.error || 'Google Authentication failed');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashierLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = loginWithCashierCredentials(cashierIdentifier, cashierSecret);
    setIsLoading(false);

    if (res.success) {
      navigate('/pos');
    } else {
      setErrorMsg(res.error || 'Invalid cashier login details');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Brand Header Banner */}
        <div className="p-6 bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl" />
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl text-amber-300 shadow-md mb-2">
            A2Z
          </div>
          <h2 className="text-xl font-black tracking-tight">{settings.name}</h2>
          <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
            Strict Multi-Tier POS &amp; Inventory Access Gate
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-[10px] text-emerald-300 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Authentication Required for POS Entry</span>
          </div>
        </div>

        {/* Tab Switcher: Owner (Google Auth) vs Cashier Terminal */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab('OWNER');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition ${
              tab === 'OWNER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Shop Owner (Admin)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('CASHIER');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-xl transition ${
              tab === 'CASHIER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Assigned Cashier
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'OWNER' ? (
            /* OWNER LOGIN WITH GOOGLE AUTH */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Shop Owner: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Chandan Kumar Gupta</span>
                </p>
                <p>
                  Access the full management suite, reports, floor prices, and assign cashier accounts with unique PINs.
                </p>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-800 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {/* Google Multi-Color SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google as Chandan Kumar Gupta</span>
              </button>

              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400">
                  Protected with Firebase OAuth &bull; Multi-Store Isolation
                </span>
              </div>
            </div>
          ) : (
            /* CASHIER TERMINAL LOGIN */
            <form onSubmit={handleCashierLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cashier Employee Code or Email
                </label>
                <input
                  type="text"
                  value={cashierIdentifier}
                  onChange={(e) => setCashierIdentifier(e.target.value)}
                  placeholder="e.g. CSH-101 or amit.cashier@a2zmart.in"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cashier PIN or Password
                </label>
                <input
                  type="password"
                  value={cashierSecret}
                  onChange={(e) => setCashierSecret(e.target.value)}
                  placeholder="Enter 4-6 digit assigned PIN or password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center justify-center gap-2 transition"
              >
                <span>Authorize &amp; Open POS Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Credentials Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-2">
            <span className="font-semibold text-slate-400 block text-center uppercase tracking-wider">
              Quick Test Credentials
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left transition"
              >
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Chandan Kumar Gupta
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Owner (Google Auth)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('CASHIER');
                  setCashierIdentifier('CSH-101');
                  setCashierSecret('5678');
                }}
                className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-left transition"
              >
                <span className="font-bold block text-slate-800 dark:text-slate-200">
                  Amit Kumar
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  Cashier (PIN: 5678)
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
