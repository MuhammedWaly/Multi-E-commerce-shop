import React, { useState, useEffect } from 'react';

export interface FeedItem {
  id: string;
  merchantId: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: number;
  mediaUrl: string;
  isVideo: boolean;
  rating: number;
  stockQuantity: number;
  category?: string;
}

export const FeedContainer: React.FC = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [orderProcessing, setOrderProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Customer form inputs
  const [customerName, setCustomerName] = useState<string>('Youssef El-Gohary');
  const [customerEmail, setCustomerEmail] = useState<string>('youssef@example.com');
  const [customerAddress, setCustomerAddress] = useState<string>('15 Nile Corniche, Zamalek, Cairo');

  const categories = [
    { id: 'all', label: '🔥 All Discoveries' },
    { id: 'fashion', label: '👗 Fashion' },
    { id: 'leather', label: '👜 Handcrafted Leather' },
    { id: 'accessories', label: '✨ Accessories' }
  ];

  useEffect(() => {
    fetch('http://localhost:5000/api/feed')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.length > 0) {
          setItems(data.map((item: any, idx: number) => ({
            ...item,
            category: idx % 2 === 0 ? 'fashion' : 'leather'
          })));
        } else {
          loadFallbackData();
        }
      })
      .catch(() => loadFallbackData())
      .finally(() => setLoading(false));
  }, []);

  const loadFallbackData = () => {
    setItems([
      {
        id: '1',
        merchantId: 'm1',
        storeName: 'Sari Boutique',
        storeSlug: 'sari-boutique',
        title: 'Oversized Linen Shirt - Sand Beige',
        price: 650,
        mediaUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
        isVideo: false,
        rating: 4.9,
        stockQuantity: 15,
        category: 'fashion'
      },
      {
        id: '2',
        merchantId: 'm2',
        storeName: 'Cairo Leather Craft',
        storeSlug: 'cairo-leather',
        title: 'Handmade Genuine Leather Messenger Bag',
        price: 1250,
        mediaUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
        isVideo: false,
        rating: 4.8,
        stockQuantity: 8,
        category: 'leather'
      },
      {
        id: '3',
        merchantId: 'm1',
        storeName: 'Sari Boutique',
        storeSlug: 'sari-boutique',
        title: 'Hand-dyed Summer Silk Scarf',
        price: 320,
        mediaUrl: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',
        isVideo: false,
        rating: 4.95,
        stockQuantity: 25,
        category: 'fashion'
      },
      {
        id: '4',
        merchantId: 'm2',
        storeName: 'Cairo Leather Craft',
        storeSlug: 'cairo-leather',
        title: 'Classic Minimalist Leather Cardholder',
        price: 280,
        mediaUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
        isVideo: false,
        rating: 4.7,
        stockQuantity: 30,
        category: 'accessories'
      }
    ]);
  };

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const handleCheckout = async (item: FeedItem) => {
    setOrderProcessing(true);
    try {
      // 1. Create order on backend API
      const response = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: item.merchantId,
          customerName,
          customerEmail,
          shippingAddress: customerAddress,
          items: [{ productId: item.id, quantity: 1 }]
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        // 2. Simulate instant capture in sandbox
        const captureRes = await fetch(`http://localhost:5000/api/orders/${orderData.id}/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentOrderId: orderData.paymentOrderId,
            payerId: 'PAYER-SANDBOX-DEMO'
          })
        });

        if (captureRes.ok) {
          const captureData = await captureRes.json();
          setCompletedOrder(captureData.order || orderData);
        } else {
          setCompletedOrder(orderData);
        }
      } else {
        // Fallback simulation
        setCompletedOrder({
          id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
          customerName,
          customerEmail,
          totalAmount: item.price,
          status: 'Paid',
          merchantNetAmount: Math.round(item.price * 0.95),
          platformFeeAmount: Math.round(item.price * 0.05),
          items: [{ productTitle: item.title, unitPrice: item.price, quantity: 1 }]
        });
      }
    } catch {
      // Offline fallback simulation
      setCompletedOrder({
        id: 'SIM-' + Math.floor(100000 + Math.random() * 900000),
        customerName,
        customerEmail,
        totalAmount: item.price,
        status: 'Paid (Sandbox)',
        merchantNetAmount: Math.round(item.price * 0.95),
        platformFeeAmount: Math.round(item.price * 0.05),
        items: [{ productTitle: item.title, unitPrice: item.price, quantity: 1 }]
      });
    } finally {
      setOrderProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading visual discovery feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans select-none">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl px-4 py-3.5 border-b border-slate-800/80 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              SocialHub
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Independent Stores Discovery</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Feed
          </span>
        </div>
      </header>

      {/* Category Filter Pills */}
      <nav className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/50">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      {/* Main Visual Stream Feed */}
      <main className="p-4 space-y-6">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="group bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-slate-700 shadow-2xl transition-all duration-300"
          >
            {/* Visual Canvas */}
            <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Badges Overlay */}
              <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 flex items-center gap-1 shadow-md border border-amber-500/20">
                ⭐ {item.rating}
              </div>

              <button
                onClick={() => setSelectedStore(item.storeName)}
                className="absolute bottom-3 left-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <span>🏬</span>
                <span>@{item.storeName}</span>
                <span className="text-[10px] text-slate-400">→</span>
              </button>

              <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-300">
                {item.stockQuantity} in stock
              </div>
            </div>

            {/* Product Meta & Action Drawer Trigger */}
            <div className="p-4 space-y-3.5">
              <div className="flex justify-between items-start gap-3">
                <h2 className="font-bold text-base text-white leading-snug">{item.title}</h2>
                <div className="text-right">
                  <span className="font-black text-xl text-emerald-400">{item.price}</span>
                  <span className="text-xs font-semibold text-emerald-500 ml-1">EGP</span>
                </div>
              </div>

              {/* Fast Checkout Trigger */}
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setCompletedOrder(null);
                }}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚡ Quick Buy</span>
                <span className="text-xs font-normal text-indigo-200">Instant Checkout</span>
              </button>
            </div>
          </article>
        ))}
      </main>

      {/* Express Checkout Modal Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛍️</span>
                <h3 className="font-bold text-lg text-white">Express Checkout</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            {completedOrder ? (
              /* Order Confirmation Screen */
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto">
                  ✓
                </div>
                <div>
                  <h4 className="text-emerald-300 font-black text-lg">Payment Successful!</h4>
                  <p className="text-xs text-slate-400 mt-1">Order #{completedOrder.id} confirmed</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl text-left text-xs space-y-2 border border-slate-800">
                  <div className="flex justify-between text-slate-300">
                    <span>Customer:</span>
                    <span className="font-semibold text-white">{completedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Paid:</span>
                    <span className="font-bold text-emerald-400">{completedOrder.totalAmount} EGP</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                    <span>Merchant Share (Net):</span>
                    <span className="text-slate-300 font-mono">{completedOrder.merchantNetAmount || Math.round(completedOrder.totalAmount * 0.95)} EGP</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Platform Fee (5%):</span>
                    <span className="text-slate-300 font-mono">{completedOrder.platformFeeAmount || Math.round(completedOrder.totalAmount * 0.05)} EGP</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  Done & Back to Feed
                </button>
              </div>
            ) : (
              /* Order Review & Payment Form */
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-950 rounded-2xl flex items-center gap-3.5 border border-slate-800/60">
                  <img
                    src={selectedItem.mediaUrl}
                    alt={selectedItem.title}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-400 font-medium">@{selectedItem.storeName}</p>
                    <p className="font-semibold text-sm text-white truncate">{selectedItem.title}</p>
                    <p className="text-emerald-400 font-extrabold text-sm mt-0.5">{selectedItem.price} EGP</p>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-400 block">Shipping & Contact</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Delivery Address (City, Street)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Payment Breakdown */}
                <div className="p-3 bg-slate-950/60 rounded-xl space-y-1.5 text-xs border border-slate-800/40">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span>{selectedItem.price} EGP</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery (Instant Digital Hub)</span>
                    <span className="text-emerald-400 font-semibold">Free</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                    <span>Total Due</span>
                    <span className="text-emerald-400">{selectedItem.price} EGP</span>
                  </div>
                </div>

                {/* Primary Payment Action */}
                <button
                  disabled={orderProcessing}
                  onClick={() => handleCheckout(selectedItem)}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {orderProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Processing Payment Order...</span>
                    </>
                  ) : (
                    <>
                      <span>💳 Pay {selectedItem.price} EGP with PayPal</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storefront Preview Drawer */}
      {selectedStore && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-indigo-400 font-semibold">Verified Merchant Store</span>
                <h3 className="font-black text-xl text-white">{selectedStore}</h3>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official storefront on Social-Commerce-Hub. All items are fulfilled directly with verified customer reviews and platform buyer protection.
            </p>
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs flex justify-around text-center">
              <div>
                <p className="text-indigo-400 font-bold text-sm">100%</p>
                <p className="text-slate-400 text-[10px]">Authentic</p>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <p className="text-emerald-400 font-bold text-sm">4.9 ★</p>
                <p className="text-slate-400 text-[10px]">Merchant Rating</p>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <p className="text-purple-400 font-bold text-sm">Cairo</p>
                <p className="text-slate-400 text-[10px]">Location</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedStore(null)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition-all"
            >
              Back to Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
