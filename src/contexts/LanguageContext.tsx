import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Language } from "../lib/utils/translations";
import { DEFAULT_LANGUAGE } from "../lib/utils/translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
};

// Create context with default value using the Language type
export const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {}
});

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(
    (document.documentElement.lang as Language) || DEFAULT_LANGUAGE
  );

  useEffect(() => {
    const handleLangChange = () => {
      const newLang = document.documentElement.lang as Language;
      setLanguage(newLang);
    };

    const observer = new MutationObserver(handleLangChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
