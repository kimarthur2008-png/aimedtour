'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Lang } from '@/lib/i18n';

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'RU', label: 'Русский', flag: '/icons/flags/rus.png' },
  { code: 'EN', label: 'English', flag: '/icons/flags/en.png' },
  { code: 'KO', label: '한국어',  flag: '/icons/flags/kor.png' },
];

export default function Header() {
  const { profile }  = useAuth();
  const pathname  = usePathname();
  const { lang, setLang, t } = useLanguage();

  const NAV = [
    { label: t.nav.home,      href: '/',          width: 'w-[100px]', icon: '/icons/homemob.svg'},
    { label: t.nav.reviews,   href: '/reviews',   width: 'w-[120px]', icon: '/icons/reviewsmob.svg'},
    { label: t.nav.hospitals, href: '/hospitals', width: 'w-[130px]', icon: '/icons/hospitalsmob.svg'},
    { label: t.nav.trip,      href: '/trip',      width: 'w-[130px]', icon: '/icons/mapmob.svg'},
    { label: t.nav.about,     href: '/about',     width: 'w-[70px]',  icon: '/icons/abtmob.svg'},
  ];

  const [langOpen,   setLangOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Блокировка скролла при открытом мобильном меню
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
      <>
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 drop-shadow-l">
          <div className="max-w-[1440px] mx-auto h-[76px] flex items-center justify-between gap-4 px-6">
            {/* Логотип */}
            <Link href="/" className="shrink-0">
              <img src="/logo.svg" alt="Smart K-Medi" className="h-8 w-auto" />
            </Link>

            {/* Навигация — десктоп */}
            <nav className="hidden lg:flex items-center gap-3">
              {NAV.map((n) => (
                  <Link
                      key={n.href}
                      href={n.href}
                      className={`px-3 py-2 rounded-lg text-[14px] font-normal transition-all duration-200 text-center whitespace-nowrap
                  ${pathname === n.href
                          ? 'bg-[#6b8b8020] text-[#618075]'
                          : 'text-[#21393B] hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    {n.label}
                  </Link>
              ))}
            </nav>

            {/* Правая часть — десктоп */}
            <div className="hidden lg:flex items-center gap-4 shrink-0">

              {/* Язык */}
              <div className="relative" ref={langRef}>
                <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-sm text-[#21393B] hover:bg-gray-50 transition-colors"
                >
                  <img src="/icons/language.svg" alt="" className="h-4 w-4" />
                  <span>{lang}</span>
                  <img
                      src="/icons/arrow.svg"
                      className={`h-auto w-3 transition-transform duration-200 ${langOpen ? 'rotate-180' : 'rotate-0'}`}
                  />
                </button>

                {langOpen && (
                    <div className="absolute top-9 left-0 bg-white border border-gray-100 rounded-xl shadow-md py-1 z-50 min-w-[80px]">
                      {(['RU', 'EN', 'KO'] as Lang[]).map((l) => (
                          <button
                              key={l}
                              onClick={() => { setLang(l); setLangOpen(false); }}
                              className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                        ${lang === l ? 'text-[#6b8b80] font-medium' : 'text-[#21393B]'}`}
                          >
                            {l}
                          </button>
                      ))}
                    </div>
                )}
              </div>

              {profile ? (
                  <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-1 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] hover:bg-[#DAE3E8]/50 transition-colors"
                  >
                    <img src="/icons/nameauth.svg" alt="" className="h-4 w-4" />
                    <span className="hidden sm:block">{profile.fullName || profile.nick}</span>
                    <span className="sm:hidden">{t.header.profile}</span>
                  </Link>
              ) : (
                  <>
                    <Link
                        href="/auth"
                        className="flex items-center gap-[4px] px-3 py-1 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] hover:bg-[#DAE3E8]/50  transition-colors"
                    >
                      <img src="/icons/sign_in.svg" alt="" className="h-4 w-4" />
                      {t.header.login}
                    </Link>
                    <Link
                        href="/auth?tab=register"
                        className="flex items-center gap-[4px] px-4 py-1 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] hover:bg-[#DAE3E8]/50 transition-colors"
                    >
                      <img src="/icons/sign_up.svg" alt="" className="h-4 w-4" />
                      {t.header.register}
                    </Link>
                  </>
              )}

              {/* Кнопка консультации */}
              <Link
                  href="/quiz"
                  className="flex items-center gap-2 px-4 py-1 rounded-xl border border-[#F7FAE8] bg-primary text-[#F7FAE8] text-sm font-medium hover:bg-primary/80 transition-colors whitespace-nowrap"
              >
                <img src="/icons/Chat.svg" alt="" className="h-4 w-4" />
                {t.header.quizCta}
              </Link>
            </div>

            {/* Гамбургер — мобилка и планшет */}
            <button
                className="lg:hidden ml-auto flex flex-col justify-center gap-[5px] p-2 touch-manipulation"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Меню"
            >
            <span className={`block h-[2px] w-6 bg-[#21393B] rounded transition-all duration-300 origin-center
              ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
            />
              <span className={`block h-[2px] w-6 bg-[#21393B] rounded transition-all duration-300
              ${mobileOpen ? 'opacity-0' : ''}`}
              />
              <span className={`block h-[2px] w-6 bg-[#21393B] rounded transition-all duration-300 origin-center
              ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
              />
            </button>

          </div>
        </header>

        {/* ── Мобильное меню ──────────────────────────────────────────── */}
        <div className={`lg:hidden fixed inset-0 top-19 z-30 bg-white overflow-y-auto
          transition-all duration-300 ease-in-out
          ${mobileOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-3 pointer-events-none'
          }`}>
              <div className="flex flex-col px-6 py-6 gap-1">

                {/* Навигация */}
                {NAV.map((n) => (
                    <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-4 px-3 py-4 rounded-xl text-[16px] transition-colors
                  ${pathname === n.href
                            ? 'bg-[#6b8b8020] text-[#618075]'
                            : 'text-[#21393B] hover:bg-gray-50'
                        }`}
                    >
                      {/* ИКОНКА: <img src="/icons/nav/....svg" className="h-5 w-5" /> */}
                      <img src={n.icon} alt="" className="h-5 w-5 shrink-0" />
                      {n.label}
                    </Link>
                ))}

                <div className="h-px bg-gray-100 my-3" />

                {/* Выбор языка */}
                <p className="text-[13px] font-medium text-[#21393B] px-3 mb-2">Язык</p>
                <div className="grid grid-cols-2 gap-2">
                  {LANGS.map((l) => (
                      <button
                          key={l.code}
                          onClick={() => setLang(l.code)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] transition-colors border
                    ${lang === l.code
                              ? 'border-[#6b8b80] bg-[#6b8b8015] text-[#4C6D7C] font-medium'
                              : 'border-gray-100 bg-gray-50 text-[#21393B]'
                          }`}
                      >
                        <img src={l.flag} className="h-4 w-5 rounded-sm" />
                        {l.label}
                      </button>
                  ))}
                </div>

                <div className="h-px bg-gray-100 my-3" />

                {/* Профиль / Войти */}
                {profile ? (
                    <Link
                        href="/profile"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 px-3 py-4 rounded-xl text-[16px] text-[#21393B] hover:bg-gray-50 transition-colors"
                    >
                      <img src="/icons/nameauth.svg" alt="" className="h-5 w-5 shrink-0" />
                      {profile.fullName || profile.nick || t.header.profile}
                    </Link>
                ) : (
                    <Link
                        href="/auth"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-4 px-3 py-4 rounded-xl text-[16px] text-[#21393B] hover:bg-gray-50 transition-colors"
                    >
                      <img src="/icons/sign_in.svg" alt="" className="h-5 w-5 shrink-0" />
                      {t.header.login}
                    </Link>
                )}

                {/* CTA */}
                <Link
                    href="/quiz"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 w-full py-4 rounded-2xl text-center text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {t.header.quizCta}
                </Link>

              </div>
            </div>
      </>
  );
}