import React, { useState, useEffect } from 'react';
import type { Merchant, Product, PaymentChannel } from '../types';
import { api, type UserDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface MerchantDashboardProps {
  merchants: Merchant[];
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onViewPublicStore: (merchant: Merchant) => void;
  currentUser?: UserDto | null;
  onOpenAuthModal?: () => void;
}

export const MerchantDashboard: React.FC<MerchantDashboardProps> = ({
  merchants,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onViewPublicStore,
  currentUser,
  onOpenAuthModal
}) => {
  const { t, formatCurrency, formatNumber, isRTL } = useTranslation();

  // Guard: Only authenticated merchants with role 'Merchant' have access to manage a store dashboard
  if (currentUser?.role !== 'Merchant') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center animate-fade-in">
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-purple-500/30">
            🏪
          </div>
          <h2 className="text-2xl font-black text-white mb-2">{t.merchantDashboard.title}</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            {currentUser?.role === 'Admin'
              ? (isRTL 
                  ? 'بصفتك مسؤول المنصة، يمكنك إدارة المتاجر وحذف المنتجات من مركز التحكم الإداري.'
                  : 'As an administrator, you manage store suspension and catalog moderation from the Admin Command Center.')
              : (isRTL
                  ? 'كل تاجر له خصوصية وإدارة متجره فقط. يرجى تسجيل الدخول بحساب تاجر للتحكم في المنتجات والمبيعات.'
                  : 'Each merchant has exclusive control over their own store. To manage products and sales, please sign in with your verified merchant account.')}
          </p>
          {currentUser?.role !== 'Admin' && onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {t.header.signIn}
            </button>
          )}
        </div>
      </div>
    );
  }

  const userMerchant = merchants.find(m => m.id === currentUser.merchantId || m.slug === currentUser.storeSlug) 
                     || merchants[0] 
                     || { id: currentUser.merchantId || 'm-default', name: currentUser.fullName, slug: currentUser.storeSlug || 'store', tagline: 'Independent Boutique', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' } as Merchant;

  const currentMerchant = userMerchant;
  const merchantProducts = products.filter(p => p.merchantId === currentMerchant.id);

  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'ledger'>('orders');

  // New product form state
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newIsVideo, setNewIsVideo] = useState(false);
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [newCategory, setNewCategory] = useState<'fashion' | 'leather' | 'accessories' | 'home'>('fashion');
  const [newStock, setNewStock] = useState('10');
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const handleStartEdit = (prod: Product) => {
    setEditingProductId(prod.id);
    setNewTitle(prod.title);
    setNewPrice(prod.price.toString());
    setNewStock(prod.stockQuantity.toString());
    setNewCategory(prod.category || 'fashion');
    setNewMediaUrl(prod.mediaUrl);
    setNewIsVideo(prod.isVideo ?? false);
    setMediaMode(prod.mediaUrl.startsWith('/uploads') ? 'upload' : 'url');
    const formEl = document.getElementById('product-form-card');
    formEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setNewTitle('');
    setNewPrice('');
    setNewStock('10');
    setNewCategory('fashion');
    setNewMediaUrl('');
    setNewIsVideo(false);
  };

  const handleDeleteProduct = async (productId: string, title: string) => {
    const confirmMsg = t.merchantDashboard.deleteProductConfirm.replace('{title}', title);
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
      if (isGuid) {
        await api.deleteProduct(currentMerchant.id, productId);
      }
      if (onDeleteProduct) {
        onDeleteProduct(productId);
      }
      if (editingProductId === productId) {
        handleCancelEdit();
      }
    } catch (err: any) {
      alert(err.message || t.merchantDashboard.deleteProductFailed);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadMedia(file);
      setNewMediaUrl(result.url);
      setNewIsVideo(result.isVideo);
    } catch (err: any) {
      setUploadError(err.message || t.merchantDashboard.uploadMediaFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const [metrics, setMetrics] = useState({
    availableBalance: 14250,
    grossSales: 15000,
    totalOrders: 3,
    platformFees: 750
  });

  const [orders, setOrders] = useState([
    {
      id: 'ORD-849201',
      customerName: 'Youssef El-Gohary',
      customerEmail: 'youssef@example.com',
      shippingAddress: '15 Nile Corniche, Zamalek, Cairo',
      totalAmount: 1250,
      netAmount: 1187.5,
      paymentMethod: 'Fawry' as PaymentChannel,
      settlementStatus: 'Settled',
      status: 'Paid',
      createdAt: '2026-10-20 14:15',
      items: ['Handmade Genuine Leather Bag (x1)']
    },
    {
      id: 'ORD-849188',
      customerName: 'Sarah Mansour',
      customerEmail: 'sarah.m@gmail.com',
      shippingAddress: '8 Degla St, Maadi, Cairo',
      totalAmount: 650,
      netAmount: 617.5,
      paymentMethod: 'CashOnDelivery' as PaymentChannel,
      settlementStatus: 'PendingCollection',
      status: 'Pending',
      createdAt: '2026-10-19 18:30',
      items: ['Oversized Linen Shirt - Beige (x1)']
    },
    {
      id: 'ORD-849102',
      customerName: 'Karim Zaki',
      customerEmail: 'karim.zaki@corp.com',
      shippingAddress: '22 El-Horreya Ave, Heliopolis, Cairo',
      totalAmount: 920,
      netAmount: 874,
      paymentMethod: 'InstaPay' as PaymentChannel,
      settlementStatus: 'PendingVerification',
      status: 'Pending',
      createdAt: '2026-10-18 11:20',
      items: ['Classic Leather Cardholder (x2), Linen Scarf (x1)']
    }
  ]);

  const [ledgerEntries, setLedgerEntries] = useState([
    { type: 'CreditSale', amount: '+1,250 EGP', desc: 'Gross customer payment for Order #ORD-849201', date: '2026-10-20' },
    { type: 'FeeDeduction', amount: '-62.5 EGP', desc: 'Platform operational fee (5%) for Order #ORD-849201', date: '2026-10-20' },
    { type: 'CreditSale', amount: '+650 EGP', desc: 'Gross customer payment for Order #ORD-849188', date: '2026-10-19' },
    { type: 'FeeDeduction', amount: '-32.5 EGP', desc: 'Platform operational fee (5%) for Order #ORD-849188', date: '2026-10-19' },
    { type: 'Payout', amount: '-8,500 EGP', desc: 'Disbursement to Commercial International Bank (CIB) Egypt', date: '2026-10-15' }
  ]);

  useEffect(() => {
    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentMerchant.id);
    if (!isGuid) return;

    // Fetch dashboard KPIs
    api.getMerchantDashboard(currentMerchant.id)
      .then((dash) => {
        if (dash) {
          setMetrics({
            availableBalance: dash.totalNetEarnings ?? dash.balance ?? 0,
            grossSales: dash.totalGrossSales ?? 0,
            totalOrders: dash.totalOrdersCount ?? 0,
            platformFees: dash.totalPlatformFees ?? 0
          });
        }
      })
      .catch(() => {});

    // Fetch orders
    api.getMerchantOrders(currentMerchant.id)
      .then((apiOrders) => {
        if (apiOrders && apiOrders.length > 0) {
          setOrders(apiOrders.map(o => ({
            id: o.id,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            shippingAddress: o.shippingAddress,
            totalAmount: o.totalAmount,
            netAmount: o.merchantNetAmount,
            paymentMethod: (o.paymentMethod || 'PayPal') as PaymentChannel,
            settlementStatus: o.settlementStatus || (o.status === 'Paid' || o.status === 'Fulfilled' ? 'Settled' : 'PendingPayment'),
            status: o.status,
            createdAt: new Date(o.createdAt).toLocaleString(),
            items: o.items.map(i => `${i.productTitle} (x${i.quantity})`)
          })));
        }
      })
      .catch(() => {});

    // Fetch ledger
    api.getMerchantLedger(currentMerchant.id)
      .then((ledger) => {
        if (ledger && ledger.length > 0) {
          setLedgerEntries(ledger.map(l => ({
            type: l.type,
            amount: (l.type === 'DisbursementCredit' ? '+' : '-') + l.amount.toLocaleString() + ' EGP',
            desc: l.description,
            date: new Date(l.createdAt).toLocaleDateString()
          })));
        }
      })
      .catch(() => {});
  }, [currentMerchant.id]);

  const handleMarkFulfilled = async (orderId: string) => {
    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      if (isGuid) {
        await api.updateOrderStatus(orderId, 'Fulfilled');
      }
    } catch (err) {
      console.warn('Backend order update fallback:', err);
    }

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Fulfilled' } : o));
  };

  const handlePublishProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newPrice);
    const stockNum = parseInt(newStock, 10);

    if (editingProductId) {
      // Edit existing product
      const updatedProduct: Product = {
        id: editingProductId,
        merchantId: currentMerchant.id,
        storeName: currentMerchant.name,
        storeSlug: currentMerchant.slug,
        title: newTitle,
        price: priceNum,
        mediaUrl: newMediaUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
        isVideo: newIsVideo || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(newMediaUrl),
        category: newCategory,
        rating: 5.0,
        reviewCount: 0,
        stockQuantity: stockNum,
        isFeatured: false
      };

      try {
        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingProductId);
        if (isGuid) {
          await api.updateProduct(currentMerchant.id, editingProductId, {
            title: newTitle,
            price: priceNum,
            mediaUrl: updatedProduct.mediaUrl,
            isVideo: updatedProduct.isVideo ?? false,
            stockQuantity: stockNum
          });
        }
      } catch (err) {
        console.warn('Backend product update fallback:', err);
      }

      if (onUpdateProduct) {
        onUpdateProduct(updatedProduct);
      }
      setPublishSuccess(true);
      setEditingProductId(null);
      setNewTitle('');
      setNewPrice('');
      setNewMediaUrl('');
      setNewIsVideo(false);
      setTimeout(() => setPublishSuccess(false), 2000);
      return;
    }

    // New product creation
    const product: Product = {
      id: 'p-' + Date.now(),
      merchantId: currentMerchant.id,
      storeName: currentMerchant.name,
      storeSlug: currentMerchant.slug,
      title: newTitle,
      price: priceNum,
      mediaUrl: newMediaUrl || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800',
      isVideo: newIsVideo || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(newMediaUrl),
      category: newCategory,
      rating: 5.0,
      reviewCount: 0,
      stockQuantity: stockNum,
      isFeatured: false
    };

    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentMerchant.id);
      if (isGuid) {
        const published = await api.addProduct(currentMerchant.id, {
          title: newTitle,
          price: priceNum,
          mediaUrl: product.mediaUrl,
          isVideo: product.isVideo ?? false,
          stockQuantity: stockNum
        });
        product.id = published.id;
      }
    } catch (err) {
      console.warn('Backend product publish fallback:', err);
    }

    onAddProduct(product);
    setPublishSuccess(true);
    setNewTitle('');
    setNewPrice('');
    setNewMediaUrl('');
    setNewIsVideo(false);
    setTimeout(() => setPublishSuccess(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Tenant Security Banner */}
      {(!currentUser || currentUser.role !== 'Merchant') && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="text-base">🔒</span>
            <span>{t.merchantDashboard.storePreviewModeBanner}</span>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md"
            >
              {t.merchantDashboard.signInAsMerchantAction}
            </button>
          )}
        </div>
      )}

      {/* Top Merchant Bar & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentMerchant.avatarUrl}
            alt={currentMerchant.name}
            className="w-16 h-16 rounded-2xl border-2 border-indigo-500/40 object-cover shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{currentMerchant.name}</h2>
              <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                ● {t.storefront.verifiedBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentMerchant.tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Verified Store Ownership Badge */}
          <div className="flex items-center gap-2 bg-slate-950 border border-indigo-500/40 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-indigo-400 font-bold">🔒 {t.storefront.independentMaker}:</span>
            <span className="text-white font-extrabold">{currentMerchant.name}</span>
          </div>

          <button
            onClick={() => onViewPublicStore(currentMerchant)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            ↗ {t.merchantDashboard.viewStorefront}
          </button>
        </div>
      </div>

      {/* 4 Financial & Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Net Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.netPayout}</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓</span>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-400">{formatCurrency(metrics.availableBalance ?? 0)}</span>
          </div>
          <p className="text-[11px] text-slate-500">{t.merchantDashboard.netPayoutDesc}</p>
        </div>

        {/* Gross Sales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.grossSales}</span>
          <div>
            <span className="text-3xl font-black text-white">{formatCurrency(metrics.grossSales ?? 0)}</span>
          </div>
          <p className="text-[11px] text-slate-500">{t.merchantDashboard.platformFee} (5%): {formatCurrency(metrics.platformFees ?? 0)}</p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.completedOrders}</span>
          <div>
            <span className="text-3xl font-black text-indigo-400">{formatNumber(metrics.totalOrders ?? orders.length)}</span>
          </div>
          <p className="text-[11px] text-slate-500">{t.merchantDashboard.completedOrdersDesc}</p>
        </div>

        {/* Catalog Items */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.adminPortal.totalListingsMetric}</span>
          <div>
            <span className="text-3xl font-black text-purple-400">{formatNumber(merchantProducts.length)}</span>
          </div>
          <p className="text-[11px] text-slate-500">{t.product.ratingLabel}: ★ {formatNumber(currentMerchant.rating)}</p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsOrders} ({formatNumber(orders.length)})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsProducts} ({formatNumber(merchantProducts.length)})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsOverview}
        </button>
      </div>

      {/* Tab 1: Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-white">{t.merchantDashboard.ordersTableTitle}</h3>
            <span className="text-xs text-slate-400">{t.cart.secureNotice}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">{t.merchantDashboard.orderIdCol}</th>
                  <th className="p-4">{t.merchantDashboard.customerCol}</th>
                  <th className="p-4">{t.merchantDashboard.itemsCol}</th>
                  <th className="p-4">{t.merchantDashboard.totalCol}</th>
                  <th className="p-4">{t.merchantDashboard.netPayout}</th>
                  <th className="p-4">{t.merchantDashboard.channelCol}</th>
                  <th className="p-4">{t.merchantDashboard.settlementCol}</th>
                  <th className="p-4">{t.merchantDashboard.statusCol}</th>
                  <th className="p-4 text-end">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white" dir="ltr">{order.id}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{order.customerName}</p>
                      <p className="text-[11px] text-slate-400">{order.shippingAddress}</p>
                    </td>
                    <td className="p-4 text-slate-400">{order.items.join(', ')}</td>
                    <td className="p-4 font-bold text-white">{formatCurrency(order.totalAmount ?? 0)}</td>
                    <td className="p-4 font-bold text-emerald-400">{formatCurrency(order.netAmount ?? 0)}</td>
                    <td className="p-4">
                      {order.paymentMethod === 'CashOnDelivery' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          💵 {t.checkout.codTitle}
                        </span>
                      )}
                      {order.paymentMethod === 'Fawry' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 whitespace-nowrap">
                          🟡 {t.checkout.fawryTitle}
                        </span>
                      )}
                      {order.paymentMethod === 'InstaPay' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                          ⚡ {t.checkout.instaPayTitle}
                        </span>
                      )}
                      {(order.paymentMethod === 'PayPal' || !order.paymentMethod) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
                          💳 {t.checkout.paypalTitle}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {order.settlementStatus === 'Settled' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 whitespace-nowrap text-[11px]">
                          <span>✓</span> {t.checkout.settled}
                        </span>
                      ) : order.settlementStatus === 'PendingCollection' ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1 whitespace-nowrap text-[11px]">
                          <span>⏳</span> {t.checkout.pendingCollection}
                        </span>
                      ) : order.settlementStatus === 'PendingVerification' ? (
                        <span className="text-purple-400 font-bold flex items-center gap-1 whitespace-nowrap text-[11px]">
                          <span>⏳</span> {t.checkout.pendingVerification}
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap text-[11px]">
                          <span>⏳</span> {t.checkout.awaitingKiosk}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                        order.status === 'Fulfilled' || order.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {order.status === 'Paid' ? t.checkout.statusPaid : order.status === 'Fulfilled' ? t.checkout.statusFulfilled : t.checkout.statusPending}
                      </span>
                    </td>
                    <td className="p-4 text-end">
                      {order.status === 'Paid' ? (
                        <button
                          onClick={() => handleMarkFulfilled(order.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                        >
                          {t.merchantDashboard.markDispatched}
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px]">{t.merchantDashboard.completed}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Catalog & New Product Form */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Product Publishing & Editing Form */}
          <div id="product-form-card" className={`bg-slate-900 border rounded-3xl p-6 space-y-4 shadow-xl transition-all ${
            editingProductId ? 'border-indigo-500/60 ring-2 ring-indigo-500/20' : 'border-slate-800'
          }`}>
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">
                  {editingProductId ? t.merchantDashboard.editProductTitle : t.merchantDashboard.addProductTitle}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingProductId ? t.merchantDashboard.editProductDesc : t.merchantDashboard.addProductDesc}
                </p>
              </div>
              {editingProductId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  ✕ {t.merchantDashboard.cancelEdit}
                </button>
              )}
            </div>

            {publishSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold text-center">
                ✓ {editingProductId ? t.merchantDashboard.productUpdatedSuccess : t.merchantDashboard.productPublishedSuccess}
              </div>
            )}

            <form onSubmit={handlePublishProduct} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t.merchantDashboard.fieldTitle}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.merchantDashboard.fieldTitlePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t.merchantDashboard.fieldPrice}</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="850"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">{t.merchantDashboard.fieldStock}</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t.merchantDashboard.fieldCategory}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="fashion">{t.categories.fashion}</option>
                  <option value="leather">{t.categories.leather}</option>
                  <option value="home">{t.categories.home}</option>
                  <option value="accessories">{t.categories.accessories}</option>
                </select>
              </div>

              {/* Media Asset Section (Image or Video) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {t.merchantDashboard.fieldMediaUpload}
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMediaMode('upload')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        mediaMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.merchantDashboard.uploadPill}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaMode('url')}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        mediaMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.merchantDashboard.linkUrlPill}
                    </button>
                  </div>
                </div>

                {mediaMode === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />

                    {newMediaUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2">
                        {newIsVideo || /\.(mp4|webm|mov|mkv)/i.test(newMediaUrl) ? (
                          <div className="relative">
                            <video
                              src={newMediaUrl}
                              className="w-full h-36 object-cover rounded-xl"
                              controls
                              muted
                              playsInline
                            />
                            <span className="absolute top-2 start-2 bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                              🎥 {t.product.videoBadge}
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={newMediaUrl}
                              alt="Uploaded product preview"
                              className="w-full h-36 object-cover rounded-xl"
                            />
                            <span className="absolute top-2 start-2 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                              📸 {t.filters.mediaImage}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 px-1">
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" dir="ltr">
                            {newMediaUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                          >
                            Replace File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                          isUploading
                            ? 'border-indigo-500 bg-indigo-950/20'
                            : 'border-slate-800 hover:border-indigo-500/60 bg-slate-950/60 hover:bg-slate-950'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-indigo-300">{t.merchantDashboard.uploadingMedia}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 py-1">
                            <span className="text-2xl">📸 🎥</span>
                            <span className="text-xs font-bold text-white">{t.merchantDashboard.dragDropText} {t.merchantDashboard.clickToUpload}</span>
                            <p className="text-[10px] text-slate-400">
                              {t.merchantDashboard.uploadSizeHint}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-rose-400 text-[11px] mt-1 font-semibold">{uploadError}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder={t.merchantDashboard.urlPlaceholder}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      dir="ltr"
                    />
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newIsVideo}
                        onChange={(e) => setNewIsVideo(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                      />
                      <span>{t.merchantDashboard.videoCheckbox}</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {editingProductId ? t.merchantDashboard.saveChangesBtn : t.merchantDashboard.publishProductBtn}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-xs transition-colors cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Published Products Grid */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-base text-white">{t.merchantDashboard.currentProductsTitle} ({formatNumber(merchantProducts.length)})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {merchantProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 shadow-md"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                    {product.isVideo || /\.(mp4|webm|mov|mkv)/i.test(product.mediaUrl) ? (
                      <>
                        <video
                          src={product.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                        <span className="absolute bottom-1 end-1 bg-purple-600 text-white text-[9px] font-bold px-1 rounded">
                          ▶
                        </span>
                      </>
                    ) : (
                      <img
                        src={product.mediaUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{product.title}</h4>
                    <p className="text-emerald-400 font-extrabold text-xs mt-0.5">{formatCurrency(product.price ?? 0)}</p>
                    <p className="text-[11px] text-slate-400">{formatNumber(product.stockQuantity)} {t.product.inStock} • ★ {formatNumber(product.rating)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(product)}
                      className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title={t.merchantDashboard.editTooltip}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.title)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      title={t.merchantDashboard.deleteTooltip}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Financial Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-base text-white">{t.merchantDashboard.ledgerTransactionsTitle}</h3>
              <p className="text-xs text-slate-400">{t.merchantDashboard.ledgerTransactionsDesc}</p>
            </div>
            <span className="text-xs font-mono text-indigo-400">{t.common.verified}</span>
          </div>

          <div className="space-y-3">
            {ledgerEntries.map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      entry.type === 'CreditSale' || entry.type === 'DisbursementCredit' ? 'bg-emerald-500/20 text-emerald-300' :
                      entry.type === 'FeeDeduction' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {entry.type}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{entry.date}</span>
                  </div>
                  <p className="text-slate-300">{entry.desc}</p>
                </div>
                <span className={`font-mono font-black text-sm ${
                  entry.amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {entry.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
