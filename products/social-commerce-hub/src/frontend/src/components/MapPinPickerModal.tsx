import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { MapIcon, SearchIcon } from './icons/Icons';

declare const L: any;

interface MapPinPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLon?: number;
  onLocationSelect: (lat: number, lon: number, addressDesc: string) => void;
}

// Fallback Egyptian landmark resolver if offline or network throttled
function getAreaDescription(latitude: number, longitude: number): string {
  if (latitude >= 30.05 && latitude <= 30.08 && longitude >= 31.20 && longitude <= 31.23) {
    return 'Zamalek Island, Cairo / حي الزمالك، القاهرة';
  } else if (latitude >= 29.94 && latitude <= 29.98 && longitude >= 31.24 && longitude <= 31.28) {
    return 'Maadi Degla, Cairo / المعادي دجلة، القاهرة';
  } else if (latitude >= 30.02 && latitude <= 30.05 && longitude >= 31.19 && longitude <= 31.22) {
    return 'Dokki & Mohandessin, Giza / الدقي والمهندسين، الجيزة';
  } else if (latitude >= 30.07 && latitude <= 30.12 && longitude >= 31.31 && longitude <= 31.36) {
    return 'Heliopolis, Cairo / مصر الجديدة، القاهرة';
  } else if (latitude >= 30.01 && latitude <= 30.06 && longitude >= 31.43 && longitude <= 31.50) {
    return 'New Cairo, 5th Settlement / القاهرة الجديدة، التجمع الخامس';
  } else if (latitude >= 29.95 && latitude <= 30.02 && longitude >= 30.90 && longitude <= 31.05) {
    return '6th of October City / مدينة 6 أكتوبر';
  } else if (latitude >= 31.18 && latitude <= 31.25 && longitude >= 29.89 && longitude <= 29.99) {
    return 'Alexandria Corniche / كورنيش الإسكندرية';
  }
  return `Cairo Urban Area (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
}

export const MapPinPickerModal: React.FC<MapPinPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat = 30.0444,
  initialLon = 31.2357,
  onLocationSelect,
}) => {
  const { t } = useTranslation();
  const [lat, setLat] = useState(initialLat);
  const [lon, setLon] = useState(initialLon);
  const [addressDesc, setAddressDesc] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Reverse geocode via OpenStreetMap Nominatim for accurate real street & city names
  const reverseGeocode = async (latitude: number, longitude: number, fallbackLabel?: string) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar,en`,
        { headers: { 'User-Agent': 'SocialCommerceHub/1.0' } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          // Extract meaningful readable parts (road, neighbourhood/suburb, city)
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.street || '';
          const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || '';
          const city = addr.city || addr.town || addr.state || 'Cairo';
          
          let formatted = [road, suburb, city].filter(Boolean).join('، ');
          if (!formatted || formatted.length < 5) {
            formatted = data.display_name.split(',').slice(0, 3).join(', ');
          }
          setAddressDesc(formatted);
          return;
        }
      }
    } catch {
      // Offline or network error fallback
    } finally {
      setIsGeocoding(false);
    }

    setAddressDesc(fallbackLabel || getAreaDescription(latitude, longitude));
  };

  // Initialize and update Leaflet interactive map
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
      return;
    }

    setLat(initialLat);
    setLon(initialLon);
    reverseGeocode(initialLat, initialLon);

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      if (typeof L === 'undefined') return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      // Initialize real interactive Leaflet map
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Standard OpenStreetMap tiles with complete streets, Arabic labels, shops & cities
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Custom pulsing, draggable pin marker
      const pinIcon = L.divIcon({
        className: 'custom-interactive-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab; user-select: none;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.7); border: 2.5px solid #ffffff; transition: transform 0.15s ease;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div style="width: 10px; height: 10px; background: #b91c1c; transform: rotate(45deg); margin-top: -6px; border-right: 2.5px solid #ffffff; border-bottom: 2.5px solid #ffffff;"></div>
            <div style="width: 16px; height: 5px; background: rgba(0,0,0,0.35); border-radius: 50%; filter: blur(2px); margin-top: 2px;"></div>
          </div>
        `,
        iconSize: [38, 48],
        iconAnchor: [19, 46],
      });

      const marker = L.marker([initialLat, initialLon], {
        icon: pinIcon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      marker.bindPopup(`<b>موقع التوصيل المختار</b><br/>اسحب الدبوس أو اضغط على أي مكان بالخريطة`).openPopup();

      // Drag event
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLat(pos.lat);
        setLon(pos.lng);
        reverseGeocode(pos.lat, pos.lng);
      });

      // Map click event
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLon(e.latlng.lng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;

      // Invalidate size to ensure crisp tile rendering in modal dialog
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLon]);

  const handleCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg(t.checkout.locationError);
      return;
    }

    setIsLocating(true);
    setStatusMsg(t.checkout.locating);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setLat(userLat);
        setLon(userLon);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          mapInstanceRef.current.flyTo([userLat, userLon], 16, { animate: true, duration: 1.2 });
          markerInstanceRef.current.setLatLng([userLat, userLon]);
          markerInstanceRef.current.openPopup();
        }

        reverseGeocode(userLat, userLon);
        setStatusMsg(t.checkout.locationDetected);
        setTimeout(() => setStatusMsg(null), 3000);
      },
      () => {
        setIsLocating(false);
        setStatusMsg(t.checkout.locationError);
        setTimeout(() => setStatusMsg(null), 3000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handlePresetSelect = (presetLat: number, presetLon: number, name: string) => {
    setLat(presetLat);
    setLon(presetLon);

    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.flyTo([presetLat, presetLon], 15, { animate: true, duration: 1.0 });
      markerInstanceRef.current.setLatLng([presetLat, presetLon]);
      markerInstanceRef.current.openPopup();
    }

    reverseGeocode(presetLat, presetLon, name);
  };

  // Search by place name (Cairo, Maadi, Dokki, etc.)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Egypt`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&accept-language=ar,en`, {
        headers: { 'User-Agent': 'SocialCommerceHub/1.0' },
      });
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const foundLat = parseFloat(item.lat);
          const foundLon = parseFloat(item.lon);
          setLat(foundLat);
          setLon(foundLon);

          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.flyTo([foundLat, foundLon], 15, { animate: true, duration: 1.0 });
            markerInstanceRef.current.setLatLng([foundLat, foundLon]);
            markerInstanceRef.current.openPopup();
          }

          setAddressDesc(item.display_name.split(',').slice(0, 3).join(', '));
          setSearchQuery('');
        } else {
          setStatusMsg('لم يتم العثور على المكان، حاول تجربة اسم آخر');
          setTimeout(() => setStatusMsg(null), 3000);
        }
      }
    } catch {
      setStatusMsg('حدث خطأ أثناء البحث');
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    onLocationSelect(lat, lon, addressDesc);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                {t.checkout.pinOnMapBtn} — خريطة حية تفاعلية
              </h3>
              <p className="text-[11px] text-slate-400">
                حرك الخريطة، اسحب الدبوس، أو اضغط على موقعك المفضل لتحديده بدقة
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

        {/* Search Bar & GPS Quick Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500 transition-colors">
            <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منطقة، شارع، أو مدينة في مصر..."
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none flex-1 py-1"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSearching ? 'جاري البحث...' : 'بحث'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleCurrentGpsLocation}
            disabled={isLocating}
            className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-2 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm"
          >
            {isLocating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span>{t.checkout.locating}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{t.checkout.autoLocationBtn}</span>
              </>
            )}
          </button>
        </div>

        {statusMsg && (
          <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-fade-in flex items-center gap-2">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Real Interactive Leaflet Tile Map Container */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-inner flex-1 min-h-[260px] sm:min-h-[320px]">
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[260px] sm:min-h-[320px] z-10"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Quick Floating Hint Badge */}
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>خريطة حية تفاعلية — اسحب الدبوس بحرية</span>
          </div>

          {/* Live Coordinates Pill */}
          <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-300 text-[10px] font-mono px-2.5 py-1 rounded-xl shadow-lg" dir="ltr">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
        </div>

        {/* Detected Location Display */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-slate-400 font-medium">{t.checkout.locationDetected}</p>
              {isGeocoding && (
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white truncate">
              {addressDesc || 'جاري استخراج اسم المنطقة والشارع...'}
            </p>
          </div>
        </div>

        {/* Quick Egyptian Neighborhood Presets */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
            <span>أحياء سريعة شهيرة / Quick Jump:</span>
            <span className="text-[10px] text-indigo-400">اضغط للانتقال الفوري</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {[
              { name: 'Zamalek (الزمالك)', lat: 30.0626, lon: 31.2223 },
              { name: 'Dokki (الدقي)', lat: 30.0384, lon: 31.2114 },
              { name: 'Mohandessin (المهندسين)', lat: 30.0528, lon: 31.2001 },
              { name: 'Maadi (المعادي دجلة)', lat: 29.9602, lon: 31.2569 },
              { name: 'Heliopolis (مصر الجديدة)', lat: 30.0912, lon: 31.3255 },
              { name: 'Nasr City (مدينة نصر)', lat: 30.0566, lon: 31.3411 },
              { name: 'New Cairo (التجمع الخامس)', lat: 30.0263, lon: 31.4708 },
              { name: '6th of October (مدينة 6 أكتوبر)', lat: 29.9722, lon: 30.9458 },
              { name: 'Alexandria (الإسكندرية)', lat: 31.2001, lon: 29.9187 },
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset.lat, preset.lon, preset.name)}
                className="text-[11px] bg-slate-800/90 hover:bg-indigo-600 hover:text-white text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700/60 hover:border-indigo-500 transition-all cursor-pointer font-medium shadow-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>✓</span>
            <span>{t.checkout.confirmLocation}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
