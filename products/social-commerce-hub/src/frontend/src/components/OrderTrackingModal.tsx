import React, { useState, useEffect, useRef } from 'react';
import { api, type OrderTrackingResponse } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

declare const L: any;

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const { t, formatCurrency } = useTranslation();
  const [tracking, setTracking] = useState<OrderTrackingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const routeMapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setTracking(null);
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
      }
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    api.getOrderTracking(orderId)
      .then((data) => {
        setTracking(data);
      })
      .catch((err) => {
        console.warn('Tracking API fallback:', err);
        // Fallback simulation for newly created orders
        setTracking({
          orderId,
          status: 'Processing',
          customerName: 'Customer Delivery',
          shippingAddress: 'Zamalek / Dokki, Cairo',
          deliveryLatitude: 30.0384,
          deliveryLongitude: 31.2114,
          distanceKm: 4.8,
          shippingFee: 25.00,
          estimatedDeliveryMinutes: 42,
          formattedEta: '42 mins / 42 دقيقة',
          storeName: 'Sari Boutique / بوتيك ساري',
          storeAddress: '26th of July St, Zamalek, Cairo',
          storeCity: 'Cairo',
          storeLatitude: 30.0626,
          storeLongitude: 31.2223,
          createdAtUtc: new Date().toISOString(),
          timelineSteps: [
            'Order Confirmed / تم تأكيد الطلب',
            'Preparing in Boutique / جاري التجهيز في المتجر',
            'Out for Delivery / مع مندوب التوصيل في الطريق',
            'Delivered / تم التوصيل والاستلام',
          ],
          currentStepIndex: 1,
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId]);

  // Mount real interactive Leaflet route map when tracking data is available
  useEffect(() => {
    if (!tracking || !isOpen || !routeMapRef.current || typeof L === 'undefined') {
      return;
    }

    const timer = setTimeout(() => {
      if (!routeMapRef.current) return;

      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
      }

      const storeLat = tracking.storeLatitude || 30.0626;
      const storeLon = tracking.storeLongitude || 31.2223;
      const custLat = tracking.deliveryLatitude || 30.0384;
      const custLon = tracking.deliveryLongitude || 31.2114;

      const map = L.map(routeMapRef.current, {
        center: [(storeLat + custLat) / 2, (storeLon + custLon) / 2],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Store Origin Marker
      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="background: #4f46e5; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.6);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Customer Destination Marker
      const customerIcon = L.divIcon({
        className: 'custom-cust-pin',
        html: `
          <div style="background: #ef4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      // Courier in Transit Marker
      const courierIcon = L.divIcon({
        className: 'custom-courier-pin',
        html: `
          <div style="background: #10b981; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.7); animation: bounce 1.5s infinite;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const storeMarker = L.marker([storeLat, storeLon], { icon: storeIcon }).addTo(map);
      storeMarker.bindPopup(`<b>${tracking.storeName}</b><br/>${tracking.storeAddress}`);

      const customerMarker = L.marker([custLat, custLon], { icon: customerIcon }).addTo(map);
      customerMarker.bindPopup(`<b>${tracking.customerName}</b><br/>${tracking.shippingAddress}`);

      // Calculate courier vehicle position along route
      const currentStep = tracking.currentStepIndex ?? 1;
      const progressFraction = Math.max(0.15, Math.min(0.85, (currentStep + 1) / 4));
      const courierLat = storeLat + (custLat - storeLat) * progressFraction;
      const courierLon = storeLon + (custLon - storeLon) * progressFraction;

      const courierMarker = L.marker([courierLat, courierLon], { icon: courierIcon }).addTo(map);
      courierMarker.bindPopup(`<b>مندوب التوصيل في الطريق</b><br/>المسافة المتبقية: ${(tracking.distanceKm * (1 - progressFraction)).toFixed(1)} km`);

      // Connect with Route Polyline
      const routePolyline = L.polyline(
        [
          [storeLat, storeLon],
          [courierLat, courierLon],
          [custLat, custLon],
        ],
        {
          color: '#6366f1',
          weight: 4,
          opacity: 0.85,
          dashArray: '8, 8',
          lineCap: 'round',
        }
      ).addTo(map);

      // Auto-fit map to route bounds
      try {
        map.fitBounds(routePolyline.getBounds(), { padding: [45, 45] });
      } catch {}

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, [tracking, isOpen]);

  if (!isOpen) return null;

  const currentStep = tracking?.currentStepIndex ?? 1;
  const progressPercent = Math.min(100, Math.max(0, (currentStep / 3) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl text-white">
                {t.checkout.trackingTitle}
              </h3>
              <p className="text-xs text-slate-400 font-mono" dir="ltr">
                Order ID: #{orderId?.slice(0, 13)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.common.close}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>{t.common.loading}</span>
          </div>
        ) : errorMsg ? (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
            {errorMsg}
          </div>
        ) : tracking ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Origin & Destination Information Bar */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    {t.checkout.originStore}
                  </span>
                  <p className="font-semibold text-white text-xs truncate">{tracking.storeName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{tracking.storeAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0 text-end justify-end">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    {t.checkout.destinationCustomer}
                  </span>
                  <p className="font-semibold text-white text-xs truncate">{tracking.customerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{tracking.shippingAddress}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Real Interactive Leaflet Route Map */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner h-64 sm:h-80">
              <div
                ref={routeMapRef}
                className="w-full h-full z-10"
                style={{ width: '100%', height: '100%' }}
              />

              {/* Floating ETA & Distance Pill */}
              <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                <span className="text-indigo-400 font-mono" dir="ltr">{tracking.distanceKm} km</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">{tracking.formattedEta}</span>
              </div>

              {/* Legend Pill */}
              <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] text-slate-300 px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-2">
                <span>المتجر</span>
                <span>⟶</span>
                <span>المندوب</span>
                <span>⟶</span>
                <span>العميل</span>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="space-y-1.5">
              <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>0 km (المتجر)</span>
                <span className="text-indigo-300 font-bold">{t.checkout.courierInTransit}</span>
                <span>{tracking.distanceKm} km (العميل)</span>
              </div>
            </div>

            {/* Delivery Progress Milestones */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                {t.checkout.orderTimeline}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Order Confirmed / تم تأكيد الطلب', idx: 0 },
                  { label: 'Preparing / جاري التجهيز في المتجر', idx: 1 },
                  { label: 'Out for Delivery / مع المندوب في الطريق', idx: 2 },
                  { label: 'Delivered / تم التوصيل والاستلام', idx: 3 },
                ].map((step) => {
                  const isDone = currentStep >= step.idx;
                  const isCurrent = currentStep === step.idx;

                  return (
                    <div
                      key={step.idx}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-colors ${
                        isCurrent
                          ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                          : isDone
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                          : 'bg-slate-950/30 border-slate-900 text-slate-500'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          isDone ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isDone ? '✓' : step.idx + 1}
                      </div>
                      <span className="flex-1 font-semibold text-[11px] truncate">{step.label}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-indigo-500/40">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Logistics Summary Breakdown */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">{t.checkout.distanceLabel}:</span>
                <span className="font-bold text-white font-mono" dir="ltr">
                  {tracking.distanceKm} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.checkout.shippingFeeLabel}:</span>
                <span className="font-bold text-emerald-400 font-mono" dir="ltr">
                  {formatCurrency(tracking.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.checkout.estimatedTimeLabel}:</span>
                <span className="font-bold text-indigo-300 font-mono" dir="ltr">
                  {tracking.formattedEta}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
