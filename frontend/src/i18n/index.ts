import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslations from "./locales/en.json";
import viTranslations from "./locales/vi.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  vi: {
    translation: viTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: process.env.NODE_ENV === "development",

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag", "path", "subdomain"],
      caches: ["localStorage"],
      lookupLocalStorage: "preferredLanguage",
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
    },

    // Additional configuration for better Vietnamese support
    react: {
      useSuspense: false,
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "em"],
    },

    // Namespace configuration
    defaultNS: "translation",
    ns: ["translation"],

    // Performance optimization
    load: "languageOnly",
    cleanCode: true,

    // Better pluralization for Vietnamese
    pluralSeparator: "_",
    contextSeparator: "_",

    // Supported languages
    supportedLngs: ["en", "vi"],
    nonExplicitSupportedLngs: false,
  });

// Listen for language changes and update document attributes
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" || lng === "he" ? "rtl" : "ltr";

  // Update meta tags for SEO
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    const description =
      lng === "vi"
        ? "GiúpViệcVặt - Nền tảng kết nối khách hàng với thợ địa phương cho mọi nhu cầu hàng ngày"
        : "HomeEasy - Platform connecting customers with local taskers for everyday needs";
    metaDescription.setAttribute("content", description);
  }
});

export default i18n;
