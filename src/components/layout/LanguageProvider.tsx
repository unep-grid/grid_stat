import React, { useState, useEffect, isValidElement, cloneElement } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '@/lib/utils/translations';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/lib/utils/translations';
import { Navbar } from './Navbar';

interface LanguageProviderProps {
  children: ReactNode;
}

interface WithLanguageProps {
  language?: Language;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const handleLanguageChange = (newLanguage: Language) => {
    if (SUPPORTED_LANGUAGES.includes(newLanguage)) {
      setLanguage(newLanguage);
    }
  };

  // Create a new object with the language prop for each child
  const childrenWithLanguage = React.Children.map(children, child => {
    if (isValidElement(child)) {
      // Create a new props object with the current props and the language
      return cloneElement(child, {
        ...child.props,
        language,
      });
    }
    return child;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar language={language} onLanguageChange={handleLanguageChange} />
      <main className="flex-1">
        {childrenWithLanguage}
      </main>
    </div>
  );
}
