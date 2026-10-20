import React, { useState } from 'react';

export interface ProductFeedItem {
  id: string;
  merchantId: string;
  storeName: string;
  storeSlug: string;
  title: string;
  price: number;
  mediaUrl: string;
  isVideo: boolean;
  rating: number;
}

const mockFeed: ProductFeedItem[] = [
  {
    id: 'prod-001',
    merchantId: 'm-001',
    storeName: 'Sary Boutique',
    storeSlug: 'sary-boutique',
    title: 'Oversized Linen Shirt - Beige',
    price: 650,
    mediaUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800',
    isVideo: false,
    rating: 4.8,
  },
  {
    id: 'prod-002',
    merchantId: 'm-002',
    storeName: 'Leather Craft Cairo',
    storeSlug: 'leather-craft',
    title: 'Handmade Genuine Leather Bag',
    price: 1250,
    mediaUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    isVideo: false,
    rating: 4.9,
  }
];

export const HomeFeed: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<ProductFeedItem | null>(null);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-900 text-white pb-20">
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur p-4 border-b border-slate-800 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Social Commerce Feed
        </h1>
        <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
          Live Feed
        </span>
      </header>

      <main className="space-y-6 p-4">
        {mockFeed.map((item) => (
          <div key={item.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
            {/* Media Box */}
            <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                ⭐ {item.rating.toFixed(1)}
              </div>
            </div>

            {/* Product Meta */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <a
                    href={`/store/${item.storeSlug}`}
                    className="text-xs font-medium text-blue-400 hover:underline tracking-wide"
                  >
                    @{item.storeName}
                  </a>
                  <h3 className="font-semibold text-base text-slate-100">{item.title}</h3>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-400">{item.price} EGP</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setSelectedProduct(item)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/25 flex justify-center items-center gap-2"
              >
                <span>Buy Now</span>
                <span className="text-xs opacity-80">(PayPal & Cards)</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      {/* Checkout Drawer Stub */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Fast Checkout</h2>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-slate-300">You are buying <strong>{selectedProduct.title}</strong> from <em>{selectedProduct.storeName}</em>.</p>
            <div className="p-3 bg-slate-900 rounded-xl text-center text-emerald-400 font-bold text-xl">
              Total: {selectedProduct.price} EGP
            </div>
            <div className="p-4 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl text-center text-xs text-slate-400">
              PayPal Checkout buttons will render here via PayPal JS SDK.
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
