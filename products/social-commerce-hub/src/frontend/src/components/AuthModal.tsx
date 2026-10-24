import React, { useState } from 'react';
import { api, type UserDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

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
  const { t, isRTL } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [role, setRole] = useState<'Customer' | 'Merchant'>('Customer');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');

  // Password reset specific states
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');

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
      } else if (mode === 'signup') {
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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMsg(res.message || 'If the email exists, a password reset link has been dispatched.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !resetToken.trim() || !newResetPassword) {
      setErrorMsg('Please fill in all reset fields.');
      return;
    }

    if (newResetPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.resetPassword({
        email: email.trim(),
        resetToken: resetToken.trim(),
        newPassword: newResetPassword,
      });

      setSuccessMsg('Password has been reset successfully! You can now sign in.');
      setPassword(newResetPassword);
      setTimeout(() => {
        setMode('signin');
        setResetToken('');
        setNewResetPassword('');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired password reset token.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 end-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm text-slate-300 font-bold transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signin'
              ? t.authModal.welcomeBack
              : mode === 'signup'
              ? t.authModal.joinTitle
              : mode === 'forgot'
              ? t.authModal.forgotTitle
              : t.authModal.resetTitle}
          </h2>
          <p className="text-sm text-slate-400">
            {mode === 'signin'
              ? t.authModal.signInSubtitle
              : mode === 'signup'
              ? t.authModal.signUpSubtitle
              : mode === 'forgot'
              ? t.authModal.forgotSubtitle
              : t.authModal.resetSubtitle}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only in signin & signup modes) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.authModal.tabSignIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.authModal.tabCreateAccount}
            </button>
          </div>
        )}

        {/* Error & Success Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-300 text-xs text-center font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs text-center font-bold animate-in fade-in">
            ✓ {successMsg}
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-forgot-email" className="text-xs font-semibold text-slate-300 block">
                {t.authModal.emailLabel}
              </label>
              <input
                id="auth-forgot-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.authModal.emailPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm font-semibold min-h-[46px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t.authModal.sendResetBtn
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {isRTL ? '←' : '←'} {t.authModal.backToSignIn}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
              >
                {t.authModal.haveTokenLink} →
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-reset-email" className="text-xs font-semibold text-slate-300 block">
                {t.authModal.emailLabel}
              </label>
              <input
                id="auth-reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.authModal.emailPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-reset-token" className="text-xs font-semibold text-slate-300 block">
                {t.authModal.resetTokenLabel}
              </label>
              <input
                id="auth-reset-token"
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder={t.authModal.resetTokenPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-reset-newpass" className="text-xs font-semibold text-slate-300 block">
                {t.authModal.newPasswordLabel}
              </label>
              <input
                id="auth-reset-newpass"
                type="password"
                required
                minLength={6}
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder={t.authModal.passwordPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm font-semibold min-h-[46px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t.authModal.setNewPasswordBtn
              )}
            </button>

            <div className="text-center pt-2 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ← {t.authModal.backToSignIn}
              </button>
            </div>
          </form>
        )}

        {/* SIGN IN / SIGN UP FORMS */}
        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Sign-up specific: Role Switcher */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">I want to:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Customer')}
                    className={`p-3 rounded-2xl border text-xs text-start transition-all cursor-pointer ${
                      role === 'Customer'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">{t.authModal.roleBuyer}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.authModal.roleBuyerDesc}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Merchant')}
                    className={`p-3 rounded-2xl border text-xs text-start transition-all cursor-pointer ${
                      role === 'Merchant'
                        ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <p className="font-bold">{t.authModal.roleSeller}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.authModal.roleSellerDesc}</p>
                  </button>
                </div>
              </div>
            )}

            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label htmlFor="auth-fullname" className="text-xs font-semibold text-slate-300 block">
                  {t.authModal.fullNameLabel}
                </label>
                <input
                  id="auth-fullname"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.authModal.fullNamePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}

            {/* Merchant Store Fields (Sign Up as Merchant only) */}
            {mode === 'signup' && role === 'Merchant' && (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="space-y-1">
                  <label htmlFor="auth-storename" className="text-xs font-semibold text-indigo-300 block">
                    {t.authModal.storeNameLabel}
                  </label>
                  <input
                    id="auth-storename"
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    placeholder={t.authModal.storeNamePlaceholder}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {t.authModal.storeUrlLabel} <span className="text-indigo-400" dir="ltr">socialhub.eg/store/{storeSlug || 'your-store'}</span>
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-xs font-semibold text-slate-300 block">
                {t.authModal.emailLabel}
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
                placeholder={t.authModal.emailPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="text-xs font-semibold text-slate-300 block"
                >
                  {t.authModal.passwordLabel}
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors cursor-pointer"
                  >
                    {t.authModal.forgotPasswordLink}
                  </button>
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
                placeholder={t.authModal.passwordPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                dir="ltr"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm font-semibold min-h-[46px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                `${t.authModal.signInBtn} →`
              ) : (
                `${t.authModal.createAccountBtn} →`
              )}
            </button>
          </form>
        )}

        {/* Demo Fast Login Preset Shortcuts (Only in signin mode) */}
        {mode === 'signin' && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <p className="text-[10px] uppercase font-bold text-slate-500 text-center tracking-wider">
              {t.authModal.quickDemoLogins}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('customer@example.com')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-[10px] text-slate-300 transition-colors cursor-pointer"
              >
                <div className="font-bold text-white">{t.authModal.demoShopper}</div>
                <div className="text-slate-500 truncate">Buyer User</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('sari@example.com')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-indigo-500/30 rounded-xl text-center text-[10px] text-indigo-300 transition-colors cursor-pointer"
              >
                <div className="font-bold text-indigo-300">{t.authModal.demoSari}</div>
                <div className="text-slate-500 truncate">Merchant</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('craft@example.com')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 rounded-xl text-center text-[10px] text-purple-300 transition-colors cursor-pointer"
              >
                <div className="font-bold text-purple-300">{t.authModal.demoCairo}</div>
                <div className="text-slate-500 truncate">Merchant</div>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin('admin@socialhub.eg')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-rose-500/30 rounded-xl text-center text-[10px] text-rose-300 transition-colors cursor-pointer"
              >
                <div className="font-bold text-rose-300">{t.authModal.demoAdmin}</div>
                <div className="text-slate-500 truncate">Platform Lead</div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
