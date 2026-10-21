import React from 'react';
import type { Product } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface ProductCardProps {
  product: Product;
  onQuickBuy: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onStoreClick: (storeSlug: string) => void;
  onOpenReviews?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickBuy,
  onAddToCart,
  onStoreClick,
  onOpenReviews
}) => {
  const { t, formatCurrency, formatNumber } = useTranslation();

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const isVideo = product.isVideo || /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(product.mediaUrl);

  return (
    <article className="group bg-slate-900/90 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between">
      {/* Product Image / Video Canvas */}
      <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
        {isVideo ? (
          <div className="w-full h-full relative">
            <video
              src={product.mediaUrl}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              autoPlay
              muted
              loop
              playsInline
            />
            <span className="absolute top-3 end-16 bg-purple-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <span>▶</span>
              <span>{t.product.videoBadge}</span>
            </span>
          </div>
        ) : (
          <img
            src={product.mediaUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-indigo-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              {t.product.featuredBadge}
            </span>
          )}
        </div>

        {/* Star Rating Badge (Clickable to open Verified Reviews) */}
        <button
          onClick={() => onOpenReviews?.(product)}
          className="absolute top-3 end-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-amber-300 shadow border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-all hover:scale-105"
          title={t.product.ratingLabel}
        >
          <span>★</span>
          <span>{formatNumber(product.rating)}</span>
          <span className="text-[10px] text-slate-400">({formatNumber(product.reviewCount)})</span>
        </button>

        {/* Merchant Tag */}
        <button
          onClick={() => onStoreClick(product.storeSlug)}
          className="absolute bottom-3 start-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>🏬</span>
          <span>@{product.storeName}</span>
        </button>

        <div className="absolute bottom-3 end-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-300">
          {product.stockQuantity > 0 ? `${formatNumber(product.stockQuantity)} ${t.product.inStock}` : t.product.soldOut}
        </div>
      </div>

      {/* Product Meta & Actions */}
      <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-black text-lg sm:text-xl text-emerald-400">
              {formatCurrency(product.price ?? 0)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons (Desktop Side-by-Side) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => onAddToCart(product)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>+ {t.product.addToCart}</span>
          </button>

          <button
            onClick={() => onQuickBuy(product)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>⚡ {t.product.quickBuy}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
