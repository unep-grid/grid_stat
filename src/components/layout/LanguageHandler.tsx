import React, {
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Language } from "../../lib/utils/translations";
import { DEFAULT_LANGUAGE } from "../../lib/utils/translations";


// LanguageHandler.tsx
interface LanguageHandlerProps {
  children: ReactNode;
  onLanguageChange?: (lang: Language) => void;
}

export function LanguageHandler({ children, onLanguageChange }: LanguageHandlerProps) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const lastLanguage = localStorage.getItem("language") as Language;

    if (lastLanguage) {
      htmlElement.lang = lastLanguage;
      setLanguage(lastLanguage);
      onLanguageChange?.(lastLanguage);
    }

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "attributes" && mutation.attributeName === "lang") {
          const newLang = htmlElement.lang as Language;
          setLanguage(newLang);
          onLanguageChange?.(newLang);
          localStorage.setItem("language", newLang);
        }
      }
    });

    observer.observe(htmlElement, { attributes: true });
    return () => observer.disconnect();
  }, [onLanguageChange]);

  return <>{children}</>;
}
