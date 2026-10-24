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
    <article className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-slate-700 shadow-sm transition-all duration-200 flex flex-col justify-between">
      {/* Product Image / Video Canvas */}
      <div className="relative aspect-[4/5] bg-slate-950 overflow-hidden">
        {isVideo ? (
          <div className="w-full h-full relative">
            <video
              src={product.mediaUrl}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
              autoPlay
              muted
              loop
              playsInline
            />
            <span className="absolute top-3 end-16 bg-slate-950/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-sm flex items-center gap-1">
              <span>▶</span>
              <span>{t.product.videoBadge}</span>
            </span>
          </div>
        ) : (
          <img
            src={product.mediaUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {discountPercent > 0 && (
            <span className="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-indigo-600 text-white text-xs font-semibold px-2.5 py-1 rounded-lg shadow-sm">
              {t.product.featuredBadge}
            </span>
          )}
        </div>

        {/* Star Rating Badge (Clickable to open Verified Reviews) */}
        <button
          onClick={() => onOpenReviews?.(product)}
          className="absolute top-3 end-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium text-amber-300 border border-slate-800 flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
          title={t.product.ratingLabel}
        >
          <span>★</span>
          <span>{formatNumber(product.rating)}</span>
          <span className="text-xs text-slate-400">({formatNumber(product.reviewCount)})</span>
        </button>

        {/* Merchant Tag */}
        <button
          onClick={() => onStoreClick(product.storeSlug)}
          className="absolute bottom-3 start-3 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium text-slate-200 border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <span>@{product.storeName}</span>
        </button>

        <div className="absolute bottom-3 end-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400">
          {product.stockQuantity > 0 ? `${formatNumber(product.stockQuantity)} ${t.product.inStock}` : t.product.soldOut}
        </div>
      </div>

      {/* Product Meta & Actions */}
      <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-black text-xl sm:text-2xl text-emerald-400">
              {formatCurrency(product.price ?? 0)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-slate-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons (Desktop Side-by-Side) */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => onAddToCart(product)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold py-2.5 px-3.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer min-h-[42px]"
          >
            <span>{t.product.addToCart}</span>
          </button>

          <button
            onClick={() => onQuickBuy(product)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-2.5 px-3.5 rounded-xl transition-colors flex items-center justify-center cursor-pointer shadow-sm min-h-[42px]"
          >
            <span>{t.product.quickBuy}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
