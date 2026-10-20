import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { FeaturedStores } from './components/FeaturedStores';
import { SidebarFilters } from './components/SidebarFilters';
import { ProductGrid } from './components/ProductGrid';
import { StorefrontView } from './components/StorefrontView';
import { CartSlideOver } from './components/CartSlideOver';
import { CreateMerchantModal } from './components/CreateMerchantModal';
import { Footer } from './components/Footer';
import { mockMerchants, mockProducts } from './data/mockData';
import type { Merchant, Product, CartItem } from './types';

export const App: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>(mockMerchants);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  
  // Navigation / views
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  // Cart & Modals
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);

  // Sync with backend API
  useEffect(() => {
    fetch('http://localhost:5000/api/feed')
      .then((res) => (res.ok ? res.json() : null))
      .then((feed) => {
        if (feed && Array.isArray(feed) && feed.length > 0) {
          // Map backend feed items to frontend product shape
          const apiProducts: Product[] = feed.map((item: any, idx: number) => ({
            id: item.id,
            merchantId: item.merchantId,
            storeName: item.storeName,
            storeSlug: item.storeSlug,
            title: item.title,
            price: item.price,
            originalPrice: item.price > 500 ? Math.round(item.price * 1.2) : undefined,
            mediaUrl: item.mediaUrl,
            category: idx % 2 === 0 ? 'fashion' : 'leather',
            rating: item.rating || 4.9,
            reviewCount: 25 + idx * 7,
            stockQuantity: item.stockQuantity,
            isFeatured: idx < 2
          }));
          setProducts(apiProducts);
        }
      })
      .catch(() => {
        // Mock fallback active
      });
  }, []);

  // Filter Pipeline
  const filteredProducts = products.filter((product) => {
    // 1. Category
    if (activeCategory !== 'all' && product.category !== activeCategory) {
      return false;
    }
    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = product.title.toLowerCase().includes(q);
      const matchStore = product.storeName.toLowerCase().includes(q);
      if (!matchTitle && !matchStore) return false;
    }
    // 3. Price Filter
    if (priceFilter === 'under500' && product.price >= 500) return false;
    if (priceFilter === '500to1000' && (product.price < 500 || product.price > 1000)) return false;
    if (priceFilter === 'over1000' && product.price <= 1000) return false;

    // 4. Rating
    if (minRating > 0 && product.rating < minRating) return false;

    // 5. In Stock
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
          setActiveCategory(cat);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateHome={() => setSelectedMerchant(null)}
        onOpenMerchantModal={() => setIsMerchantModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedMerchant ? (
          /* Dedicated Independent Merchant Storefront View */
          <StorefrontView
            merchant={selectedMerchant}
            products={products}
            onBackToMarketplace={() => setSelectedMerchant(null)}
            onQuickBuy={handleQuickBuy}
            onAddToCart={handleAddToCart}
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Curated Catalog
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Explore All Discoveries
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  {filteredProducts.length} items from Egyptian boutiques & makers
                </p>
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

      {/* Full Web Mega Footer */}
      <Footer />
    </div>
  );
};

export default App;
