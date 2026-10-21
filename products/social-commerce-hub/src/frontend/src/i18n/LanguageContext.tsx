import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { translations, type Language, type Direction, type Translations } from './translations';

const STORAGE_KEY = 'socialhub_language';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  formatCurrency: (amount: number | null | undefined) => string;
  formatNumber: (value: number | null | undefined) => string;
  formatDate: (date: string | Date | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar')) {
        return 'ar';
      }
    } catch {
      // Fallback
    }
    return 'en';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = direction === 'rtl';

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore local storage error
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
      document.body.dir = direction;
      if (isRTL) {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    }
  }, [language, direction, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const currentTranslations = useMemo(() => {
    return translations[language];
  }, [language]);

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return language === 'ar' ? '0 ج.م' : '0 EGP';
    }
    const formatted = amount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      maximumFractionDigits: 2,
    });
    return language === 'ar' ? `${formatted} ج.م` : `${formatted} EGP`;
  };

  const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return value.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return String(date);
    }
  };

  const value = useMemo(
    () => ({
      language,
      direction,
      isRTL,
      setLanguage,
      toggleLanguage,
      t: currentTranslations,
      formatCurrency,
      formatNumber,
      formatDate,
    }),
    [language, direction, isRTL, currentTranslations]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
