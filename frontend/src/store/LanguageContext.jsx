import { createContext, useContext, useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';
import { translations } from '../i18n/translations';

const LANGUAGE_KEY = 'vcb_app_lang';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem(LANGUAGE_KEY) || 'vi';
  });

  const setLang = (newLang) => {
    const validLang = newLang === 'en' ? 'en' : 'vi';
    setLangState(validLang);
    localStorage.setItem(LANGUAGE_KEY, validLang);
  };

  const toggleLang = () => {
    setLang(lang === 'vi' ? 'en' : 'vi');
  };

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  /**
   * Helper translation function
   * @param {string} key - Translation key (e.g. 'common.login')
   * @param {string} [fallback] - Fallback string if key not found
   */
  const t = (key, fallback = '') => {
    const langDict = translations[lang] || translations.vi;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    // Fallback to Vietnamese dictionary if key missing in English
    if (translations.vi && translations.vi[key] !== undefined) {
      return translations.vi[key];
    }
    return fallback || key;
  };

  const antdLocale = lang === 'en' ? enUS : viVN;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        isVi: lang === 'vi',
        isEn: lang === 'en',
      }}
    >
      <ConfigProvider locale={antdLocale}>
        {children}
      </ConfigProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
