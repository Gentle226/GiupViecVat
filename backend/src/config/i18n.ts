import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

const initI18n = async () => {
  return i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      // Default language
      lng: "en",

      // Fallback language if translation is missing
      fallbackLng: "en",

      // Supported languages
      supportedLngs: ["en", "vi"],

      // Preload languages
      preload: ["en", "vi"],

      // Backend configuration for file system
      backend: {
        loadPath: path.join(__dirname, "../locales/{{lng}}/{{ns}}.json"),
        addPath: path.join(__dirname, "../locales/{{lng}}/{{ns}}.missing.json"),
      },

      // Language detection configuration
      detection: {
        // Detection order
        order: ["header", "querystring", "cookie", "session"],

        // Cache user language on
        caches: ["cookie"],

        // Exclude caching certain languages
        excludeCacheFor: ["cimode"],

        // Optional set cookie options
        cookieOptions: {
          maxAge: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
          httpOnly: false,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
        },
      },

      // Namespace configuration
      ns: ["translation"],
      defaultNS: "translation",

      // Interpolation configuration
      interpolation: {
        escapeValue: false, // React already does escaping
      },

      // Return null for missing keys instead of the key itself
      returnNull: false,
      returnEmptyString: false,

      // Load missing key handler
      saveMissing: process.env.NODE_ENV === "development",

      // Debug mode
      debug: process.env.NODE_ENV === "development",
    });
};

// Initialize immediately
initI18n();

export default i18next;
