import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { Language } from '../../lib/utils/translations';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../lib/utils/translations';

export function LanguageSelector() {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const currentLang = document.documentElement.lang as Language;
    if (currentLang && SUPPORTED_LANGUAGES.includes(currentLang)) {
      setLanguage(currentLang);
    }
  }, []);

  const handleLanguageChange = (newLanguage: Language) => {
    if (SUPPORTED_LANGUAGES.includes(newLanguage)) {
      setLanguage(newLanguage);
      document.documentElement.lang = newLanguage;
      window.dispatchEvent(new CustomEvent('languageChange', { detail: newLanguage }));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="mr-2">
          <Globe className="h-5 w-5" />
          <span className="ml-2 text-sm">{language.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={language === lang ? 'bg-accent' : ''}
          >
            {lang.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
