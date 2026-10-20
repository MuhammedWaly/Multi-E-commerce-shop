import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Merchant } from '../types';
import { ProductCard } from './ProductCard';

interface SearchExplorePageProps {
  initialQuery?: string;
  allProducts: Product[];
  merchants: Merchant[];
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onStoreClick: (storeSlug: string) => void;
  onOpenReviews?: (product: Product) => void;
  onBackToHome: () => void;
}

export const SearchExplorePage: React.FC<SearchExplorePageProps> = ({
  initialQuery = '',
  allProducts,
  merchants,
  onQuickBuy,
  onAddToCart,
  onStoreClick,
  onOpenReviews,
  onBackToHome
}) => {
  // Search & Filter State
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all' | 'under500' | '500to1000' | 'over1000' | 'custom'
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [mediaType, setMediaType] = useState<'all' | 'video' | 'image'>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedMerchantSlug, setSelectedMerchantSlug] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  // Sync when initialQuery changes from header
  useEffect(() => {
    setQuery(initialQuery);
    setCurrentPage(1);
  }, [initialQuery]);

  // Reset all filters to factory state
  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setPriceRange('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setMediaType('all');
    setInStockOnly(false);
    setMinRating(0);
    setSelectedMerchantSlug('all');
    setSortBy('relevance');
    setCurrentPage(1);
  };

  // Matching Merchants for the current query
  const matchingMerchants = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return merchants.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.tagline.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q)
    );
  }, [query, merchants]);

  // Multi-Filter & Fuzzy Pipeline
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allProducts.filter((product) => {
      // 1. Text Search (Title, Store, Category)
      if (q) {
        const titleMatch = product.title.toLowerCase().includes(q);
        const storeMatch = product.storeName.toLowerCase().includes(q);
        const catMatch = product.category.toLowerCase().includes(q);
        if (!titleMatch && !storeMatch && !catMatch) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }

      // 3. Merchant / Store filter
      if (selectedMerchantSlug !== 'all' && product.storeSlug !== selectedMerchantSlug) {
        return false;
      }

      // 4. Price Filter
      if (priceRange === 'under500' && product.price >= 500) return false;
      if (priceRange === '500to1000' && (product.price < 500 || product.price > 1000)) return false;
      if (priceRange === 'over1000' && product.price <= 1000) return false;
      if (priceRange === 'custom') {
        const min = customMinPrice ? parseFloat(customMinPrice) : 0;
        const max = customMaxPrice ? parseFloat(customMaxPrice) : Infinity;
        if (product.price < min || product.price > max) return false;
      }

      // 5. Media format (Video vs Image)
      const isVid = !!product.isVideo || /\.(mp4|webm|mov)(\?.*)?$/i.test(product.mediaUrl);
      if (mediaType === 'video' && !isVid) return false;
      if (mediaType === 'image' && isVid) return false;

      // 6. Availability & Rating
      if (inStockOnly && product.stockQuantity <= 0) return false;
      if (minRating > 0 && product.rating < minRating) return false;

      return true;
    });
  }, [
    query,
    selectedCategory,
    selectedMerchantSlug,
    priceRange,
    customMinPrice,
    customMaxPrice,
    mediaType,
    inStockOnly,
    minRating,
    allProducts
  ]);

  // Sorting
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'newest') return (b.id || '').localeCompare(a.id || '');
      // Relevance / Featured
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const aExact = a.title.toLowerCase().startsWith(q) ? 2 : a.title.toLowerCase().includes(q) ? 1 : 0;
        const bExact = b.title.toLowerCase().startsWith(q) ? 2 : b.title.toLowerCase().includes(q) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
      }
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }, [filteredProducts, sortBy, query]);

  // Pagination Calculations
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return sortedProducts.slice(startIndex, startIndex + pageSize);
  }, [sortedProducts, validCurrentPage, pageSize]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const isFiltered =
    query.trim() !== '' ||
    selectedCategory !== 'all' ||
    priceRange !== 'all' ||
    customMinPrice !== '' ||
    customMaxPrice !== '' ||
    mediaType !== 'all' ||
    inStockOnly ||
    minRating > 0 ||
    selectedMerchantSlug !== 'all';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <nav className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="hover:text-slate-200 cursor-pointer" onClick={onBackToHome}>Home</span>
            <span>/</span>
            <span className="text-indigo-400 font-semibold">Search & Catalog</span>
          </nav>
        </div>

        {/* Global Reset Button */}
        {isFiltered && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <span>🔄</span>
            <span>Reset All Filters & View All Products</span>
          </button>
        )}
      </div>

      {/* Main Search Banner in Results Page */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 rounded-full inline-block">
            Comprehensive Marketplace Search
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explore All Boutique Discoveries & Stores
          </h1>

          {/* Search Input Box */}
          <div className="relative flex items-center max-w-2xl">
            <span className="absolute left-4 text-slate-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search products, materials (linen, leather), boutiques, or categories..."
              className="w-full bg-slate-950/90 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-100 pl-11 pr-24 py-3 rounded-2xl text-sm transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Clear ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Matching Stores Section (if applicable) */}
      {matchingMerchants.length > 0 && (
        <div className="bg-slate-900/60 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🏬</span>
              <span>Matching Boutiques & Stores ({matchingMerchants.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Click to visit storefront</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingMerchants.map((m) => (
              <div
                key={m.id}
                onClick={() => onStoreClick(m.slug)}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 flex items-center gap-3 cursor-pointer group transition-all"
              >
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-800 group-hover:border-indigo-500 transition-colors"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {m.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">{m.tagline}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-amber-400 font-bold">★ {m.rating}</span>
                    <span className="text-[10px] text-slate-500">• {m.location}</span>
                  </div>
                </div>
                <span className="text-xs text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform">
                  ↗
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Results Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Filter Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-6 shrink-0 shadow-lg sticky top-24">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⚡</span>
              <span>Filter Results</span>
            </h3>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Category
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: '🔥 All Categories' },
                { id: 'fashion', label: '👗 Fashion & Apparel' },
                { id: 'leather', label: '👜 Handcrafted Leather' },
                { id: 'home', label: '🏺 Ceramics & Home' },
                { id: 'accessories', label: '✨ Accessories' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <span>{cat.label}</span>
                  {selectedCategory === cat.id && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Price Range
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'All Prices' },
                { id: 'under500', label: 'Under 500 EGP' },
                { id: '500to1000', label: '500 - 1,000 EGP' },
                { id: 'over1000', label: 'Over 1,000 EGP' },
                { id: 'custom', label: 'Custom Price Range' }
              ].map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priceFilter"
                    checked={priceRange === p.id}
                    onChange={() => {
                      setPriceRange(p.id);
                      setCurrentPage(1);
                    }}
                    className="accent-indigo-600 rounded text-indigo-600 focus:ring-0"
                  />
                  <span>{p.label}</span>
                </label>
              ))}

              {priceRange === 'custom' && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={customMinPrice}
                    onChange={(e) => {
                      setCustomMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={customMaxPrice}
                    onChange={(e) => {
                      setCustomMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-1/2 bg-slate-950 border border-slate-800 text-xs text-white p-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Media Format Filter (Videos vs Images) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Media Format
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'video', label: '🎬 Reels' },
                { id: 'image', label: '📷 Photos' }
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setMediaType(fmt.id as any);
                    setCurrentPage(1);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    mediaType === fmt.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Boutique Store Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Boutique
            </label>
            <select
              value={selectedMerchantSlug}
              onChange={(e) => {
                setSelectedMerchantSlug(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">🏬 All Boutiques & Stores</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.slug}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock & Rating Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="accent-indigo-600 w-4 h-4 rounded"
              />
              <span>In Stock Only</span>
            </label>

            <div className="space-y-1.5">
              <span className="text-xs text-slate-400 block">Minimum Rating</span>
              <div className="flex items-center gap-1.5">
                {[0, 4.0, 4.5, 4.8].map((rat) => (
                  <button
                    key={rat}
                    onClick={() => {
                      setMinRating(rat);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      minRating === rat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {rat === 0 ? 'All' : `${rat}★`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Product Grid & Pagination */}
        <section className="flex-1 w-full space-y-6">
          {/* Toolbar (Result count, Sort by, Page Size) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="text-xs text-slate-300">
              Showing <span className="font-bold text-white">{totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1} - {Math.min(validCurrentPage * pageSize, totalItems)}</span> of{' '}
              <span className="font-bold text-indigo-400">{totalItems}</span> matching products
              {query && (
                <span className="ml-2 text-slate-400">
                  for "<strong className="text-white">{query}</strong>"
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="relevance">✨ Best Match / Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Customer Rating</option>
                  <option value="newest">Newest Additions</option>
                </select>
              </div>

              {/* Page Size */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 py-1.5 px-2 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
                title="Items per page"
              >
                <option value={6}>6 / page</option>
                <option value={9}>9 / page</option>
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
              </select>
            </div>
          </div>

          {/* Product Grid Cards */}
          {paginatedProducts.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-4">
              <div className="text-5xl">🔍</div>
              <h4 className="text-xl font-bold text-white">No products found matching your search</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No items matched your current search filters. You can clear your search or reset all filters to view all available products.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                🔄 Show All Products & Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickBuy={onQuickBuy}
                  onAddToCart={onAddToCart}
                  onStoreClick={onStoreClick}
                  onOpenReviews={onOpenReviews}
                />
              ))}
            </div>
          )}

          {/* Interactive Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Page <span className="font-bold text-white">{validCurrentPage}</span> of{' '}
                <span className="font-bold text-white">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={validCurrentPage <= 1}
                  onClick={() => handlePageChange(validCurrentPage - 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                  // Keep pagination clean if many pages
                  if (
                    pg === 1 ||
                    pg === totalPages ||
                    (pg >= validCurrentPage - 1 && pg <= validCurrentPage + 1)
                  ) {
                    return (
                      <button
                        key={pg}
                        onClick={() => handlePageChange(pg)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          validCurrentPage === pg
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  }
                  if (pg === validCurrentPage - 2 || pg === validCurrentPage + 2) {
                    return (
                      <span key={pg} className="px-1 text-slate-600 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => handlePageChange(validCurrentPage + 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
