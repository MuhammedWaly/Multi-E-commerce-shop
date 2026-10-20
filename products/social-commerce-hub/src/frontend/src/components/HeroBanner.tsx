import React from 'react';

interface HeroBannerProps {
  onExploreClick: () => void;
  onStoresClick: () => void;
  onSeeAllClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick, onStoresClick, onSeeAllClick }) => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl my-6">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 sm:py-16 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Copy */}
        <div className="max-w-2xl text-center lg:text-left space-y-5">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
            <span>✨ Egypt's Premier Multi-Merchant Discovery Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Shop Directly from <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Independent Creators & Boutiques
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Explore authentic linen fashion, heritage hand-stitched leather, and Tunis Village pottery. Every purchase directly empowers local Egyptian makers with seamless PayPal checkout.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={onExploreClick}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-5 py-3 rounded-2xl text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>🛍️ Explore Marketplace</span>
              <span>↓</span>
            </button>
            {onSeeAllClick && (
              <button
                onClick={onSeeAllClick}
                className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold px-5 py-3 rounded-2xl text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔍 See All Products</span>
                <span>↗</span>
              </button>
            )}
            <button
              onClick={onStoresClick}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-5 py-3 rounded-2xl text-sm transition-colors cursor-pointer"
            >
              🏬 Top Stores
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-md mx-auto lg:mx-0">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white">100%</p>
              <p className="text-xs text-slate-400">Verified Makers</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">4.9 ★</p>
              <p className="text-xs text-slate-400">Customer Rating</p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-indigo-400">Fast</p>
              <p className="text-xs text-slate-400">Express Delivery</p>
            </div>
          </div>
        </div>

        {/* Right Visual Collage */}
        <div className="w-full lg:w-5/12 grid grid-cols-2 gap-3.5 max-w-md">
          <div className="space-y-3.5">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-xl border border-slate-800 group">
              <img
                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600"
                alt="Linen Shirt"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white">
                Linen Fashion
              </span>
            </div>
          </div>
          <div className="space-y-3.5 pt-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-xl border border-slate-800 group">
              <img
                src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"
                alt="Leather Bag"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white">
                Handmade Leather
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
