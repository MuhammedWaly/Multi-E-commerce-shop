import React, { useState, useEffect } from 'react';
import { api, getStoredToken, type OrderDto, type UserDto } from '../services/api';
import type { Product } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { OrderTrackingModal } from './OrderTrackingModal';
import { guestSession } from '../services/guestSession';
import { UserIcon, GiftIcon, BagIcon } from './icons/Icons';

interface BuyerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReviewModal: (product: Product) => void;
  allProducts: Product[];
  currentUser?: UserDto | null;
}

export const BuyerOrdersModal: React.FC<BuyerOrdersModalProps> = ({
  isOpen,
  onClose,
  onOpenReviewModal,
  allProducts,
  currentUser,
}) => {
  const { t, formatCurrency, formatNumber } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [isGuestSession, setIsGuestSession] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);

      const token = getStoredToken();
      const isLoggedIn = Boolean(currentUser || token);

      if (isLoggedIn) {
        // Authenticated user mode: strictly display user's own orders
        setIsGuestSession(false);
        api.getMyOrders()
          .then((data) => {
            // Combine backend orders with any local orders placed on this device
            const guestOrders = guestSession.getGuestOrders();
            const orderMap = new Map<string, OrderDto>();
            (data || []).forEach(o => orderMap.set(o.id, o));
            guestOrders.forEach(g => {
              if (!orderMap.has(g.id)) {
                orderMap.set(g.id, g);
              }
            });
            setOrders(Array.from(orderMap.values()));
            setLoading(false);
          })
          .catch((err) => {
            console.error('Failed to load user orders:', err);
            // If the token was truly invalid/unauthorized (e.g. 401), we can fallback to guest mode
            const guestOrders = guestSession.getGuestOrders();
            setOrders(guestOrders);
            setIsGuestSession(!isLoggedIn && guestOrders.length > 0);
            setLoading(false);
          });
      } else {
        // True guest session (not logged in)
        const guestOrders = guestSession.getGuestOrders();
        setOrders(guestOrders);
        setIsGuestSession(guestOrders.length > 0);
        setLoading(false);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleReviewClick = (productId: string, productTitle: string) => {
    // Find product from list or create minimal mock representation for reviews modal
    const found = allProducts.find((p) => p.id === productId);
    const productToReview: Product = found || {
      id: productId,
      merchantId: '',
      storeName: 'Verified Store',
      storeSlug: '',
      title: productTitle,
      price: 0,
      mediaUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500',
      category: 'fashion',
      rating: 5.0,
      reviewCount: 1,
      stockQuantity: 10,
    };
    onClose();
    onOpenReviewModal(productToReview);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{t.buyerOrders.title}</h2>
              <p className="text-xs text-slate-400">{t.buyerOrders.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Guest Session Notice */}
          {isGuestSession && (
            <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200 shadow-md">
              <div className="flex items-center gap-2.5">
                <UserIcon className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-white block">{t.checkout.guestNotice}</span>
                  <span className="text-[11px] text-slate-300">
                    طلباتك محفوظة على هذا الجهاز ويمكنك متابعة مسارها المباشر في أي وقت.
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl whitespace-nowrap">
                <GiftIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>50 ج.م كاش باك متاح</span>
              </span>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">{t.common.loading}</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <BagIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">{t.buyerOrders.noOrdersTitle}</h3>
              <p className="text-xs text-slate-400">{t.buyerOrders.noOrdersDesc}</p>
            </div>
          )}

          {!loading && orders.map((order) => {
            const isDeliveredOrPaid = order.status === 'Paid' || order.status === 'Fulfilled';
            return (
              <div
                key={order.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">{t.buyerOrders.orderNumber} #{order.id.slice(0, 8)}</span>
                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'Paid' || order.status === 'Fulfilled'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'Pending'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {order.status === 'Paid' ? `✓ ${t.buyerOrders.statusPaid}` : order.status}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        <span className="text-slate-200 font-medium">{item.productTitle}</span>
                        <span className="text-slate-500">×{formatNumber(item.quantity)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                        {isDeliveredOrPaid && (
                          <button
                            onClick={() => handleReviewClick(item.productId, item.productTitle)}
                            className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-bold border border-indigo-500/30 transition-all cursor-pointer"
                          >
                            {t.buyerOrders.leaveReviewBtn}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment summary */}
                <div className="pt-2 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>{t.buyerOrders.shippingTo} {order.shippingAddress}</span>
                    <button
                      type="button"
                      onClick={() => setTrackingOrderId(order.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>{t.checkout.trackOrderBtn}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.paymentMethod && (
                      <span className="font-medium text-slate-300">
                        {order.paymentMethod === 'CashOnDelivery' && t.checkout.codTitle}
                        {order.paymentMethod === 'Fawry' && t.checkout.fawryTitle}
                        {order.paymentMethod === 'InstaPay' && t.checkout.instaPayTitle}
                        {order.paymentMethod === 'PayPal' && t.checkout.paypalTitle}
                      </span>
                    )}
                    {(order.paymentReference || order.fawryReferenceNumber || order.paymentOrderId) && (
                      <span className="font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800" dir="ltr">
                        {order.fawryReferenceNumber
                          ? `${t.buyerOrders.fawryKioskRef}: ${order.fawryReferenceNumber}`
                          : order.paymentReference
                          ? `${t.buyerOrders.refLabel}: ${order.paymentReference}`
                          : `${t.buyerOrders.refLabel}: ${order.paymentOrderId?.slice(0, 14)}...`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>

      {/* Live Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={Boolean(trackingOrderId)}
        onClose={() => setTrackingOrderId(null)}
        orderId={trackingOrderId}
      />
    </div>
  );
};
