import React from 'react';

interface SidebarFiltersProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  priceFilter: string;
  onPriceFilterChange: (filter: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  inStockOnly: boolean;
  onInStockToggle: () => void;
  onResetFilters: () => void;
}

export const SidebarFilters: React.FC<SidebarFiltersProps> = ({
  activeCategory,
  onSelectCategory,
  priceFilter,
  onPriceFilterChange,
  minRating,
  onMinRatingChange,
  inStockOnly,
  onInStockToggle,
  onResetFilters
}) => {
  return (
    <aside className="w-full lg:w-64 shrink-0 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-6 self-start shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
          <span>⚙️</span> Filters
        </h3>
        <button
          onClick={onResetFilters}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Category
        </label>
        <div className="space-y-1">
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'fashion', label: 'Linen & Fashion' },
            { id: 'leather', label: 'Handmade Leather' },
            { id: 'home', label: 'Ceramics & Decor' },
            { id: 'accessories', label: 'Accessories' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex justify-between items-center cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{cat.label}</span>
              {activeCategory === cat.id && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2.5 border-t border-slate-800 pt-4">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Price Range (EGP)
        </label>
        <div className="space-y-1.5 text-xs text-slate-300">
          {[
            { id: 'all', label: 'Any Price' },
            { id: 'under500', label: 'Under 500 EGP' },
            { id: '500to1000', label: '500 to 1,000 EGP' },
            { id: 'over1000', label: '1,000+ EGP' }
          ].map((range) => (
            <label
              key={range.id}
              className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-slate-800/40 cursor-pointer"
            >
              <input
                type="radio"
                name="priceRange"
                checked={priceFilter === range.id}
                onChange={() => onPriceFilterChange(range.id)}
                className="accent-indigo-500"
              />
              <span className={priceFilter === range.id ? 'text-white font-semibold' : 'text-slate-400'}>
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-2.5 border-t border-slate-800 pt-4">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Minimum Rating
        </label>
        <div className="flex gap-1.5">
          {[0, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => onMinRatingChange(rating)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                minRating === rating
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {rating === 0 ? 'Any' : `${rating}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="border-t border-slate-800 pt-4">
        <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
          <span className="font-medium">In-Stock Only</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onInStockToggle}
            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Trust Badge Card */}
      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="font-bold text-indigo-300">🛡️ SocialHub Guarantee</p>
        <p>All independent orders are covered by platform buyer protection and verified PayPal checkout.</p>
      </div>
    </aside>
  );
};
