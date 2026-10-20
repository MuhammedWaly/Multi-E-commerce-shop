import React, { useState, useEffect, useRef } from 'react';
import { api, type UserDto, type SearchResponseDto } from '../services/api';

export type PortalType = 'buyer' | 'merchant' | 'admin';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onExecuteSearch?: (query: string) => void;
  onNavigateHome: () => void;
  onOpenMerchantModal: () => void;
  activePortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  currentUser: UserDto | null;
  onOpenAuthModal: () => void;
  onOpenBuyerOrders: () => void;
  onOpenAccountSettings?: () => void;
  onSelectStore?: (slug: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onSelectCategory,
  activeCategory,
  searchQuery,
  onSearchChange,
  onExecuteSearch,
  onNavigateHome,
  onOpenMerchantModal,
  activePortal,
  onSelectPortal,
  currentUser,
  onOpenAuthModal,
  onOpenBuyerOrders,
  onOpenAccountSettings,
  onSelectStore,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'Admin';
  const isMerchant = currentUser?.role === 'Merchant';

  // Debounced search state
  const [debouncedResults, setDebouncedResults] = useState<SearchResponseDto | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const handleExecuteSearch = (q: string) => {
    setShowDropdown(false);
    if (onExecuteSearch) {
      onExecuteSearch(q);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch(searchQuery);
    }
  };

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setDebouncedResults(null);
      setIsSearching(false);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    // Debounce: wait 350ms after user pauses typing
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(searchQuery.trim());
        setDebouncedResults(res);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStoreClick = (slug: string) => {
    setShowDropdown(false);
    if (onSelectStore) {
      onSelectStore(slug);
    }
  };

  const handleProductClick = (title: string) => {
    setShowDropdown(false);
    onSearchChange(title);
    handleExecuteSearch(title);
  };

  const portalLabel = 
    activePortal === 'admin' 
      ? 'Admin Center' 
      : activePortal === 'merchant' 
      ? 'Seller Portal' 
      : 'Marketplace';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 py-1.5 px-4 text-center text-xs font-medium text-indigo-300">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Verified Local Independent Boutiques & Craftsmen across Egypt</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">Role-Based Access Control & JWT Multi-Tenant Shield</span>
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
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                activePortal === 'admin'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : activePortal === 'merchant'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
              }`}>
                {portalLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Curated Multi-Store E-Commerce</p>
          </div>
        </div>

        {/* Global Smart Search Bar (Desktop Center - Visible in Buyer view) */}
        {activePortal === 'buyer' && (
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </span>
              <input
                type="text"
                value={searchQuery}
                onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search boutique apparel, handcrafted leather, ceramics, or stores..."
                className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 pl-11 pr-28 py-2.5 rounded-2xl text-sm transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute right-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                title="Search or press Enter"
              >
                <span>Search</span>
                <span className="text-[10px] opacity-75">↵</span>
              </button>
            </div>

            {/* Debounced Search Results Live Dropdown */}
            {showDropdown && debouncedResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Nearest Match Banner (Fuzzy Mode) */}
                {debouncedResults.isFuzzyMatch && debouncedResults.suggestedQuery && (
                  <div className="p-3 bg-indigo-950/70 border-b border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💡</span>
                      <span>No exact match for <strong className="text-white font-mono">"{debouncedResults.query}"</strong>. Showing closest ranked results:</span>
                    </div>
                    <button
                      onClick={() => {
                        const sug = debouncedResults.suggestedQuery || '';
                        onSearchChange(sug);
                        handleExecuteSearch(sug);
                      }}
                      className="text-xs font-bold text-white underline hover:text-indigo-200 cursor-pointer"
                    >
                      {debouncedResults.suggestedQuery}
                    </button>
                  </div>
                )}

                <div className="overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
                  {/* Stores Section */}
                  {debouncedResults.merchants.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block">
                        🏬 Matching Stores & Boutiques ({debouncedResults.merchants.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {debouncedResults.merchants.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleStoreClick(m.slugOrUrl.replace('/merchants/', ''))}
                            className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 flex items-center gap-2.5 cursor-pointer transition-all"
                          >
                            <img src={m.mediaUrl} alt={m.title} className="w-8 h-8 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                              <p className="text-[10px] font-mono text-indigo-400">{m.subtitle}</p>
                            </div>
                            <span className="text-[10px] text-slate-500">Visit ↗</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  {debouncedResults.products.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block">
                        🛍️ Matching Products & Discoveries ({debouncedResults.products.length})
                      </span>
                      <div className="space-y-1">
                        {debouncedResults.products.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleProductClick(p.title)}
                            className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between gap-3 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 shrink-0 relative">
                                {p.isVideo ? (
                                  <>
                                    <video src={p.mediaUrl} className="w-full h-full object-cover" muted />
                                    <span className="absolute bottom-0 right-0 bg-purple-600 text-white text-[8px] px-0.5 rounded">▶</span>
                                  </>
                                ) : (
                                  <img src={p.mediaUrl} alt={p.title} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                                <span className="text-[10px] text-slate-400">{p.subtitle}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-400 shrink-0">
                              {p.price?.toLocaleString()} EGP
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {debouncedResults.merchants.length === 0 && debouncedResults.products.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <p className="text-xl mb-1">🔍</p>
                      <p className="font-semibold text-white">No exact or closest matches</p>
                      <p className="text-[11px] text-slate-500 mt-1">Try searching for "linen", "leather", or "sari"</p>
                    </div>
                  )}
                </div>

                {/* Dedicated Search Results Page Link */}
                <div
                  onClick={() => handleExecuteSearch(searchQuery)}
                  className="p-2.5 bg-slate-950 hover:bg-indigo-950/70 border-t border-slate-800 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 group"
                >
                  <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                    🔍 View all matching results in dedicated search page
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono group-hover:bg-indigo-900 group-hover:text-white">
                    ↵ Enter
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portal Switching Bar for Admin & Merchants */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onSelectPortal('buyer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'buyer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛍️ Marketplace
              </button>
              <button
                onClick={() => onSelectPortal('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'admin' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Admin Center
              </button>
            </div>
          ) : isMerchant ? (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onSelectPortal('buyer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'buyer' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛍️ Shopper Feed
              </button>
              <button
                onClick={() => onSelectPortal('merchant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePortal === 'merchant' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏪 My Store Dashboard
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenMerchantModal}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30 transition-all cursor-pointer"
            >
              <span>+ Open Store</span>
            </button>
          )}

          {/* Buyer My Orders Trigger (Visible when authenticated) */}
          {currentUser && (
            <button
              onClick={onOpenBuyerOrders}
              title="My Orders & Tracking"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <span>📦</span>
              <span>My Orders</span>
            </button>
          )}

          {/* User Auth Pill / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <div
                onClick={onOpenAccountSettings}
                title="Account Settings & Security"
                className="flex items-center gap-2 cursor-pointer group hover:opacity-90 transition-opacity"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${
                  isAdmin 
                    ? 'bg-gradient-to-tr from-rose-500 to-red-600' 
                    : isMerchant 
                    ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                }`}>
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-white leading-tight truncate max-w-[90px] group-hover:text-indigo-300 transition-colors">
                    {currentUser.fullName}
                  </p>
                  <span className={`text-[10px] font-semibold ${
                    isAdmin ? 'text-rose-400' : isMerchant ? 'text-purple-400' : 'text-emerald-400'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {onOpenAccountSettings && (
                <button
                  type="button"
                  onClick={onOpenAccountSettings}
                  title="Account Settings & Security"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                >
                  ⚙️
                </button>
              )}

              <button
                onClick={onLogout}
                title="Log Out"
                className="text-slate-400 hover:text-red-400 text-xs font-bold ml-1 transition-colors cursor-pointer"
              >
                ⎋
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
            >
              <span>👤 Sign In</span>
            </button>
          )}

          {/* Become a Seller CTA (When not a merchant) */}
          {activePortal === 'buyer' && !isMerchant && !isAdmin && (
            <button
              onClick={onOpenMerchantModal}
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <span>+ Open Store</span>
            </button>
          )}

          {/* Cart Slide-Over Trigger */}
          <button
            onClick={onOpenCart}
            className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-md">
                {cartCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Secondary Category Subheader (Buyer View Only) */}
      {activePortal === 'buyer' && (
        <div className="border-t border-slate-800/80 bg-slate-950/70">
          {/* Mobile Search Bar */}
          <div className="md:hidden px-4 pt-2.5 pb-1">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products or stores..."
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-8 pr-16 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute right-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

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
      )}
    </header>
  );
};
