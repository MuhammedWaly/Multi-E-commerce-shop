import React from 'react';
import type { Merchant, Product } from '../types';
import { ProductCard } from './ProductCard';
import { useTranslation } from '../i18n/LanguageContext';

interface StorefrontViewProps {
  merchant: Merchant;
  products: Product[];
  onBackToMarketplace: () => void;
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenReviews?: (product: Product) => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  merchant,
  products,
  onBackToMarketplace,
  onQuickBuy,
  onAddToCart,
  onOpenReviews
}) => {
  const { t, formatNumber, isRTL } = useTranslation();
  const merchantProducts = products.filter(p => p.merchantId === merchant.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMarketplace}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[42px]"
        >
          <span>{isRTL ? '→' : '←'}</span> {t.storefront.backToMarketplace}
        </button>

        <div className="text-sm text-slate-400">
          {t.storefront.independentMaker}: <span className="text-white font-mono font-medium" dir="ltr">socialhub.eg/store/{merchant.slug}</span>
        </div>
      </div>

      {/* Massive Panoramic Store Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
        <div className="h-64 sm:h-96 w-full relative overflow-hidden">
          <img
            src={merchant.bannerUrl}
            alt={merchant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Store Profile Floating Header */}
        <div className="relative px-6 sm:px-10 pb-8 -mt-24 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-start">
            <img
              src={merchant.avatarUrl}
              alt={merchant.name}
              className="w-32 h-32 rounded-3xl border-4 border-slate-950 object-cover shadow-2xl"
            />
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-3xl sm:text-4xl font-black text-white">{merchant.name}</h1>
                {merchant.verified && (
                  <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
                    ✓ {t.storefront.verifiedBadge}
                  </span>
                )}
              </div>
              <p className="text-base font-semibold text-indigo-300">{merchant.tagline}</p>
              <div className="flex items-center justify-center sm:justify-start gap-3.5 text-sm text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{merchant.location}</span>
                </span>
                <span>•</span>
                <span className="text-amber-400 font-bold">★ {formatNumber(merchant.rating)} ({formatNumber(merchant.reviewsCount)} {t.storefront.reviewsCount})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Store Bio Narrative */}
        <div className="px-6 sm:px-10 pb-6 border-t border-slate-800/80 pt-5 bg-slate-950/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">{t.storefront.verifiedBoutique}</h4>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-5xl">
            {merchant.bio}
          </p>
        </div>
      </div>

      {/* Merchant Products Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <h3 className="text-2xl font-black text-white">
            {t.storefront.storeProductsTitle} ({formatNumber(merchantProducts.length)})
          </h3>
          <span className="text-sm text-slate-400 font-medium">{t.hero.deliveryMetric} {t.hero.deliveryLabel}</span>
        </div>

        {merchantProducts.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-base">
            {t.storefront.noStoreProducts}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-7">
            {merchantProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickBuy={onQuickBuy}
                onAddToCart={onAddToCart}
                onStoreClick={() => {}}
                onOpenReviews={onOpenReviews}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
