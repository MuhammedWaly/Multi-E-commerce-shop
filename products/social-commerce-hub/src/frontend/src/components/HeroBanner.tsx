import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface HeroBannerProps {
  onExploreClick: () => void;
  onStoresClick: () => void;
  onSeeAllClick?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreClick, onStoresClick, onSeeAllClick }) => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl my-6">
      <div className="relative z-10 max-w-[1536px] mx-auto px-6 py-14 sm:py-20 lg:px-14 flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Copy */}
        <div className="max-w-2xl text-center lg:text-start space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300">
            <span>{t.hero.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            {t.hero.titlePart1} <br />
            <span className="text-indigo-400">
              {t.hero.titleHighlight}
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
            {t.hero.description}
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
            <button
              onClick={onExploreClick}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-2xl text-base transition-colors flex items-center gap-2 cursor-pointer shadow-sm min-h-[48px]"
            >
              <span>{t.hero.exploreBtn}</span>
              <span className="text-sm">↓</span>
            </button>
            {onSeeAllClick && (
              <button
                onClick={onSeeAllClick}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-3 rounded-2xl text-base transition-colors flex items-center gap-2 cursor-pointer min-h-[48px]"
              >
                <span>{t.hero.seeAllBtn}</span>
                <span className="text-sm">↗</span>
              </button>
            )}
            <button
              onClick={onStoresClick}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-medium px-6 py-3 rounded-2xl text-base transition-colors cursor-pointer min-h-[48px]"
            >
              {t.hero.storesBtn}
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/80 max-w-lg mx-auto lg:mx-0">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">{t.hero.makersMetric}</p>
              <p className="text-sm text-slate-400 font-medium">{t.hero.makersLabel}</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">{t.hero.ratingMetric}</p>
              <p className="text-sm text-slate-400 font-medium">{t.hero.ratingLabel}</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-400">{t.hero.deliveryMetric}</p>
              <p className="text-sm text-slate-400 font-medium">{t.hero.deliveryLabel}</p>
            </div>
          </div>
        </div>

        {/* Right Visual Collage */}
        <div className="w-full lg:w-5/12 grid grid-cols-2 gap-3.5 max-w-md">
          <div className="space-y-3.5">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-xl border border-slate-800 group">
              <img
                src="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600"
                alt="Linen Shirt"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-2.5 start-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white">
                {t.hero.fashionPill}
              </span>
            </div>
          </div>
          <div className="space-y-3.5 pt-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-xl border border-slate-800 group">
              <img
                src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600"
                alt="Leather Bag"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-2.5 start-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white">
                {t.hero.leatherPill}
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
