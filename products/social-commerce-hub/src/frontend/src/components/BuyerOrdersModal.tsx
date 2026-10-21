import React, { useState, useEffect } from 'react';
import { api, type OrderDto } from '../services/api';
import type { Product } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface BuyerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReviewModal: (product: Product) => void;
  allProducts: Product[];
}

export const BuyerOrdersModal: React.FC<BuyerOrdersModalProps> = ({
  isOpen,
  onClose,
  onOpenReviewModal,
  allProducts,
}) => {
  const { t, formatCurrency, formatNumber } = useTranslation();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      api.getMyOrders()
        .then((data) => {
          setOrders(data || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || t.buyerOrders.loadOrdersFailed);
          setLoading(false);
        });
    }
  }, [isOpen]);

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
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-lg font-bold border border-indigo-500/30">
              📦
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
              <div className="text-4xl mb-3">🛍️</div>
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
                  <span>{t.buyerOrders.shippingTo} {order.shippingAddress}</span>
                  <div className="flex items-center gap-2">
                    {order.paymentMethod && (
                      <span className="font-semibold text-slate-300">
                        {order.paymentMethod === 'CashOnDelivery' && `💵 ${t.checkout.codTitle}`}
                        {order.paymentMethod === 'Fawry' && `🟡 ${t.checkout.fawryTitle}`}
                        {order.paymentMethod === 'InstaPay' && `⚡ ${t.checkout.instaPayTitle}`}
                        {order.paymentMethod === 'PayPal' && `💳 ${t.checkout.paypalTitle}`}
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
    </div>
  );
};
