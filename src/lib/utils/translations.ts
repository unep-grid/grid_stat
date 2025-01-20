import dict from '@/data/dict/dict.json';

export type Language = 'en' | 'fr' | 'ar' | 'zh' | 'ru' | 'es';
export const DEFAULT_LANGUAGE: Language = 'en';
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'fr'];

const not_found = new Set();

type TranslationKey = string;
type TranslationDict = typeof dict;

export function t(key: TranslationKey, language: Language = DEFAULT_LANGUAGE): string {
  const keys = key.split('.');
  let current: any = dict;
  
  // Navigate through the dictionary using the key path
  for (const k of keys) {
    if (!current[k]) {
      not_found.add(k);
      console.warn(`Translation key not found: ${key}`);
      console.log(not_found);
      return key;
    }
    current = current[k];
  }

  // Return the translation or fallback to English if not found
  if (current[language]) {
    return current[language];
  }
  
  console.warn(`Translation not found for language ${language}, key: ${key}`);
  return current[DEFAULT_LANGUAGE] || key;
}
