import { Request } from "express";
import i18next from "../config/i18n";

// Type for translation function
export type TFunction = (key: string, options?: any) => string;

/**
 * Get translation function for a specific request
 * @param req Express request object
 * @returns Translation function
 */
export const getTranslation = (req: Request): TFunction => {
  const language = req.language || "en";
  return (key: string, options?: any) => {
    return i18next.getFixedT(language)(key, options) as string;
  };
};

/**
 * Get translation for a specific language
 * @param language Language code
 * @returns Translation function
 */
export const getTranslationForLanguage = (language: string): TFunction => {
  return (key: string, options?: any) => {
    return i18next.getFixedT(language)(key, options) as string;
  };
};

/**
 * Get available languages
 * @returns Array of supported language codes
 */
export const getSupportedLanguages = (): string[] => {
  const supportedLngs = i18next.options.supportedLngs;
  return Array.isArray(supportedLngs)
    ? supportedLngs.filter((lng: string) => lng !== "cimode")
    : ["en", "vi"];
};

/**
 * Check if a language is supported
 * @param language Language code to check
 * @returns Boolean indicating if language is supported
 */
export const isLanguageSupported = (language: string): boolean => {
  return getSupportedLanguages().includes(language);
};
