import React, { useState } from 'react';
import { api } from '../services/api';

interface CreateMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMerchantCreated: (newMerchant: any) => void;
}

export const CreateMerchantModal: React.FC<CreateMerchantModalProps> = ({
  isOpen,
  onClose,
  onMerchantCreated
}) => {
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
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

    try {
      const created = await api.createMerchant({
        storeName,
        slug,
        email: email || `${slug}@example.com`
      });

      setSuccessMsg(`Congratulations! Store "${storeName}" registered successfully.`);
      onMerchantCreated(created);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.warn('Backend store registration fallback:', err);
      // If error from backend validation, display it; else fallback
      if (err.message && !err.message.includes('Failed to fetch')) {
        setErrorMsg(err.message);
      } else {
        // Offline / demo fallback
        setSuccessMsg(`Store "${storeName}" created in demo mode.`);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏬</span>
            <h3 className="font-extrabold text-lg text-white">Open Your Store on SocialHub</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold"
          >
            ✕
          </button>
        </div>

        {successMsg ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-2">
            <div className="text-2xl text-emerald-400">✓</div>
            <p className="text-emerald-300 font-bold text-sm">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-400">
              Join Egypt's fastest growing community of independent boutiques. Keep 95% of every sale with direct PayPal payouts.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Store Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Nile Artisan Ceramics"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Store URL Slug</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-500">socialhub.eg/store/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="bg-transparent text-white focus:outline-none flex-1 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Merchant Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store-owner@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl text-xs shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Registering Store...' : 'Launch My Storefront 🚀'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
