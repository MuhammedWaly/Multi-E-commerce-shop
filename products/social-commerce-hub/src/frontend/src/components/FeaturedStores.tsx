import React from 'react';
import type { Merchant } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface FeaturedStoresProps {
  merchants: Merchant[];
  onSelectMerchant: (merchant: Merchant) => void;
}

export const FeaturedStores: React.FC<FeaturedStoresProps> = ({ merchants, onSelectMerchant }) => {
  const { t, formatNumber } = useTranslation();

  return (
    <section className="my-10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
            {t.featuredStores.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t.featuredStores.title}
          </h2>
        </div>
        <p className="text-sm text-slate-400 font-medium">{t.featuredStores.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            className="group bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Store Cover Banner */}
            <div className="relative h-36 bg-slate-800 overflow-hidden">
              <img
                src={merchant.bannerUrl}
                alt={merchant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            </div>

            {/* Store Profile & Info */}
            <div className="px-6 pb-6 pt-0 relative flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-end -mt-12 mb-3.5">
                  <img
                    src={merchant.avatarUrl}
                    alt={merchant.name}
                    className="w-20 h-20 rounded-2xl border-4 border-slate-900 object-cover shadow-xl"
                  />
                  <span className="text-xs font-medium bg-slate-900/90 text-slate-300 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{merchant.location}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-indigo-300 transition-colors">
                    {merchant.name}
                  </h3>
                  {merchant.verified && (
                    <span className="text-xs text-blue-400 font-bold" title={t.common.verified}>✓</span>
                  )}
                </div>

                <p className="text-sm text-slate-300 font-semibold line-clamp-1 mb-2">
                  {merchant.tagline}
                </p>

                <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                  {merchant.bio}
                </p>
              </div>

              {/* Bottom Meta & Action */}
              <div className="pt-4 mt-5 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-amber-300">★ {merchant.rating}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-medium">{formatNumber(merchant.productCount)} {t.common.items}</span>
                </div>

                <button
                  onClick={() => onSelectMerchant(merchant)}
                  className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-sm px-4 py-2 rounded-xl border border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                >
                  <span>{t.featuredStores.exploreStore}</span>
                  <span className="text-xs">↗</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
