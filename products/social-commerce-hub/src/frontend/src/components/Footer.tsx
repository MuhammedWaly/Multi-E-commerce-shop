import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-sm mt-20">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                S
              </div>
              <span className="font-black text-2xl text-white tracking-tight">SocialHub</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-sm">
              {t.footer.brandDesc}
            </p>
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <span className="hover:text-white cursor-pointer">Instagram</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">LinkedIn</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">{t.footer.egyptianPlatform}</span>
            </div>
          </div>

          {/* Shopper Links */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">{t.footer.discoverHeading}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.fashion}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.leather}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.home}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.accessories}</a></li>
            </ul>
          </div>

          {/* Merchant Ecosystem */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">{t.footer.sellerHeading}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.createMerchantModal.title}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.header.merchantCenter}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.adminPortal.platformTakeRate}</a></li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div className="space-y-3.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-sm">{t.footer.communityHeading}</h4>
            <p className="text-slate-400 leading-relaxed text-sm">
              {t.cart.secureNotice}
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono text-slate-300">
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">PayPal</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">Visa</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">Mastercard</span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">Meeza</span>
            </div>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Social-Commerce-Hub Inc. {t.footer.rightsReserved}</p>
          <div className="flex gap-4">
            <span className="text-indigo-400">{t.footer.egyptianPlatform}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
