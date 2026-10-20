import React from 'react';
import type { UserDto } from '../services/api';

export type PortalType = 'buyer' | 'merchant' | 'admin';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateHome: () => void;
  onOpenMerchantModal: () => void;
  activePortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  currentUser: UserDto | null;
  onOpenAuthModal: () => void;
  onOpenBuyerOrders: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onSelectCategory,
  activeCategory,
  searchQuery,
  onSearchChange,
  onNavigateHome,
  onOpenMerchantModal,
  activePortal,
  onSelectPortal,
  currentUser,
  onOpenAuthModal,
  onOpenBuyerOrders,
  onLogout
}) => {
  const isAdmin = currentUser?.role === 'Admin';
  const isMerchant = currentUser?.role === 'Merchant';

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
          <div className="flex-1 max-w-xl relative hidden md:block">
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
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
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
                <p className="font-bold text-white leading-tight truncate max-w-[90px]">{currentUser.fullName}</p>
                <span className={`text-[10px] font-semibold ${
                  isAdmin ? 'text-rose-400' : isMerchant ? 'text-purple-400' : 'text-emerald-400'
                }`}>
                  {currentUser.role}
                </span>
              </div>
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
