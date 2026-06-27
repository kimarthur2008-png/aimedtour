'use client';

import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { dict, type Lang, type T } from '@/lib/i18n';

const VALID_LANGS: Lang[] = ['RU', 'EN', 'KO'];
const STORAGE_KEY = 'lang';

interface LanguageContextType {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       T;
}

const LanguageContext = createContext<LanguageContextType>({
  lang:    'RU',
  setLang: () => {},
  t:       dict['RU'],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('RU');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && VALID_LANGS.includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useMemo(() => dict[lang], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
