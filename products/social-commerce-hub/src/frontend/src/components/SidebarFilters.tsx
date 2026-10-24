import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { ShieldIcon } from './icons/Icons';

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
  const { t } = useTranslation();

  return (
    <aside className="w-full lg:w-72 xl:w-80 shrink-0 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 self-start shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <h3 className="font-bold text-base text-white">
          {t.filters.title}
        </h3>
        <button
          onClick={onResetFilters}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
        >
          {t.common.reset}
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          {t.filters.category}
        </label>
        <div className="space-y-1.5">
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
              className={`w-full text-start px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-between items-center cursor-pointer min-h-[40px] ${
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
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          {t.filters.priceRange}
        </label>
        <div className="space-y-2 text-sm text-slate-300">
          {[
            { id: 'all', label: t.filters.allPrices },
            { id: 'under500', label: t.filters.under500 },
            { id: '500to1000', label: t.filters.from500to1000 },
            { id: 'over1000', label: t.filters.over1000 }
          ].map((range) => (
            <label
              key={range.id}
              className="flex items-center gap-3 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/40 cursor-pointer"
            >
              <input
                type="radio"
                name="priceRange"
                checked={priceFilter === range.id}
                onChange={() => onPriceFilterChange(range.id)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <span className={priceFilter === range.id ? 'text-white font-semibold' : 'text-slate-400'}>
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Minimum Rating Filter */}
      <div className="space-y-3 border-t border-slate-800 pt-4">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          {t.filters.minRating}
        </label>
        <div className="flex gap-2">
          {[0, 4.5, 4.8].map((rating) => (
            <button
              key={rating}
              onClick={() => onMinRatingChange(rating)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer min-h-[40px] ${
                minRating === rating
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {rating === 0 ? t.filters.allRatings : `${rating}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Availability Toggle */}
      <div className="border-t border-slate-800 pt-4">
        <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer py-1">
          <span className="font-medium">{t.filters.inStockOnly}</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onInStockToggle}
            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Trust Badge Card */}
      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
        <p className="font-bold text-indigo-300 flex items-center gap-1.5">
          <ShieldIcon className="w-4 h-4 text-indigo-400" />
          <span>{t.header.announcementSub}</span>
        </p>
        <p>{t.cart.secureNotice}</p>
      </div>
    </aside>
  );
};
