import React, { useState, useEffect } from 'react';
import type { Merchant, Product, PaymentChannel } from '../types';
import { api, type UserDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { StoreIcon, LockIcon, CashIcon, CardIcon, TrashIcon, VideoIcon, ImageIcon } from './icons/Icons';

interface MerchantDashboardProps {
  merchants: Merchant[];
  products: Product[];
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct?: (updatedProduct: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateMerchant?: (updatedMerchant: Merchant) => void;
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
  onUpdateMerchant,
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
          <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <StoreIcon className="w-8 h-8" />
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

  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'ledger' | 'settings'>('orders');

  // Store profile customization state
  const [profileStoreName, setProfileStoreName] = useState(currentMerchant.name);
  const [profileTagline, setProfileTagline] = useState(currentMerchant.tagline || '');
  const [profileBio, setProfileBio] = useState(currentMerchant.bio || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(currentMerchant.avatarUrl || '');
  const [profileBannerUrl, setProfileBannerUrl] = useState(currentMerchant.bannerUrl || '');
  const [profilePhone, setProfilePhone] = useState((currentMerchant as any).phone || '');
  const [profileAddress, setProfileAddress] = useState(currentMerchant.location || 'Zamalek, Cairo');
  const [profileCity, setProfileCity] = useState('Cairo');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const [avatarUploadMode, setAvatarUploadMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [bannerUploadMode, setBannerUploadMode] = useState<'upload' | 'url' | 'preset'>('upload');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarFileRef = React.useRef<HTMLInputElement | null>(null);
  const bannerFileRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setProfileStoreName(currentMerchant.name);
    setProfileTagline(currentMerchant.tagline || '');
    setProfileBio(currentMerchant.bio || '');
    setProfileAvatarUrl(currentMerchant.avatarUrl || '');
    setProfileBannerUrl(currentMerchant.bannerUrl || '');
    setProfilePhone((currentMerchant as any).phone || '');
    setProfileAddress(currentMerchant.location || 'Zamalek, Cairo');
  }, [currentMerchant]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    setProfileErrorMsg(null);
    try {
      const res = await api.uploadMedia(file);
      setProfileAvatarUrl(res.url);
    } catch (err: any) {
      setProfileErrorMsg(err.message || t.merchantDashboard.uploadMediaFailed);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setProfileErrorMsg(null);
    try {
      const res = await api.uploadMedia(file);
      setProfileBannerUrl(res.url);
    } catch (err: any) {
      setProfileErrorMsg(err.message || t.merchantDashboard.uploadMediaFailed);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const updatedMerchantObj: Merchant = {
      ...currentMerchant,
      name: profileStoreName.trim(),
      tagline: profileTagline.trim(),
      bio: profileBio.trim(),
      avatarUrl: profileAvatarUrl.trim(),
      bannerUrl: profileBannerUrl.trim(),
      location: profileAddress.trim(),
    };

    try {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentMerchant.id);
      if (isGuid) {
        await api.updateMerchantProfile(currentMerchant.id, {
          storeName: profileStoreName.trim(),
          tagline: profileTagline.trim(),
          bio: profileBio.trim(),
          avatarUrl: profileAvatarUrl.trim(),
          bannerUrl: profileBannerUrl.trim(),
          phone: profilePhone.trim(),
          address: profileAddress.trim(),
          city: profileCity.trim(),
        });
      }

      if (onUpdateMerchant) {
        onUpdateMerchant(updatedMerchantObj);
      }

      setProfileSuccessMsg(t.merchantDashboard.profileUpdatedSuccess);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      console.warn('Backend updateMerchantProfile fallback:', err);
      if (onUpdateMerchant) {
        onUpdateMerchant(updatedMerchantObj);
      }
      setProfileSuccessMsg(t.merchantDashboard.profileUpdatedSuccess);
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } finally {
      setIsSavingProfile(false);
    }
  };

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
            <LockIcon className="w-4 h-4 shrink-0" />
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
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">{t.storefront.independentMaker}:</span>
            <span className="text-white font-bold">{currentMerchant.name}</span>
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.netPayout}</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓</span>
          </div>
          <div>
            <span className="text-3xl font-black text-emerald-400">{formatCurrency(metrics.availableBalance ?? 0)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{t.merchantDashboard.netPayoutDesc}</p>
        </div>

        {/* Gross Sales */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.grossSales}</span>
          <div>
            <span className="text-3xl font-black text-white">{formatCurrency(metrics.grossSales ?? 0)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{t.merchantDashboard.platformFee} (5%): {formatCurrency(metrics.platformFees ?? 0)}</p>
        </div>

        {/* Total Orders */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{t.merchantDashboard.completedOrders}</span>
          <div>
            <span className="text-3xl font-black text-indigo-400">{formatNumber(metrics.totalOrders ?? orders.length)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{t.merchantDashboard.completedOrdersDesc}</p>
        </div>

        {/* Catalog Items */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
          <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">{t.adminPortal.totalListingsMetric}</span>
          <div>
            <span className="text-3xl font-black text-purple-400">{formatNumber(merchantProducts.length)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{t.product.ratingLabel}: ★ {formatNumber(currentMerchant.rating)}</p>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsOrders} ({formatNumber(orders.length)})
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsProducts} ({formatNumber(merchantProducts.length)})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.merchantDashboard.tabsOverview}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{t.merchantDashboard.tabsStoreProfile}</span>
        </button>
      </div>

      {/* Tab 1: Orders Table */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-extrabold text-base text-white">{t.merchantDashboard.ordersTableTitle}</h3>
            <span className="text-sm text-slate-400">{t.cart.secureNotice}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">{t.merchantDashboard.orderIdCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.customerCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.itemsCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.totalCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.netPayout}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.channelCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.settlementCol}</th>
                  <th className="py-3.5 px-5">{t.merchantDashboard.statusCol}</th>
                  <th className="py-3.5 px-5 text-end">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-white" dir="ltr">{order.id}</td>
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-white">{order.customerName}</p>
                      <p className="text-xs text-slate-400">{order.shippingAddress}</p>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">{order.items.join(', ')}</td>
                    <td className="py-3.5 px-5 font-bold text-white">{formatCurrency(order.totalAmount ?? 0)}</td>
                    <td className="py-3.5 px-5 font-bold text-emerald-400">{formatCurrency(order.netAmount ?? 0)}</td>
                    <td className="py-3.5 px-5">
                      {order.paymentMethod === 'CashOnDelivery' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                          <CashIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.checkout.codTitle}</span>
                        </span>
                      )}
                      {order.paymentMethod === 'Fawry' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          <span>{t.checkout.fawryTitle}</span>
                        </span>
                      )}
                      {order.paymentMethod === 'InstaPay' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                          <span>{t.checkout.instaPayTitle}</span>
                        </span>
                      )}
                      {(order.paymentMethod === 'PayPal' || !order.paymentMethod) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                          <CardIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{t.checkout.paypalTitle}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      {order.settlementStatus === 'Settled' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 whitespace-nowrap text-xs">
                          <span>✓</span> {t.checkout.settled}
                        </span>
                      ) : order.settlementStatus === 'PendingCollection' ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1 whitespace-nowrap text-xs">
                          <span>⏳</span> {t.checkout.pendingCollection}
                        </span>
                      ) : order.settlementStatus === 'PendingVerification' ? (
                        <span className="text-purple-400 font-bold flex items-center gap-1 whitespace-nowrap text-xs">
                          <span>⏳</span> {t.checkout.pendingVerification}
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-bold flex items-center gap-1 whitespace-nowrap text-xs">
                          <span>⏳</span> {t.checkout.awaitingKiosk}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        order.status === 'Fulfilled' || order.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {order.status === 'Paid' ? t.checkout.statusPaid : order.status === 'Fulfilled' ? t.checkout.statusFulfilled : t.checkout.statusPending}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-end">
                      {order.status === 'Paid' ? (
                        <button
                          onClick={() => handleMarkFulfilled(order.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap min-h-[36px]"
                        >
                          {t.merchantDashboard.markDispatched}
                        </button>
                      ) : (
                        <span className="text-slate-500 text-xs">{t.merchantDashboard.completed}</span>
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

            <form onSubmit={handlePublishProduct} className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">{t.merchantDashboard.fieldTitle}</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t.merchantDashboard.fieldTitlePlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">{t.merchantDashboard.fieldPrice}</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="850"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[42px]"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">{t.merchantDashboard.fieldStock}</label>
                  <input
                    type="number"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[42px]"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">{t.merchantDashboard.fieldCategory}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[42px]"
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
                  <label className="text-xs sm:text-sm font-semibold text-slate-300 block">
                    {t.merchantDashboard.fieldMediaUpload}
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setMediaMode('upload')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        mediaMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.merchantDashboard.uploadPill}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaMode('url')}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
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
                              className="w-full h-40 object-cover rounded-xl"
                              controls
                              muted
                              playsInline
                            />
                            <span className="absolute top-2 start-2 bg-purple-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                              <VideoIcon className="w-3.5 h-3.5" />
                              <span>{t.product.videoBadge}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={newMediaUrl}
                              alt="Uploaded product preview"
                              className="w-full h-40 object-cover rounded-xl"
                            />
                            <span className="absolute top-2 start-2 bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{t.filters.mediaImage}</span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 px-1">
                          <span className="text-xs font-mono text-slate-400 truncate max-w-[200px]" dir="ltr">
                            {newMediaUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                          >
                            Replace File
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
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
                            <div className="flex items-center gap-2 text-indigo-400 mb-1">
                              <ImageIcon className="w-6 h-6" />
                              <VideoIcon className="w-6 h-6" />
                            </div>
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
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer min-h-[46px]"
                >
                  {editingProductId ? t.merchantDashboard.saveChangesBtn : t.merchantDashboard.publishProductBtn}
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-2xl text-sm transition-colors cursor-pointer min-h-[46px]"
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
                  className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-4 shadow-md"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
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
                        <span className="absolute bottom-1 end-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
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
                    <h4 className="font-bold text-sm text-white truncate">{product.title}</h4>
                    <p className="text-emerald-400 font-black text-sm mt-0.5">{formatCurrency(product.price ?? 0)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatNumber(product.stockQuantity)} {t.product.inStock} • ★ {formatNumber(product.rating)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(product)}
                      className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title={t.merchantDashboard.editTooltip}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id, product.title)}
                      className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title={t.merchantDashboard.deleteTooltip}
                    >
                      <TrashIcon className="w-4 h-4" />
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
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-base text-white">{t.merchantDashboard.ledgerTransactionsTitle}</h3>
              <p className="text-sm text-slate-400">{t.merchantDashboard.ledgerTransactionsDesc}</p>
            </div>
            <span className="text-xs font-mono text-indigo-400">{t.common.verified}</span>
          </div>

          <div className="space-y-3">
            {ledgerEntries.map((entry, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      entry.type === 'CreditSale' || entry.type === 'DisbursementCredit' ? 'bg-emerald-500/20 text-emerald-300' :
                      entry.type === 'FeeDeduction' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {entry.type}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">{entry.date}</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm">{entry.desc}</p>
                </div>
                <span className={`font-mono font-black text-base ${
                  entry.amount.startsWith('+') ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {entry.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Store Identity & Branding Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-white">{t.merchantDashboard.storeProfileHeading}</h3>
              <p className="text-xs text-slate-400 mt-1">{t.merchantDashboard.storeProfileSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => onViewPublicStore({
                ...currentMerchant,
                name: profileStoreName,
                tagline: profileTagline,
                bio: profileBio,
                avatarUrl: profileAvatarUrl,
                bannerUrl: profileBannerUrl,
                location: profileAddress
              })}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>↗</span>
              <span>{t.merchantDashboard.viewStorefront}</span>
            </button>
          </div>

          {/* Live Storefront Header Preview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {t.merchantDashboard.liveStorePreview}
              </span>
              <span className="text-[11px] font-mono text-slate-500">socialhub.eg/store/{currentMerchant.slug}</span>
            </div>

            {/* Banner Preview */}
            <div className="relative h-44 sm:h-56 w-full bg-slate-950 overflow-hidden">
              {profileBannerUrl ? (
                <img
                  src={profileBannerUrl}
                  alt="Store Cover Banner"
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center text-slate-500 text-xs font-medium gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span>{t.merchantDashboard.storeBannerHint}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
            </div>

            {/* Avatar & Store Info Overlap */}
            <div className="px-6 pb-6 pt-0 relative -mt-12 sm:-mt-14 flex flex-col sm:flex-row items-start sm:items-end gap-5">
              <div className="relative group">
                <img
                  src={profileAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={profileStoreName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-slate-900 shadow-2xl object-cover bg-slate-950"
                />
                <span className="absolute bottom-1 right-1 bg-emerald-500 text-white text-[10px] p-1 rounded-full border-2 border-slate-900" title="Verified Maker">
                  ✓
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xl sm:text-2xl font-black text-white">{profileStoreName || 'Your Boutique Name'}</h4>
                  <span className="text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                    {currentMerchant.city || 'Cairo, Egypt'}
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium">
                  {profileTagline || 'Add your catchy boutique slogan or tagline here'}
                </p>
                <p className="text-xs text-slate-400 max-w-2xl line-clamp-2 leading-relaxed">
                  {profileBio || 'Tell shoppers about your authentic Egyptian craftsmanship, heritage, and creative design philosophy.'}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
            {profileSuccessMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs font-bold animate-fade-in">
                <span className="text-xl text-emerald-400">✓</span>
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-bold animate-fade-in">
                <span className="text-xl text-red-400">⚠️</span>
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {/* 1. Cover Banner Section */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>{t.merchantDashboard.storeBannerLabel}</span>
                  </label>
                  <p className="text-xs text-slate-400">{t.merchantDashboard.storeBannerHint}</p>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold self-start">
                  <button
                    type="button"
                    onClick={() => setBannerUploadMode('upload')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      bannerUploadMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.merchantDashboard.uploadPill}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUploadMode('url')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      bannerUploadMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.merchantDashboard.linkUrlPill}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerUploadMode('preset')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      bannerUploadMode === 'preset' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ✨ Presets
                  </button>
                </div>
              </div>

              {bannerUploadMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    ref={bannerFileRef}
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => bannerFileRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white mb-1">
                      {isUploadingBanner ? t.merchantDashboard.uploadingMedia : t.merchantDashboard.clickToUpload}
                    </p>
                    <p className="text-[11px] text-slate-500">{t.merchantDashboard.uploadSizeHint}</p>
                  </div>
                </div>
              )}

              {bannerUploadMode === 'url' && (
                <div>
                  <input
                    type="url"
                    dir="ltr"
                    value={profileBannerUrl}
                    onChange={(e) => setProfileBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {bannerUploadMode === 'preset' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400">{t.merchantDashboard.presetBannerNotice}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { title: 'Cairo Atelier', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600' },
                      { title: 'Leather Craft', url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=1600' },
                      { title: 'Clay Pottery', url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600' },
                      { title: 'Fashion House', url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1600' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileBannerUrl(preset.url)}
                        className={`group relative rounded-xl overflow-hidden border-2 aspect-video transition-all cursor-pointer ${
                          profileBannerUrl === preset.url ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 flex items-center justify-center p-2 text-center text-[10px] font-bold text-white transition-colors">
                          {preset.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Store Avatar / Logo Section */}
            <div className="space-y-4 border-b border-slate-800 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-indigo-400" />
                    <span>{t.merchantDashboard.storeAvatarLabel}</span>
                  </label>
                  <p className="text-xs text-slate-400">{t.merchantDashboard.storeAvatarHint}</p>
                </div>

                {/* Mode Selector */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold self-start">
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('upload')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      avatarUploadMode === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.merchantDashboard.uploadPill}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('url')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      avatarUploadMode === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.merchantDashboard.linkUrlPill}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarUploadMode('preset')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      avatarUploadMode === 'preset' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ✨ Presets
                  </button>
                </div>
              </div>

              {avatarUploadMode === 'upload' && (
                <div>
                  <input
                    type="file"
                    ref={avatarFileRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => avatarFileRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-colors"
                  >
                    <StoreIcon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-white mb-1">
                      {isUploadingAvatar ? t.merchantDashboard.uploadingMedia : t.merchantDashboard.clickToUpload}
                    </p>
                    <p className="text-[11px] text-slate-500">{t.merchantDashboard.uploadSizeHint}</p>
                  </div>
                </div>
              )}

              {avatarUploadMode === 'url' && (
                <div>
                  <input
                    type="url"
                    dir="ltr"
                    value={profileAvatarUrl}
                    onChange={(e) => setProfileAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {avatarUploadMode === 'preset' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400">{t.merchantDashboard.presetAvatarNotice}</span>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { title: 'Boutique Sari', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400' },
                      { title: 'Leather Maker', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
                      { title: 'Gold Atelier', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
                      { title: 'Fashion Design', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400' },
                      { title: 'Linen Crafter', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileAvatarUrl(preset.url)}
                        className={`relative rounded-2xl overflow-hidden border-2 w-14 h-14 transition-all cursor-pointer ${
                          profileAvatarUrl === preset.url ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105' : 'border-slate-800 hover:border-slate-700'
                        }`}
                        title={preset.title}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Text Details: Store Name, Tagline, Bio, Phone & Address */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.createMerchantModal.storeNameLabel} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileStoreName}
                    onChange={(e) => setProfileStoreName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.merchantDashboard.storeTaglineLabel}
                  </label>
                  <input
                    type="text"
                    value={profileTagline}
                    onChange={(e) => setProfileTagline(e.target.value)}
                    placeholder={t.merchantDashboard.storeTaglinePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {t.merchantDashboard.storeBioLabel}
                </label>
                <textarea
                  rows={4}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder={t.merchantDashboard.storeBioPlaceholder}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.merchantDashboard.storePhoneLabel}
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder={t.merchantDashboard.storePhonePlaceholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 text-start"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.merchantDashboard.storeAddressLabel}
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="e.g. 15 Brazil St, Zamalek"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {t.merchantDashboard.storeCityLabel}
                  </label>
                  <select
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cairo">Cairo (القاهرة)</option>
                    <option value="Giza">Giza (الجيزة)</option>
                    <option value="Alexandria">Alexandria (الإسكندرية)</option>
                    <option value="Mansoura">Mansoura (المنصورة)</option>
                    <option value="Aswan">Aswan (أسوان)</option>
                    <option value="Luxor">Luxor (الأقصر)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isSavingProfile ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>{t.merchantDashboard.savingProfile}</span>
                  </>
                ) : (
                  <span>{t.merchantDashboard.saveProfileBtn}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
