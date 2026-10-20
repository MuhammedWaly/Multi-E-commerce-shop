import React, { useState } from 'react';
import { api, type UserDto } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserDto) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'Customer' | 'Merchant'>('Customer');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStoreNameChange = (name: string) => {
    setStoreName(name);
    setStoreSlug(name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.login({ email: demoEmail, password: 'Password123!' });
      setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
      setTimeout(() => {
        onAuthSuccess(res.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signin') {
        const res = await api.login({ email, password });
        setSuccessMsg(`Welcome back, ${res.user.fullName}!`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 700);
      } else {
        const res = await api.register({
          email,
          password,
          fullName,
          role,
          storeName: role === 'Merchant' ? storeName : undefined,
          storeSlug: role === 'Merchant' ? storeSlug : undefined,
        });
        setSuccessMsg(
          role === 'Merchant'
            ? `Store "${storeName}" created! Welcome to your Seller Portal.`
            : `Account created successfully! Welcome, ${fullName}.`
        );
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 900);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-2xl mb-1 shadow-inner">
            🔐
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Join SocialHub Egypt'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'signin'
              ? 'Access your saved discoveries, orders, and storefront portal'
              : 'Discover artisanal fashion & leather or launch your boutique'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error & Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs text-center font-bold">
            ✓ {successMsg}
          </div>
        )}

        {/* Semantic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sign-up specific: Role Switcher */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">I want to:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('Customer')}
                  className={`p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
                    role === 'Customer'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">🛍️ Shop & Discover</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Explore curated local brands</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Merchant')}
                  className={`p-3 rounded-2xl border text-xs text-left transition-all cursor-pointer ${
                    role === 'Merchant'
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">🏬 Sell & Manage</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Open independent store</p>
                </button>
              </div>
            </div>
          )}

          {/* Full Name (Sign Up only) */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-fullname" className="text-xs font-semibold text-slate-300 block">
                Full Name
              </label>
              <input
                id="auth-fullname"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Layla Nour"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Merchant Store Fields (Sign Up as Merchant only) */}
          {mode === 'signup' && role === 'Merchant' && (
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-3">
              <div className="space-y-1">
                <label htmlFor="auth-storename" className="text-xs font-semibold text-indigo-300 block">
                  Storefront Name
                </label>
                <input
                  id="auth-storename"
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  placeholder="e.g. Lotus Studio"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Store URL: <span className="text-indigo-400">socialhub.eg/store/{storeSlug || 'your-store'}</span>
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-xs font-semibold text-slate-300 block">
              Email Address
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              spellCheck="false"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor={mode === 'signin' ? 'current-password' : 'new-password'}
                className="text-xs font-semibold text-slate-300 block"
              >
                Password
              </label>
              {mode === 'signin' && (
                <span className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer">
                  Forgot?
                </span>
              )}
            </div>
            <input
              id={mode === 'signin' ? 'current-password' : 'new-password'}
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In to Account →'
            ) : (
              'Create My Account →'
            )}
          </button>
        </form>

        {/* Demo Fast Login Preset Shortcuts */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-wider">
            Quick One-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('customer@example.com')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-[10px] text-slate-300 transition-colors cursor-pointer"
            >
              <div className="font-bold text-white">👤 Shopper</div>
              <div className="text-slate-500 truncate">Buyer User</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('sari@example.com')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 rounded-xl text-center text-[10px] text-indigo-300 transition-colors cursor-pointer"
            >
              <div className="font-bold text-indigo-300">🏬 Sari Store</div>
              <div className="text-slate-500 truncate">Merchant</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('craft@example.com')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 rounded-xl text-center text-[10px] text-purple-300 transition-colors cursor-pointer"
            >
              <div className="font-bold text-purple-300">👜 Cairo Craft</div>
              <div className="text-slate-500 truncate">Merchant</div>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemoLogin('admin@socialhub.eg')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-xl text-center text-[10px] text-rose-300 transition-colors cursor-pointer"
            >
              <div className="font-bold text-rose-300">🛡️ Admin</div>
              <div className="text-slate-500 truncate">Platform Lead</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
