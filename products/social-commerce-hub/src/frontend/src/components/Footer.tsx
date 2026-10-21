import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-base">
                S
              </div>
              <span className="font-black text-xl text-white tracking-tight">SocialHub</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              {t.footer.brandDesc}
            </p>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="hover:text-white cursor-pointer">Instagram</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">LinkedIn</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">{t.footer.egyptianPlatform}</span>
            </div>
          </div>

          {/* Shopper Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">{t.footer.discoverHeading}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.fashion}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.leather}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.home}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.categories.accessories}</a></li>
            </ul>
          </div>

          {/* Merchant Ecosystem */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">{t.footer.sellerHeading}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.createMerchantModal.title}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.header.merchantCenter}</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">{t.adminPortal.platformTakeRate}</a></li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">{t.footer.communityHeading}</h4>
            <p className="text-slate-400 leading-relaxed">
              {t.cart.secureNotice}
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-300">
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">PayPal</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Visa</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Mastercard</span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">Meeza</span>
            </div>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Social-Commerce-Hub Inc. {t.footer.rightsReserved}</p>
          <div className="flex gap-4">
            <span className="text-indigo-400">{t.footer.egyptianPlatform}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
