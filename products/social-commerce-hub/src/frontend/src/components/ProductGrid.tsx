import React, { useState } from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onStoreClick: (storeSlug: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onQuickBuy,
  onAddToCart,
  onStoreClick
}) => {
  const [sortBy, setSortBy] = useState<string>('featured');

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <section className="flex-1 space-y-4">
      {/* Grid Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="text-xs text-slate-300">
          Showing <span className="font-bold text-white">{sortedProducts.length}</span> curated discoveries
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="text-xs text-slate-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="featured">✨ Featured & Trending</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Grid Cards Container */}
      {sortedProducts.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
          <div className="text-4xl">🔍</div>
          <h4 className="text-lg font-bold text-white">No items found matching your filters</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your category, price range, or minimum rating to explore more boutique products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickBuy={onQuickBuy}
              onAddToCart={onAddToCart}
              onStoreClick={onStoreClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};
