import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en', 'fr', 'es', 'it', 'zh', 'ar'],
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

// Handle RTL text direction for Arabic
i18n.on('languageChanged', (lng) => {
  if (lng) {
    document.documentElement.dir = i18n.dir(lng);
    document.documentElement.lang = lng;
  }
});

// Set initial direction
if (i18n.resolvedLanguage) {
  document.documentElement.dir = i18n.dir(i18n.resolvedLanguage);
  document.documentElement.lang = i18n.resolvedLanguage;
}

export default i18n;
