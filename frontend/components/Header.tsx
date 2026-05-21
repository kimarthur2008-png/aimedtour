'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const NAV = [
  { label: 'Главная',              href: '/',          width: 'w-[100px]' },
  { label: 'Отзывы пациентов',     href: '/reviews',   width: 'w-[120px]' },
  { label: 'Партнерские больницы', href: '/hospitals', width: 'w-[130px]' },
  { label: 'Туризм и путешествия', href: '/trip',      width: 'w-[130px]' },
  { label: 'О нас',                href: '/about',     width: 'w-[70px]'  },
];

export default function Header() {
  const { user }  = useAuth();
  const pathname  = usePathname();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [modalMode,  setModalMode]  = useState<'login' | 'register'>('login');
  const [langOpen,   setLangOpen]   = useState(false);
  const [lang,       setLang]       = useState('RU');
  const [mobileOpen, setMobileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  function openModal(mode: 'login' | 'register') {
    setModalMode(mode);
    setModalOpen(true);
  }

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
                      {['RU', 'EN', 'KO'].map((l) => (
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

              {user ? (
                  <div className="flex items-center gap-3">
                <span className="text-sm text-[#21393B] hidden sm:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                    <button
                        onClick={() => signOut(auth)}
                        className="px-4 py-2 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] transition-colors"
                    >
                      Выйти
                    </button>
                  </div>
              ) : (
                  <>
                    <button
                        onClick={() => openModal('login')}
                        className="flex items-center gap-[4px] px-3 py-1 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] transition-colors"
                    >
                      <img src="/icons/sign_in.svg" alt="" className="h-4 w-4" />
                      Войти
                    </button>
                    <button
                        onClick={() => openModal('register')}
                        className="flex items-center gap-[4px] px-4 py-1 rounded-xl border border-[#6B8B80] text-[#21393B] text-sm font-medium bg-[#DAE3E8] transition-colors"
                    >
                      <img src="/icons/sign_up.svg" alt="" className="h-4 w-4" />
                      Регистрация
                    </button>
                  </>
              )}

              {/* Кнопка консультации */}
              <Link
                  href="/quiz"
                  className="flex items-center gap-2 px-4 py-1 rounded-xl border border-[#F7FAE8] bg-[#46888D] text-[#F7FAE8] text-sm font-medium hover:bg-[#5a7a6f] transition-colors whitespace-nowrap"
              >
                <img src="/icons/Chat.svg" alt="" className="h-4 w-4" />
                Бесплатная консультация по ИИ
              </Link>
            </div>

            {/* Гамбургер — мобилка и планшет */}
            <button
                className="lg:hidden ml-auto flex flex-col justify-center gap-[5px] p-2"
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
        {mobileOpen && (
            <div className="lg:hidden fixed inset-0 top-[76px] z-30 bg-white overflow-y-auto">
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
                      <div className="h-5 w-5 rounded bg-gray-200 shrink-0" />
                      {n.label}
                    </Link>
                ))}

                <div className="h-px bg-gray-100 my-3" />

                {/* Выбор языка */}
                <p className="text-[13px] font-medium text-[#21393B] px-3 mb-2">Язык</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: 'RU', label: 'Русский' },
                    { code: 'EN', label: 'English' },
                    { code: 'KO', label: '한국어'   },
                  ].map((l) => (
                      <button
                          key={l.code}
                          onClick={() => setLang(l.code)}
                          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] transition-colors border
                    ${lang === l.code
                              ? 'border-[#6b8b80] bg-[#6b8b8015] text-[#4C6D7C] font-medium'
                              : 'border-gray-100 bg-gray-50 text-[#21393B]'
                          }`}
                      >
                        {/* ФЛАГ: <img src={`/icons/flags/${l.code.toLowerCase()}.svg`} className="h-4 w-5 rounded-sm" /> */}
                        <div className="h-4 w-5 rounded-sm bg-gray-300 shrink-0" />
                        {l.label}
                      </button>
                  ))}
                </div>

                <div className="h-px bg-gray-100 my-3" />

                {/* Войти / Выйти */}
                {user ? (
                    <button
                        onClick={() => signOut(auth)}
                        className="flex items-center gap-3 px-3 py-4 rounded-xl text-[16px] text-[#21393B] hover:bg-gray-50 transition-colors"
                    >
                      Выйти
                    </button>
                ) : (
                    <button
                        onClick={() => { openModal('login'); setMobileOpen(false); }}
                        className="flex items-center gap-4 px-3 py-4 rounded-xl text-[16px] text-[#21393B] hover:bg-gray-50 transition-colors"
                    >
                      {/* ИКОНКА: <img src="/icons/sign_in.svg" className="h-5 w-5" /> */}
                      <div className="h-5 w-5 rounded bg-gray-200 shrink-0" />
                      Войти
                    </button>
                )}

                {/* CTA */}
                <Link
                    href="/quiz"
                    onClick={() => setMobileOpen(false)}
                    className="mt-3 w-full py-4 rounded-2xl text-center text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#21393B' }}
                >
                  Бесплатная консультация ИИ
                </Link>

              </div>
            </div>
        )}

        <AuthModal
            isOpen={modalOpen}
            initialMode={modalMode}
            onClose={() => setModalOpen(false)}
        />
      </>
  );
}