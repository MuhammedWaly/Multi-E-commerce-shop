import React, { useState, useEffect } from 'react';
import { api, type UserDto, type UserProfileDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserDto | null;
  onProfileUpdated?: (updatedUser: UserDto) => void;
}

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'email'>('profile');

  // Profile Form State
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Email Verification State
  const [verifyToken, setVerifyToken] = useState('');

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load profile when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setIsFetching(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      api.getProfile()
        .then((data) => {
          setProfile(data);
          setFullName(data.fullName || '');
          setPhoneNumber(data.phoneNumber || '');
          setAvatarUrl(data.avatarUrl || '');
        })
        .catch((err) => {
          console.warn('Could not load profile from server, using local fallback:', err);
          // Fallback to stored user
          setFullName(currentUser.fullName);
        })
        .finally(() => setIsFetching(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = await api.updateProfile({
        fullName,
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      setProfile(updated);
      setSuccessMsg('Profile information updated successfully!');

      if (onProfileUpdated) {
        onProfileUpdated({
          ...currentUser,
          fullName: updated.fullName,
          isEmailConfirmed: updated.isEmailConfirmed,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccessMsg('Password changed successfully! Keep your new password secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken.trim()) {
      setErrorMsg('Please enter your verification token.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.confirmEmail({
        email: currentUser.email,
        token: verifyToken.trim(),
      });

      setSuccessMsg('Email address verified successfully!');
      setVerifyToken('');
      if (profile) {
        setProfile({ ...profile, isEmailConfirmed: true });
      }
      if (onProfileUpdated) {
        onProfileUpdated({ ...currentUser, isEmailConfirmed: true });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired confirmation token.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.resendConfirmation(currentUser.email);
      setSuccessMsg(res.message || 'A new verification token has been dispatched to your email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
    } finally {
      setIsLoading(false);
    }
  };

  const isConfirmed = profile?.isEmailConfirmed ?? currentUser.isEmailConfirmed;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 end-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold transition-colors cursor-pointer"
          title={t.common.close}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-2xl font-black text-white shadow-lg overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span>{fullName ? fullName.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-black text-white tracking-tight truncate">
              {fullName || currentUser.fullName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono truncate" dir="ltr">{currentUser.email}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentUser.role === 'Admin'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : currentUser.role === 'Merchant'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => {
              setActiveTab('profile');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>👤 {t.accountSettings.tabProfile}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('password');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'password'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>🔑 {t.accountSettings.tabPassword}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'email'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>✉️ {t.accountSettings.tabEmail}</span>
            {isConfirmed ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Global Feedback Banners */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Loading Spinner for Initial Fetch */}
        {isFetching && (
          <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span>{t.common.loading}</span>
          </div>
        )}

        {/* TAB 1: Profile Information */}
        {!isFetching && activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="account-fullname" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.accountSettings.fullNameLabel}
              </label>
              <input
                id="account-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t.accountSettings.fullNamePlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="account-email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.accountSettings.emailLabel}
                </label>
                <div className="relative">
                  <input
                    id="account-email"
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
                    dir="ltr"
                  />
                  <span className={`absolute end-3 top-2.5 text-[10px] font-bold ${
                    isConfirmed ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {isConfirmed ? t.accountSettings.verifiedStatus : t.accountSettings.unverifiedStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="account-phone" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t.accountSettings.phoneLabel}
                </label>
                <input
                  id="account-phone"
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  placeholder={t.accountSettings.phonePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="account-avatar" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.accountSettings.avatarLabel}
              </label>
              <input
                id="account-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t.accountSettings.avatarPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                dir="ltr"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.accountSettings.savingProfile}</span>
                  </>
                ) : (
                  <span>{t.accountSettings.saveProfileBtn}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Change Password */}
        {!isFetching && activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.accountSettings.currentPasswordLabel}
              </label>
              <input
                id="current-password"
                name="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder={t.accountSettings.currentPasswordPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.accountSettings.newPasswordLabel}
              </label>
              <input
                id="new-password"
                name="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t.accountSettings.newPasswordPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm-new-password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.accountSettings.confirmNewPasswordLabel}
              </label>
              <input
                id="confirm-new-password"
                name="confirm-new-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder={t.accountSettings.confirmNewPasswordPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="accent-indigo-600 rounded"
                />
                <span>{t.accountSettings.showPasswords}</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t.accountSettings.updatingPassword}</span>
                  </>
                ) : (
                  <span>{t.accountSettings.updatePasswordBtn}</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: Email Verification */}
        {!isFetching && activeTab === 'email' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl border bg-slate-950 flex items-start gap-3.5">
              <span className="text-2xl">{isConfirmed ? '🛡️' : '⏳'}</span>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white">
                  {isConfirmed ? t.accountSettings.verifiedStatus : t.accountSettings.unverifiedStatus}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isConfirmed
                    ? t.accountSettings.verifiedNotice
                    : t.accountSettings.unverifiedNotice}
                </p>
              </div>
            </div>

            {!isConfirmed ? (
              <form onSubmit={handleConfirmEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="verify-token-input" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.accountSettings.tokenLabel}
                  </label>
                  <input
                    id="verify-token-input"
                    type="text"
                    value={verifyToken}
                    onChange={(e) => setVerifyToken(e.target.value)}
                    placeholder={t.accountSettings.tokenPlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? t.common.loading : t.accountSettings.confirmTokenBtn}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isLoading}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t.accountSettings.resendTokenBtn}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 space-y-2">
                <p className="text-emerald-400 font-bold">{t.accountSettings.allSetMessage}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
