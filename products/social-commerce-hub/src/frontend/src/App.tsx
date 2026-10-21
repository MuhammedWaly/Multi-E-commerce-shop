import React, { useState, useEffect } from 'react';
import { Header, type PortalType } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { FeaturedStores } from './components/FeaturedStores';
import { SidebarFilters } from './components/SidebarFilters';
import { ProductGrid } from './components/ProductGrid';
import { StorefrontView } from './components/StorefrontView';
import { MerchantDashboard } from './components/MerchantDashboard';
import { AdminPortal } from './components/AdminPortal';
import { BuyerOrdersModal } from './components/BuyerOrdersModal';
import { ReviewsModal } from './components/ReviewsModal';
import { CartSlideOver } from './components/CartSlideOver';
import { CreateMerchantModal } from './components/CreateMerchantModal';
import { AuthModal } from './components/AuthModal';
import { AccountSettingsModal } from './components/AccountSettingsModal';
import { SearchExplorePage } from './components/SearchExplorePage';
import { Footer } from './components/Footer';
import { useTranslation } from './i18n/LanguageContext';
import { mockMerchants, mockProducts } from './data/mockData';
import { api, getStoredUser, type UserDto } from './services/api';
import type { Merchant, Product, CartItem } from './types';

export const App: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  
  // Navigation / Views / RBAC Portals
  const [activePortal, setActivePortal] = useState<PortalType>('buyer');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isSearchExploreActive, setIsSearchExploreActive] = useState<boolean>(false);
  const [searchPageQuery, setSearchPageQuery] = useState<string>('');

  // Cart, Modals & Auth State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState<boolean>(false);
  const [isBuyerOrdersOpen, setIsBuyerOrdersOpen] = useState<boolean>(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<UserDto | null>(() => getStoredUser());

  const handleAuthSuccess = (user: UserDto) => {
    setCurrentUser(user);
    if (user.role === 'Admin') {
      setActivePortal('admin');
      setSelectedMerchant(null);
    } else if (user.role === 'Merchant') {
      setActivePortal('merchant');
      setSelectedMerchant(null);
    } else {
      setActivePortal('buyer');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActivePortal('buyer');
  };

  // Sync with backend API
  useEffect(() => {
    api.getFeed(1, 50)
      .then((feed) => {
        if (feed && Array.isArray(feed) && feed.length > 0) {
          const apiProducts: Product[] = feed.map((item, idx) => ({
            id: item.id,
            merchantId: item.merchantId,
            storeName: item.storeName,
            storeSlug: item.storeSlug,
            title: item.title,
            price: item.price,
            originalPrice: item.price > 500 ? Math.round(item.price * 1.2) : undefined,
            mediaUrl: item.mediaUrl,
            category: (item.title.toLowerCase().includes('bag') || item.title.toLowerCase().includes('cardholder') || item.title.toLowerCase().includes('leather')) ? 'leather' : 'fashion',
            rating: item.rating || 4.9,
            reviewCount: 25 + idx * 7,
            stockQuantity: item.stockQuantity,
            isVideo: item.isVideo,
            isFeatured: idx < 2
          }));
          setProducts(apiProducts);

          // Sync merchants with real database GUIDs
          setMerchants((prev) =>
            prev.map((m) => {
              const match = feed.find((f) => f.storeSlug === m.slug);
              return match ? { ...m, id: match.merchantId } : m;
            })
          );
        }
      })
      .catch((err) => {
        console.warn('Backend feed unavailable, using local mock cache:', err);
      });
  }, []);

  // Filter Pipeline
  const filteredProducts = products.filter((product) => {
    if (activeCategory !== 'all' && product.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = product.title.toLowerCase().includes(q);
      const matchStore = product.storeName.toLowerCase().includes(q);
      if (!matchTitle && !matchStore) return false;
    }
    if (priceFilter === 'under500' && product.price >= 500) return false;
    if (priceFilter === '500to1000' && (product.price < 500 || product.price > 1000)) return false;
    if (priceFilter === 'over1000' && product.price <= 1000) return false;
    if (minRating > 0 && product.rating < minRating) return false;
    if (inStockOnly && product.stockQuantity <= 0) return false;

    return true;
  });

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleQuickBuy = (product: Product) => {
    setCartItems([{ product, quantity: 1 }]);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleStoreClick = (slug: string) => {
    const merchant = merchants.find((m) => m.slug === slug);
    if (merchant) {
      setSelectedMerchant(merchant);
      setIsSearchExploreActive(false);
      setActivePortal('buyer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExecuteSearch = (q: string) => {
    setSearchPageQuery(q);
    setIsSearchExploreActive(true);
    setSelectedMerchant(null);
    setActivePortal('buyer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSeeAll = () => {
    setSearchPageQuery('');
    setIsSearchExploreActive(true);
    setSelectedMerchant(null);
    setActivePortal('buyer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setIsSearchExploreActive(false);
    setSelectedMerchant(null);
    setActivePortal('buyer');
    setSearchQuery('');
    setSearchPageQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setPriceFilter('all');
    setMinRating(0);
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Desktop Header */}
      <Header
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setSelectedMerchant(null);
          setIsSearchExploreActive(false);
          setActivePortal('buyer');
          setActiveCategory(cat);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onExecuteSearch={handleExecuteSearch}
        onNavigateHome={handleNavigateHome}
        onOpenMerchantModal={() => setIsMerchantModalOpen(true)}
        activePortal={activePortal}
        onSelectPortal={(portal) => {
          setActivePortal(portal);
          setSelectedMerchant(null);
          setIsSearchExploreActive(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenBuyerOrders={() => setIsBuyerOrdersOpen(true)}
        onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
        onSelectStore={(slug) => handleStoreClick(slug)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePortal === 'admin' ? (
          /* Platform Administration Command Center */
          <AdminPortal
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            products={products}
            onProductDeleted={(id) => {
              setProducts((prev) => prev.filter((p) => p.id !== id));
            }}
            onMerchantDeleted={(id) => {
              setMerchants((prev) => prev.filter((m) => m.id !== id));
              setProducts((prev) => prev.filter((p) => p.merchantId !== id));
            }}
          />
        ) : activePortal === 'merchant' ? (
          /* Merchant Store Management Portal */
          <MerchantDashboard
            merchants={merchants}
            products={products}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onAddProduct={(newProduct) => {
              setProducts((prev) => [newProduct, ...prev]);
            }}
            onUpdateProduct={(updatedProduct) => {
              setProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
            }}
            onDeleteProduct={(productId) => {
              setProducts((prev) => prev.filter((p) => p.id !== productId));
            }}
            onViewPublicStore={(merchant) => {
              setActivePortal('buyer');
              setSelectedMerchant(merchant);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : selectedMerchant ? (
          /* Dedicated Independent Merchant Storefront View */
          <StorefrontView
            merchant={selectedMerchant}
            products={products}
            onBackToMarketplace={() => setSelectedMerchant(null)}
            onQuickBuy={handleQuickBuy}
            onAddToCart={handleAddToCart}
            onOpenReviews={(prod) => setReviewProduct(prod)}
          />
        ) : isSearchExploreActive ? (
          /* Dedicated Search & Explore Catalog Page with Multi-Filters & Pagination */
          <SearchExplorePage
            initialQuery={searchPageQuery}
            allProducts={products}
            merchants={merchants}
            onQuickBuy={handleQuickBuy}
            onAddToCart={handleAddToCart}
            onStoreClick={(slug) => handleStoreClick(slug)}
            onOpenReviews={(prod) => setReviewProduct(prod)}
            onBackToHome={handleNavigateHome}
          />
        ) : (
          /* Multi-Merchant Marketplace Homepage View */
          <>
            {/* Hero Marketplace Showcase Banner */}
            <HeroBanner
              onExploreClick={() => {
                const el = document.getElementById('marketplace-catalog');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onStoresClick={() => {
                const el = document.getElementById('featured-stores');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onSeeAllClick={handleOpenSeeAll}
            />

            {/* Featured Merchants Section */}
            <div id="featured-stores">
              <FeaturedStores
                merchants={merchants}
                onSelectMerchant={(merchant) => {
                  setSelectedMerchant(merchant);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>

            {/* Split Screen Desktop Catalog Area (Filters Sidebar + Expansive Product Grid) */}
            <div id="marketplace-catalog" className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {t.catalog.badge}
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {t.catalog.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-400">
                    <span className="font-bold text-white me-1">{formatNumber(filteredProducts.length)}</span>
                    {t.catalog.itemCountText}
                  </p>
                  <button
                    onClick={handleOpenSeeAll}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <span>{t.catalog.seeAllPaginate}</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Desktop Left Sidebar Filters */}
                <SidebarFilters
                  activeCategory={activeCategory}
                  onSelectCategory={setActiveCategory}
                  priceFilter={priceFilter}
                  onPriceFilterChange={setPriceFilter}
                  minRating={minRating}
                  onMinRatingChange={setMinRating}
                  inStockOnly={inStockOnly}
                  onInStockToggle={() => setInStockOnly(!inStockOnly)}
                  onResetFilters={handleResetFilters}
                />

                {/* Main 3-4 Column Product Grid */}
                <ProductGrid
                  products={filteredProducts}
                  onQuickBuy={handleQuickBuy}
                  onAddToCart={handleAddToCart}
                  onStoreClick={handleStoreClick}
                  onOpenReviews={(prod) => setReviewProduct(prod)}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Cart & Express Checkout Slide-Over */}
      <CartSlideOver
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
      />

      {/* Buyer Orders History Modal */}
      <BuyerOrdersModal
        isOpen={isBuyerOrdersOpen}
        onClose={() => setIsBuyerOrdersOpen(false)}
        onOpenReviewModal={(prod) => setReviewProduct(prod)}
        allProducts={products}
      />

      {/* Merchant Registration Onboarding Modal */}
      <CreateMerchantModal
        isOpen={isMerchantModalOpen}
        onClose={() => setIsMerchantModalOpen(false)}
        onMerchantCreated={(newMerchant) => {
          setMerchants((prev) => [
            {
              id: newMerchant.id || 'm' + Date.now(),
              name: newMerchant.storeName,
              slug: newMerchant.slug,
              tagline: 'New Independent Boutique',
              bio: `Welcome to ${newMerchant.storeName} on SocialHub.`,
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600',
              rating: 5.0,
              reviewsCount: 1,
              verified: true,
              location: 'Cairo, Egypt',
              productCount: 0
            },
            ...prev
          ]);
        }}
      />

      {/* Verified Product Reviews Modal */}
      <ReviewsModal
        product={reviewProduct}
        isOpen={!!reviewProduct}
        onClose={() => setReviewProduct(null)}
        onReviewAdded={(prodId, newRating) => {
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === prodId) {
                const total = p.rating * p.reviewCount + newRating;
                const newCount = p.reviewCount + 1;
                return {
                  ...p,
                  reviewCount: newCount,
                  rating: Math.round((total / newCount) * 10) / 10
                };
              }
              return p;
            })
          );
        }}
      />

      {/* Modern Authentication Modal (JWT & Role Based) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Account Settings & Password Security Modal */}
      <AccountSettingsModal
        isOpen={isAccountSettingsOpen}
        onClose={() => setIsAccountSettingsOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />

      {/* Full Web Mega Footer */}
      <Footer />
    </div>
  );
};

export default App;
