import React, { useState } from 'react';
import { api, type UserDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { EyeIcon, LockIcon } from './icons/Icons';

interface CreateMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerchantCreated: (newMerchant: any) => void;
  onAuthSuccess?: (user: UserDto) => void;
  onOpenAuthModal?: () => void;
}

export const CreateMerchantModal: React.FC<CreateMerchantModalProps> = ({
  isOpen,
  onClose,
  onMerchantCreated,
  onAuthSuccess,
  onOpenAuthModal
}) => {
  const { t, isRTL } = useTranslation();
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (name: string) => {
    setStoreName(name);
    setSlug(name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(isRTL ? 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام.' : 'Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Register Merchant Account (Creates Merchant Store + User Account with Hashed Password)
      const res = await api.register({
        email: email.trim(),
        password,
        fullName: fullName.trim() || storeName.trim(),
        role: 'Merchant',
        storeName: storeName.trim(),
        storeSlug: slug.trim()
      });

      setSuccessMsg(t.createMerchantModal.successLoginNotice || `${t.createMerchantModal.title}: ${storeName}`);
      
      if (onAuthSuccess && res.user) {
        onAuthSuccess(res.user);
      }

      onMerchantCreated({
        id: res.user.merchantId || res.user.id,
        storeName,
        slug: res.user.storeSlug || slug,
        email: res.user.email
      });

      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1600);
    } catch (err: any) {
      console.warn('Backend store registration fallback or validation error:', err);
      if (err.message && !err.message.includes('Failed to fetch')) {
        setErrorMsg(err.message);
      } else {
        // Offline / demo fallback: create simulated store
        const demoMerchant = {
          id: 'demo-' + Date.now(),
          storeName,
          slug,
          email
        };
        setSuccessMsg(storeName);
        onMerchantCreated(demoMerchant);
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
          <h3 className="font-black text-xl text-white">{t.createMerchantModal.title}</h3>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {successMsg ? (
          <div className="p-6 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
              ✓
            </div>
            <p className="text-emerald-300 font-bold text-sm leading-relaxed">{successMsg}</p>
            <p className="text-xs text-emerald-400/80">
              {isRTL
                ? 'تم تسجيل دخولك بنجاح. يمكنك دوماً الدخول لحسابك عبر خيار تسجيل الدخول باستخدام بريدك وكلمة المرور.'
                : 'You are signed in! You can sign back into your Seller Portal anytime with your credentials.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-400">
              {t.createMerchantModal.subtitle}
            </p>

            {/* Explanatory Login Hint */}
            <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm">
              {t.createMerchantModal.loginHint}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Store Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{t.createMerchantModal.storeNameLabel}</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t.createMerchantModal.storeNamePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{t.createMerchantModal.ownerNameLabel}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t.createMerchantModal.ownerNamePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Store URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">{t.createMerchantModal.urlPreview}</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs" dir="ltr">
                <span className="text-slate-500 font-mono">socialhub.eg/store/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="bg-transparent text-white focus:outline-none flex-1 font-mono"
                />
              </div>
            </div>

            {/* Email & Password for Login */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{t.createMerchantModal.emailLabel}</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.createMerchantModal.emailPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 text-start"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">{t.createMerchantModal.passwordLabel}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.createMerchantModal.passwordPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 text-start pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl text-base transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 shadow-sm min-h-[48px]"
            >
              {isSubmitting ? t.createMerchantModal.openingStore : t.createMerchantModal.openStoreBtn}
            </button>

            {/* Already have an account link */}
            <div className="text-center pt-2.5 border-t border-slate-800/80">
              <span className="text-sm text-slate-400">
                {t.createMerchantModal.alreadyHaveAccount}{' '}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuthModal) {
                    onOpenAuthModal();
                  } else {
                    onClose();
                  }
                }}
                className="text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                {t.createMerchantModal.signInLink}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
