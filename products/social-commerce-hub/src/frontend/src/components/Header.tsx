import React from 'react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateHome: () => void;
  onOpenMerchantModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onSelectCategory,
  activeCategory,
  searchQuery,
  onSearchChange,
  onNavigateHome,
  onOpenMerchantModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 py-1.5 px-4 text-center text-xs font-medium text-indigo-300">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Verified Local Independent Boutiques & Craftsmen across Egypt</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">100% Platform Buyer Protection & PayPal Guaranteed Settlement</span>
        </span>
      </div>

      {/* Main Desktop Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* Brand / Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <span className="text-xl font-black text-white">S</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SocialHub
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Marketplace
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Curated Multi-Store E-Commerce</p>
          </div>
        </div>

        {/* Global Smart Search Bar (Desktop Center) */}
        <div className="flex-1 max-w-2xl relative hidden md:block">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search boutique apparel, handcrafted leather, ceramics, or stores..."
              className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 pl-11 pr-24 py-2.5 rounded-2xl text-sm transition-all shadow-inner"
            />
            <span className="absolute right-3 text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2 py-1 rounded-lg">
              ⌘K
            </span>
          </div>
        </div>

        {/* Action Controls & Cart */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Currency Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
            <span>🇪🇬</span>
            <span className="font-semibold">EGP</span>
          </div>

          {/* Become a Seller CTA */}
          <button
            onClick={onOpenMerchantModal}
            className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>🏬</span>
            <span>Open a Store</span>
          </button>

          {/* Cart Slide-Over Trigger */}
          <button
            onClick={onOpenCart}
            className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2.5 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Secondary Category Subheader (Desktop Horizontal Scroll) */}
      <div className="border-t border-slate-800/80 bg-slate-950/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2 no-scrollbar text-sm">
          {[
            { id: 'all', label: '🔥 All Discoveries' },
            { id: 'fashion', label: '👗 Fashion & Apparel' },
            { id: 'leather', label: '👜 Handcrafted Leather' },
            { id: 'home', label: '🏺 Ceramics & Home' },
            { id: 'accessories', label: '✨ Accessories' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
