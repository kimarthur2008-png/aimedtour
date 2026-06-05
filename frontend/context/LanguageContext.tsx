'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { dict, type Lang, type T } from '@/lib/i18n';

interface LanguageContextType {
  lang:       Lang;
  setLang:    (l: Lang) => void;
  t:          T;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang:       'RU',
  setLang:    () => {},
  t:          dict['RU'],
  isChanging: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang,       setLangState] = useState<Lang>('RU');
  const [isChanging, setIsChanging] = useState(false);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
  }, []);

  const t = useMemo(() => dict[lang], [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, isChanging }),
    [lang, setLang, t, isChanging]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
