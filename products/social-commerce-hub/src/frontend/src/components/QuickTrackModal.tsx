import React, { useState } from 'react';
import { api, type OrderTrackingResponse } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { guestSession } from '../services/guestSession';

interface QuickTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackingLoaded: (tracking: OrderTrackingResponse) => void;
}

export const QuickTrackModal: React.FC<QuickTrackModalProps> = ({
  isOpen,
  onClose,
  onTrackingLoaded,
}) => {
  const { t } = useTranslation();
  const [orderIdentifier, setOrderIdentifier] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const guestOrders = guestSession.getGuestOrders();

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdentifier.trim() || !contactInfo.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const tracking = await api.trackOrderLookup({
        orderIdentifier: orderIdentifier.trim(),
        contactInfo: contactInfo.trim(),
      });
      onTrackingLoaded(tracking);
      onClose();
    } catch {
      setErrorMsg(t.checkout.orderNotFound);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectRecent = (orderId: string, email: string) => {
    setOrderIdentifier(orderId);
    setContactInfo(email);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="font-bold text-lg text-white">
              {t.checkout.quickTrackNavBtn}
            </h3>
            <p className="text-xs text-slate-400">
              تتبع مسار شحنتك مباشرة على الخريطة
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl text-red-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              {t.checkout.orderIdPlaceholder}
            </label>
            <input
              type="text"
              required
              value={orderIdentifier}
              onChange={(e) => setOrderIdentifier(e.target.value)}
              placeholder="e.g. COD-3C84676B or 01faa256..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              {t.checkout.contactPlaceholder}
            </label>
            <input
              type="text"
              required
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="01012345678 / user@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              dir="ltr"
            />
          </div>

          {/* Recent Guest Orders shortcut */}
          {guestOrders.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <span className="text-xs text-slate-400 font-medium block">
                آخر طلباتك من هذا الجهاز / Recent on this device:
              </span>
              <div className="flex flex-wrap gap-2">
                {guestOrders.slice(0, 3).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => handleQuickSelectRecent(o.paymentOrderId || o.id, o.customerEmail)}
                    className="text-xs bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors cursor-pointer font-mono"
                  >
                    #{o.paymentOrderId || o.id.slice(0, 8)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer min-h-[44px]"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.common.loading}</span>
                </>
              ) : (
                <span>{t.checkout.trackNowBtn}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
