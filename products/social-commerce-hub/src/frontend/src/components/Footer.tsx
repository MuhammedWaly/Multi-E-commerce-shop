import React from 'react';

export const Footer: React.FC = () => {
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
              Egypt's premier curated multi-merchant web marketplace connecting discerning shoppers directly with independent local boutique creators and heritage artisans.
            </p>
            <div className="flex items-center gap-3 text-slate-500">
              <span className="hover:text-white cursor-pointer">Instagram</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">LinkedIn</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">Cairo, Egypt</span>
            </div>
          </div>

          {/* Shopper Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Explore Categories</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Artisanal Egyptian Linen</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Hand-Stitched Leather Bags</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Tunis Village Stoneware</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Handmade Jewelry & Silver</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Featured Boutiques Directory</a></li>
            </ul>
          </div>

          {/* Merchant Ecosystem */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">For Creators & Brands</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Open a Storefront</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Merchant Guidelines</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Transparent 5% Fee Structure</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Merchant Portal Login</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Payout & Ledger FAQs</a></li>
            </ul>
          </div>

          {/* Trust & Guarantee */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">Buyer Protection & Trust</h4>
            <p className="text-slate-400 leading-relaxed">
              Every transaction on SocialHub is backed by our Buyer Protection Guarantee. Payments are held in secure escrow until verified shipment.
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
          <p>© 2026 Social-Commerce-Hub Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400">Terms of Service</a>
            <a href="#" className="hover:text-slate-400">Disbursement Policies</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
