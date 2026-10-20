import React from 'react';
import type { Merchant } from '../types';

interface FeaturedStoresProps {
  merchants: Merchant[];
  onSelectMerchant: (merchant: Merchant) => void;
}

export const FeaturedStores: React.FC<FeaturedStoresProps> = ({ merchants, onSelectMerchant }) => {
  return (
    <section className="my-10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Independent Creators</span>
          <h2 className="text-2xl font-black text-white tracking-tight">Featured Merchant Storefronts</h2>
        </div>
        <p className="text-xs text-slate-400">Discover dedicated stores and their signature collections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            className="group bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Store Cover Banner */}
            <div className="relative h-28 bg-slate-800 overflow-hidden">
              <img
                src={merchant.bannerUrl}
                alt={merchant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>

            {/* Store Profile & Info */}
            <div className="px-5 pb-5 pt-0 relative flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-end -mt-10 mb-3">
                  <img
                    src={merchant.avatarUrl}
                    alt={merchant.name}
                    className="w-16 h-16 rounded-2xl border-4 border-slate-900 object-cover shadow-lg"
                  />
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span>📍</span> {merchant.location}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors">
                    {merchant.name}
                  </h3>
                  {merchant.verified && (
                    <span className="text-xs text-blue-400" title="Verified Store">✓</span>
                  )}
                </div>

                <p className="text-xs text-slate-400 font-medium line-clamp-1 mb-2">
                  {merchant.tagline}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {merchant.bio}
                </p>
              </div>

              {/* Bottom Meta & Action */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-amber-300">★ {merchant.rating}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{merchant.productCount} items</span>
                </div>

                <button
                  onClick={() => onSelectMerchant(merchant)}
                  className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl border border-indigo-500/30 transition-all cursor-pointer"
                >
                  Visit Store →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
