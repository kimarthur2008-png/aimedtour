'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageBlurWrapper({ children }: { children: React.ReactNode }) {
  const { isChanging } = useLanguage();
  return (
    <div className={`flex flex-col min-h-full lang-blur-wrapper${isChanging ? ' is-changing' : ''}`}>
      {children}
    </div>
  );
}
