import React, { useState } from 'react';
import type { CartItem, PaymentChannel, SettlementStatus } from '../types';
import { api } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface CartSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

interface ConfirmedOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  totalAmount: number;
  merchantNetAmount: number;
  platformFeeAmount: number;
  paymentMethod: PaymentChannel;
  status: string;
  settlementStatus: SettlementStatus | string;
  paymentOrderId?: string;
  fawryReferenceNumber?: string;
  fawryExpiryDate?: string;
  senderMobileOrWallet?: string;
  senderReferenceNumber?: string;
  createdAt: string;
}

export const CartSlideOver: React.FC<CartSlideOverProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { t, formatCurrency, formatNumber } = useTranslation();
  const [customerName, setCustomerName] = useState('Youssef El-Gohary');
  const [customerEmail, setCustomerEmail] = useState('youssef@example.com');
  const [customerAddress, setCustomerAddress] = useState('15 Nile Corniche, Zamalek, Cairo');

  // Multi-channel payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentChannel>('CashOnDelivery');
  const [senderWallet, setSenderWallet] = useState('01012345678');
  const [transferReference, setTransferReference] = useState('TXN-984210');
  const [walletValidationError, setWalletValidationError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettlingFawry, setIsSettlingFawry] = useState(false);
  const [fawrySettled, setFawrySettled] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<ConfirmedOrder | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const platformFee = Math.round(totalAmount * 0.05 * 100) / 100;
  const merchantNet = Math.round((totalAmount - platformFee) * 100) / 100;

  const handleProcessOrder = async () => {
    // Validation for InstaPay / Mobile Wallets
    if (selectedPaymentMethod === 'InstaPay') {
      if (!senderWallet.trim()) {
        setWalletValidationError(t.checkout.walletValidationPhone);
        return;
      }
      if (!transferReference.trim()) {
        setWalletValidationError(t.checkout.walletValidationRef);
        return;
      }
    }
    setWalletValidationError(null);

    setIsProcessing(true);
    setFawrySettled(false);

    // Pre-generate 8-digit Fawry reference code and 48-hour expiration date
    const generatedFawryRef = Math.floor(10000000 + Math.random() * 90000000).toString();
    const fawryExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    try {
      if (cartItems.length > 0) {
        const firstItem = cartItems[0];
        const isGuid = (val: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

        if (isGuid(firstItem.product.merchantId) && cartItems.every((i) => isGuid(i.product.id))) {
          const order = await api.createOrder({
            merchantId: firstItem.product.merchantId,
            customerName,
            customerEmail,
            shippingAddress: customerAddress,
            paymentMethod: selectedPaymentMethod,
            senderWalletOrReference: selectedPaymentMethod === 'InstaPay' ? senderWallet.trim() : undefined,
            paymentReference:
              selectedPaymentMethod === 'Fawry'
                ? generatedFawryRef
                : selectedPaymentMethod === 'InstaPay'
                ? transferReference.trim()
                : undefined,
            paymentDetails:
              selectedPaymentMethod === 'InstaPay'
                ? {
                    senderMobileOrWallet: senderWallet.trim(),
                    senderReferenceNumber: transferReference.trim(),
                  }
                : undefined,
            items: cartItems.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          });

          if (order && order.id) {
            // For PayPal, auto-capture simulated session
            if (selectedPaymentMethod === 'PayPal' && order.paymentOrderId) {
              try {
                await api.captureOrder(order.id, {
                  paymentOrderId: order.paymentOrderId,
                  payerId: 'PAYER-WEB-MARKETPLACE',
                });
              } catch (captureErr) {
                console.warn('PayPal capture warning:', captureErr);
              }
            }

            const initialStatus =
              selectedPaymentMethod === 'PayPal'
                ? 'Paid'
                : selectedPaymentMethod === 'Fawry'
                ? 'AwaitingPayment'
                : selectedPaymentMethod === 'InstaPay'
                ? 'Processing'
                : order.status || 'Pending';

            const initialSettlement =
              order.settlementStatus ||
              (selectedPaymentMethod === 'PayPal'
                ? 'Settled'
                : selectedPaymentMethod === 'CashOnDelivery'
                ? 'PendingCollection'
                : selectedPaymentMethod === 'Fawry'
                ? 'PendingPayment'
                : 'PendingVerification');

            setOrderConfirmation({
              id: order.id,
              customerName: order.customerName || customerName,
              customerEmail: order.customerEmail || customerEmail,
              shippingAddress: order.shippingAddress || customerAddress,
              totalAmount: order.totalAmount,
              merchantNetAmount: order.merchantNetAmount,
              platformFeeAmount: order.platformFeeAmount,
              paymentMethod: selectedPaymentMethod,
              status: initialStatus,
              settlementStatus: initialSettlement,
              paymentOrderId: order.paymentOrderId,
              fawryReferenceNumber: order.paymentReference || generatedFawryRef,
              fawryExpiryDate: order.paymentExpiresAtUtc || fawryExpiry,
              senderMobileOrWallet: order.senderWalletOrReference || senderWallet,
              senderReferenceNumber: order.paymentReference || transferReference,
              createdAt: order.createdAt || new Date().toISOString(),
            });
            onClearCart();
            return;
          }
        }
      }

      // Standalone sandbox simulation
      const simId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      const initialStatus =
        selectedPaymentMethod === 'PayPal'
          ? 'Paid'
          : selectedPaymentMethod === 'Fawry'
          ? 'AwaitingPayment'
          : selectedPaymentMethod === 'InstaPay'
          ? 'Processing'
          : 'Pending';

      const initialSettlement =
        selectedPaymentMethod === 'PayPal'
          ? 'Settled'
          : selectedPaymentMethod === 'CashOnDelivery'
          ? 'PendingCollection'
          : selectedPaymentMethod === 'Fawry'
          ? 'PendingPayment'
          : 'PendingVerification';

      setOrderConfirmation({
        id: simId,
        customerName,
        customerEmail,
        shippingAddress: customerAddress,
        totalAmount,
        merchantNetAmount: merchantNet,
        platformFeeAmount: platformFee,
        paymentMethod: selectedPaymentMethod,
        status: initialStatus,
        settlementStatus: initialSettlement,
        paymentOrderId: selectedPaymentMethod === 'PayPal' ? ('PAYPAL-' + simId) : undefined,
        fawryReferenceNumber: generatedFawryRef,
        fawryExpiryDate: fawryExpiry,
        senderMobileOrWallet: senderWallet,
        senderReferenceNumber: transferReference,
        createdAt: new Date().toISOString(),
      });
      onClearCart();
    } catch (err) {
      console.warn('Backend checkout fallback to local sandbox simulation:', err);
      const simId = 'SIM-' + Math.floor(100000 + Math.random() * 900000);
      const initialStatus =
        selectedPaymentMethod === 'PayPal'
          ? 'Paid'
          : selectedPaymentMethod === 'Fawry'
          ? 'AwaitingPayment'
          : selectedPaymentMethod === 'InstaPay'
          ? 'Processing'
          : 'Pending';

      const initialSettlement =
        selectedPaymentMethod === 'PayPal'
          ? 'Settled'
          : selectedPaymentMethod === 'CashOnDelivery'
          ? 'PendingCollection'
          : selectedPaymentMethod === 'Fawry'
          ? 'PendingPayment'
          : 'PendingVerification';

      setOrderConfirmation({
        id: simId,
        customerName,
        customerEmail,
        shippingAddress: customerAddress,
        totalAmount,
        merchantNetAmount: merchantNet,
        platformFeeAmount: platformFee,
        paymentMethod: selectedPaymentMethod,
        status: initialStatus,
        settlementStatus: initialSettlement,
        paymentOrderId: selectedPaymentMethod === 'PayPal' ? ('PAYPAL-' + simId) : undefined,
        fawryReferenceNumber: generatedFawryRef,
        fawryExpiryDate: fawryExpiry,
        senderMobileOrWallet: senderWallet,
        senderReferenceNumber: transferReference,
        createdAt: new Date().toISOString(),
      });
      onClearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateFawrySettlement = async () => {
    if (!orderConfirmation) return;
    setIsSettlingFawry(true);
    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderConfirmation.id);
      if (isGuid) {
        await api.simulateFawrySettlement(orderConfirmation.id, orderConfirmation.fawryReferenceNumber || '');
      }
      setOrderConfirmation((prev) =>
        prev
          ? {
              ...prev,
              status: 'Paid',
              settlementStatus: 'Settled',
            }
          : null
      );
      setFawrySettled(true);
    } catch (err) {
      console.warn('Fawry settlement simulation:', err);
      setOrderConfirmation((prev) =>
        prev
          ? {
              ...prev,
              status: 'Paid',
              settlementStatus: 'Settled',
            }
          : null
      );
      setFawrySettled(true);
    } finally {
      setIsSettlingFawry(false);
    }
  };

  const handleCopyFawryCode = () => {
    if (orderConfirmation?.fawryReferenceNumber) {
      navigator.clipboard.writeText(orderConfirmation.fawryReferenceNumber);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    }
  };

  const getSettlementBadge = (settlement: string, paymentMethod: PaymentChannel) => {
    if (settlement === 'Settled' || fawrySettled) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          ✓ {t.checkout.settled}
        </span>
      );
    }
    if (paymentMethod === 'CashOnDelivery') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          ⏳ {t.checkout.pendingCollection}
        </span>
      );
    }
    if (paymentMethod === 'InstaPay') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          ⏳ {t.checkout.pendingVerification}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
        ⏳ {t.checkout.awaitingKiosk}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex ps-10">
        <div className="w-screen max-w-md bg-slate-900 border-s border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛍️</span>
              <h3 className="font-extrabold text-base text-white">{t.cart.title}</h3>
              {cartItems.length > 0 && (
                <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs px-2 py-0.5 rounded-full font-bold">
                  {formatNumber(cartItems.reduce((acc, i) => acc + i.quantity, 0))}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {orderConfirmation ? (
              /* Rich Order Confirmation & Receipt Screen */
              <div
                className={`p-6 rounded-3xl border space-y-4 ${
                  orderConfirmation.paymentMethod === 'CashOnDelivery'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : orderConfirmation.paymentMethod === 'Fawry'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : orderConfirmation.paymentMethod === 'InstaPay'
                    ? 'bg-purple-950/30 border-purple-500/40'
                    : 'bg-emerald-950/30 border-emerald-500/40'
                }`}
              >
                {/* Header Badge & Title */}
                <div className="text-center space-y-2">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto shadow-lg ${
                      orderConfirmation.paymentMethod === 'CashOnDelivery'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : orderConfirmation.paymentMethod === 'Fawry'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : orderConfirmation.paymentMethod === 'InstaPay'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {orderConfirmation.paymentMethod === 'CashOnDelivery'
                      ? '💵'
                      : orderConfirmation.paymentMethod === 'Fawry'
                      ? '🟡'
                      : orderConfirmation.paymentMethod === 'InstaPay'
                      ? '⚡'
                      : '✓'}
                  </div>

                  <div>
                    <h4 className="font-black text-base text-white">
                      {orderConfirmation.paymentMethod === 'CashOnDelivery' && t.checkout.receiptTitleCod}
                      {orderConfirmation.paymentMethod === 'Fawry' &&
                        (fawrySettled ? t.checkout.statusPaid : t.checkout.receiptTitleFawry)}
                      {orderConfirmation.paymentMethod === 'InstaPay' && t.checkout.receiptTitleInstaPay}
                      {orderConfirmation.paymentMethod === 'PayPal' && t.checkout.receiptTitlePaypal}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">
                      {t.checkout.orderIdLabel}: #{orderConfirmation.id}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    {getSettlementBadge(orderConfirmation.settlementStatus, orderConfirmation.paymentMethod)}
                  </div>
                </div>

                {/* Channel-Specific Interactive Blocks */}

                {/* 0. PayPal Live Order Confirmation & Payment Link */}
                {orderConfirmation.paymentMethod === 'PayPal' && orderConfirmation.paymentOrderId && (
                  <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                        PayPal Order ID
                      </span>
                      <span className="font-mono text-xs font-bold text-blue-200 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30" dir="ltr">
                        {orderConfirmation.paymentOrderId}
                      </span>
                    </div>
                    <a
                      href={`https://www.sandbox.paypal.com/checkoutnow?token=${orderConfirmation.paymentOrderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer no-underline text-center"
                    >
                      <span>🌐</span>
                      <span>{t.checkout.openPaypalCheckout}</span>
                    </a>
                  </div>
                )}

                {/* 1. Cash on Delivery Instructions */}
                {orderConfirmation.paymentMethod === 'CashOnDelivery' && (
                  <div className="p-3.5 bg-emerald-900/20 border border-emerald-500/30 rounded-2xl space-y-2 text-xs">
                    <p className="text-emerald-300 font-semibold leading-relaxed">
                      {t.checkout.codInstruction}
                    </p>
                    <div className="pt-2 border-t border-emerald-500/20 flex justify-between items-center text-white">
                      <span>{t.checkout.payableOnDelivery}:</span>
                      <span className="font-extrabold text-emerald-400 text-sm">
                        {formatCurrency(orderConfirmation.totalAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Fawry Pay 8-Digit Bill Reference & Settlement Simulation */}
                {orderConfirmation.paymentMethod === 'Fawry' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-950/90 border border-yellow-500/40 rounded-2xl text-center space-y-2">
                      <span className="text-[11px] font-bold text-yellow-300 uppercase tracking-wider">
                        {t.checkout.fawryRefCode}
                      </span>
                      <div
                        className="text-2xl font-black font-mono tracking-widest text-yellow-300 py-1"
                        dir="ltr"
                      >
                        {orderConfirmation.fawryReferenceNumber}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleCopyFawryCode}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>📋</span>
                          <span>{codeCopied ? t.checkout.fawryCodeCopied : t.checkout.fawryCopyCode}</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t.checkout.fawryExpiryNotice}
                      </p>
                    </div>

                    {/* Step-by-Step Kiosk Instructions */}
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-300">
                      <p className="font-bold text-yellow-300">{t.checkout.fawryInstructionsTitle}</p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                        <li>{t.checkout.fawryStep1}</li>
                        <li>{t.checkout.fawryStep2}</li>
                        <li>{t.checkout.fawryStep3}</li>
                      </ol>
                    </div>

                    {/* Instant Simulated Settlement Action */}
                    {fawrySettled ? (
                      <div className="p-3 bg-emerald-900/30 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                        <span>✓</span>
                        <span>{t.checkout.fawrySettledSuccess}</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSimulateFawrySettlement}
                        disabled={isSettlingFawry}
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSettlingFawry ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>{t.checkout.fawrySimulating}</span>
                          </>
                        ) : (
                          <span>{t.checkout.fawrySimulatePayment}</span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* 3. InstaPay Sender & Reference Details */}
                {orderConfirmation.paymentMethod === 'InstaPay' && (
                  <div className="p-3.5 bg-purple-950/50 border border-purple-500/30 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t.checkout.senderPhoneLabel}:</span>
                      <span className="font-mono font-bold text-white" dir="ltr">
                        {orderConfirmation.senderMobileOrWallet}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">{t.checkout.transferRefLabel}:</span>
                      <span className="font-mono font-bold text-purple-300" dir="ltr">
                        {orderConfirmation.senderReferenceNumber}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-purple-500/20 text-[11px] text-slate-400">
                      <span>{t.checkout.recipientAccountNotice}</span>
                    </div>
                  </div>
                )}

                {/* Financial Breakdown Card */}
                <div className="bg-slate-950 p-4 rounded-2xl text-start text-xs space-y-2 border border-slate-800 text-slate-300">
                  <div className="flex justify-between">
                    <span>{t.reviews.yourNameLabel}:</span>
                    <span className="font-bold text-white">{orderConfirmation.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t.cart.total}:</span>
                    <span className="font-bold text-emerald-400">
                      {formatCurrency(orderConfirmation.totalAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800 text-[11px]">
                    <span>{t.merchantDashboard.netEarnings}:</span>
                    <span className="text-slate-300 font-mono" dir="ltr">
                      {formatCurrency(orderConfirmation.merchantNetAmount ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>{t.cart.platformFee}:</span>
                    <span className="text-slate-300 font-mono" dir="ltr">
                      {formatCurrency(orderConfirmation.platformFeeAmount ?? 0)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{t.checkout.deliveryDetails}: </span>
                    <span>{orderConfirmation.shippingAddress}</span>
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => {
                    setOrderConfirmation(null);
                    onClose();
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg cursor-pointer"
                >
                  {t.cart.startShopping}
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              /* Empty Cart */
              <div className="text-center py-20 space-y-3">
                <div className="text-5xl">🛒</div>
                <p className="text-sm font-bold text-slate-200">{t.cart.emptyTitle}</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {t.cart.emptySubtitle}
                </p>
              </div>
            ) : (
              /* Cart Items List, Delivery Details & Payment Method Selector */
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center gap-3"
                    >
                      <img
                        src={item.product.mediaUrl}
                        alt={item.product.title}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-indigo-400 font-bold">
                          @{item.product.storeName}
                        </span>
                        <h4 className="font-bold text-xs text-white truncate">{item.product.title}</h4>
                        <p className="text-emerald-400 font-extrabold text-xs mt-0.5">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>

                      {/* Quantity Control */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="text-xs text-slate-400 hover:text-white font-bold px-1"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white px-1">
                          {formatNumber(item.quantity)}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="text-xs text-slate-400 hover:text-white font-bold px-1"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-slate-500 hover:text-red-400 text-xs px-1 cursor-pointer"
                        title={t.common.delete}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Delivery Information Form */}
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {t.cart.orderSummary}
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t.reviews.yourNameLabel}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={t.authModal.emailLabel}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      dir="ltr"
                    />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder={t.checkout.shippingAddressPlaceholder}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span>💳</span> {t.checkout.selectPaymentMethod}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {t.checkout.paymentMethodDesc}
                  </p>

                  <div className="space-y-2">
                    {/* 1. Cash on Delivery (COD) */}
                    <label
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedPaymentMethod === 'CashOnDelivery'
                          ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="paymentChannel"
                          value="CashOnDelivery"
                          checked={selectedPaymentMethod === 'CashOnDelivery'}
                          onChange={() => setSelectedPaymentMethod('CashOnDelivery')}
                          className="mt-0.5 text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>💵</span> {t.checkout.codTitle}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {t.checkout.codZeroUpfrontBadge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {t.checkout.codDesc}
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* 2. Fawry Pay Reference */}
                    <label
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedPaymentMethod === 'Fawry'
                          ? 'bg-yellow-950/30 border-yellow-500/60 ring-1 ring-yellow-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="paymentChannel"
                          value="Fawry"
                          checked={selectedPaymentMethod === 'Fawry'}
                          onChange={() => setSelectedPaymentMethod('Fawry')}
                          className="mt-0.5 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>🟡</span> {t.checkout.fawryTitle}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-mono"
                            >
                              {t.checkout.fawryServiceCodePill}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {t.checkout.fawryDesc}
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* 3. InstaPay & Mobile Wallets */}
                    <label
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedPaymentMethod === 'InstaPay'
                          ? 'bg-purple-950/30 border-purple-500/60 ring-1 ring-purple-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="paymentChannel"
                          value="InstaPay"
                          checked={selectedPaymentMethod === 'InstaPay'}
                          onChange={() => setSelectedPaymentMethod('InstaPay')}
                          className="mt-0.5 text-purple-500 focus:ring-purple-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>⚡</span> {t.checkout.instaPayTitle}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono"
                            >
                              {t.checkout.instaPayPill}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {t.checkout.instaPayDesc}
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Conditional InstaPay Transfer Inputs */}
                    {selectedPaymentMethod === 'InstaPay' && (
                      <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2.5">
                        <div className="text-[11px] text-purple-300/90 bg-purple-900/40 p-2.5 rounded-lg border border-purple-500/20 leading-relaxed">
                          <span>ℹ️ </span>
                          <span>{t.checkout.recipientAccountNotice}</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            {t.checkout.senderPhoneLabel}
                          </label>
                          <input
                            type="text"
                            value={senderWallet}
                            onChange={(e) => {
                              setSenderWallet(e.target.value);
                              if (walletValidationError) setWalletValidationError(null);
                            }}
                            placeholder={t.checkout.senderPhonePlaceholder}
                            dir="ltr"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                            {t.checkout.transferRefLabel}
                          </label>
                          <input
                            type="text"
                            value={transferReference}
                            onChange={(e) => {
                              setTransferReference(e.target.value);
                              if (walletValidationError) setWalletValidationError(null);
                            }}
                            placeholder={t.checkout.transferRefPlaceholder}
                            dir="ltr"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                          />
                        </div>

                        {walletValidationError && (
                          <p className="text-[11px] text-rose-400 font-medium">
                            ⚠️ {walletValidationError}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 4. PayPal Sandbox */}
                    <label
                      className={`block p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedPaymentMethod === 'PayPal'
                          ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="radio"
                          name="paymentChannel"
                          value="PayPal"
                          checked={selectedPaymentMethod === 'PayPal'}
                          onChange={() => setSelectedPaymentMethod('PayPal')}
                          className="mt-0.5 text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>💳</span> {t.checkout.paypalTitle}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono"
                            >
                              {t.checkout.paypalPill}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {t.checkout.paypalDesc}
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer / Summary Action */}
          {!orderConfirmation && cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}</span>
                  <span className="text-slate-200 font-semibold">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.cart.shipping}</span>
                  <span className="text-emerald-400 font-bold">{t.cart.freeShipping}</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-slate-800">
                  <span>{t.cart.total}</span>
                  <span className="text-emerald-400">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <button
                disabled={isProcessing}
                onClick={handleProcessOrder}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>{t.cart.paypalProcessing}</span>
                  </>
                ) : (
                  <span>
                    {selectedPaymentMethod === 'CashOnDelivery' && `💵 ${t.checkout.placeOrderCod}`}
                    {selectedPaymentMethod === 'Fawry' && `🟡 ${t.checkout.generateFawryCode}`}
                    {selectedPaymentMethod === 'InstaPay' && `⚡ ${t.checkout.submitInstaPay}`}
                    {selectedPaymentMethod === 'PayPal' && `💳 ${t.checkout.checkoutPaypal}`}
                    {' '}({formatCurrency(totalAmount)})
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
