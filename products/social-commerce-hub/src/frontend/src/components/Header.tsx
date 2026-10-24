import React, { useState, useEffect, useRef } from 'react';
import { api, type UserDto, type SearchResponseDto } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { SearchIcon } from './icons/Icons';

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
  onOpenQuickTrack?: () => void;
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
  onOpenQuickTrack,
  onOpenAccountSettings,
  onSelectStore,
  onLogout
}) => {
  const { t, language, toggleLanguage, formatCurrency } = useTranslation();
  const { theme, toggleTheme } = useTheme();

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
      ? t.header.adminCenter 
      : activePortal === 'merchant' 
      ? t.header.sellerPortal 
      : t.header.marketplace;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/20 py-1.5 px-4 text-center text-xs font-medium text-indigo-300">
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span>{t.header.announcement}</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">{t.header.announcementSub}</span>
        </span>
      </div>

      {/* Main Desktop Navbar */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* Brand / Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:bg-indigo-500 transition-colors">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
                SocialHub
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${
                activePortal === 'admin'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : activePortal === 'merchant'
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {portalLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">{t.header.brandTagline}</p>
          </div>
        </div>

        {/* Global Smart Search Bar (Desktop Center - Visible in Buyer view) */}
        {activePortal === 'buyer' && (
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
            <div className="relative flex items-center">
              <span className="absolute start-4 text-slate-400">
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
                placeholder={t.header.searchPlaceholder}
                className="w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 ps-11 pe-28 py-2.5 rounded-2xl text-sm transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute end-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                title={t.header.enterKeyHint}
              >
                <span>{t.common.search}</span>
                <span className="text-[10px] opacity-75">{t.header.enterKeyHint}</span>
              </button>
            </div>

            {/* Debounced Search Results Live Dropdown */}
            {showDropdown && debouncedResults && (
              <div className="absolute top-full start-0 end-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[75vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                {/* Nearest Match Banner (Fuzzy Mode) */}
                {debouncedResults.isFuzzyMatch && debouncedResults.suggestedQuery && (
                  <div className="p-3 bg-indigo-950/40 border-b border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                      <span>{t.header.noExactMatch} <strong className="text-white font-mono">"{debouncedResults.query}"</strong>. {t.header.showingClosest}</span>
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
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                        {t.header.matchingStores} ({debouncedResults.merchants.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {debouncedResults.merchants.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleStoreClick(m.slugOrUrl.replace('/merchants/', ''))}
                            className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-indigo-500/40 flex items-center gap-2.5 cursor-pointer transition-all"
                          >
                            <img src={m.mediaUrl} alt={m.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                              <p className="text-[10px] font-mono text-indigo-400">{m.subtitle}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">{t.header.visitStore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products Section */}
                  {debouncedResults.products.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                        {t.header.matchingProducts} ({debouncedResults.products.length})
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
                                    <span className="absolute bottom-0 end-0 bg-indigo-600 text-white text-[8px] px-0.5 rounded">▶</span>
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
                              {formatCurrency(p.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {debouncedResults.merchants.length === 0 && debouncedResults.products.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <p className="font-semibold text-white">{t.header.noResults}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{t.header.trySearching}</p>
                    </div>
                  )}
                </div>

                {/* Dedicated Search Results Page Link */}
                <div
                  onClick={() => handleExecuteSearch(searchQuery)}
                  className="p-2.5 bg-slate-950 hover:bg-slate-900 border-t border-slate-800 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 group"
                >
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                    {t.header.viewAllSearchDropdown}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                    {t.header.enterKeyHint}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePortal === 'buyer' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.header.marketplace}
              </button>
              <button
                onClick={() => onSelectPortal('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePortal === 'admin' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.header.adminCenter}
              </button>
            </div>
          ) : isMerchant ? (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onSelectPortal('buyer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePortal === 'buyer' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.header.shopperFeed}
              </button>
              <button
                onClick={() => onSelectPortal('merchant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activePortal === 'merchant' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.header.myStoreDashboard}
              </button>
            </div>
          ) : null}

          {/* Buyer My Orders Trigger */}
          <button
            onClick={onOpenBuyerOrders}
            title={t.header.myOrders}
            className="flex items-center gap-1.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer min-h-[42px]"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="hidden sm:inline">{t.header.myOrders}</span>
          </button>

          {/* Quick Track Order Lookup Button */}
          {onOpenQuickTrack && (
            <button
              type="button"
              onClick={onOpenQuickTrack}
              title="Track order by ID and phone without signing in"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 min-h-[42px]"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">{t.checkout.quickTrackNavBtn}</span>
            </button>
          )}

          {/* Language Switcher Pill */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={language === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 min-h-[42px]"
          >
            <span className="text-xs font-mono uppercase text-indigo-400 font-bold">{language === 'en' ? 'AR' : 'EN'}</span>
            <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Theme Switcher Pill */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? t.header.switchToLight : t.header.switchToDark}
            aria-label={theme === 'dark' ? t.header.switchToLight : t.header.switchToDark}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 min-h-[42px]"
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="hidden sm:inline">{t.header.themeToggleLight}</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="hidden sm:inline">{t.header.themeToggleDark}</span>
              </>
            )}
          </button>

          {/* User Auth Pill / Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl min-h-[42px]">
              <div
                onClick={onOpenAccountSettings}
                title={t.header.accountSettingsTooltip}
                className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition-opacity"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md shrink-0 ${
                  isAdmin 
                    ? 'bg-gradient-to-tr from-rose-500 to-red-600' 
                    : isMerchant 
                    ? 'bg-gradient-to-tr from-purple-500 to-indigo-600'
                    : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                }`}>
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-start text-xs">
                  <p className="font-bold text-white text-sm leading-tight truncate max-w-[100px] group-hover:text-indigo-300 transition-colors">
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
                  title={t.header.accountSettingsTooltip}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                >
                  ⚙️
                </button>
              )}

              <button
                onClick={onLogout}
                title={t.header.logout}
                className="text-slate-400 hover:text-red-400 text-xs font-bold ms-1 transition-colors cursor-pointer"
              >
                ⎋
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 min-h-[42px]"
            >
              <span>{t.header.signIn}</span>
            </button>
          )}

          {/* Become a Seller CTA (When not a merchant) */}
          {activePortal === 'buyer' && !isMerchant && !isAdmin && (
            <button
              onClick={onOpenMerchantModal}
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 rounded-xl transition-all cursor-pointer shrink-0 min-h-[42px]"
            >
              <span>{t.header.openStore}</span>
            </button>
          )}

          {/* Cart Slide-Over Trigger */}
          <button
            onClick={onOpenCart}
            className="relative bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-sm min-h-[42px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden sm:inline">{t.header.cart}</span>
            {cartCount > 0 && (
              <span className="bg-amber-400 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
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
          <div className="md:hidden px-4 pt-3 pb-2">
            <div className="relative flex items-center">
              <span className="absolute start-3 text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.header.searchMobilePlaceholder}
                className="w-full bg-slate-900 border border-slate-800 text-sm text-white ps-9 pe-20 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute end-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                {t.common.search}
              </button>
            </div>
          </div>

          <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2.5 overflow-x-auto py-2.5 no-scrollbar text-sm">
            {[
              { id: 'all', label: t.categories.all },
              { id: 'fashion', label: t.categories.fashion },
              { id: 'leather', label: t.categories.leather },
              { id: 'home', label: t.categories.home },
              { id: 'accessories', label: t.categories.accessories }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
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
