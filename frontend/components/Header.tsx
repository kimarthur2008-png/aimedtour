'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const NAV = [
  { label: 'Главная',              href: '/',          width: 'w-[100px]', height: 'h-[52px]' },
  { label: 'Отзывы пациентов',     href: '/reviews',   width: 'w-[100px]', height: 'h-[52px]' },
  { label: 'Партнерские больницы', href: '/hospitals', width: 'w-[100px]', height: 'h-[52px]' },
  { label: 'Туризм и путешествия', href: '/trip',      width: 'w-[100px]', height: 'h-[52px]' },
  { label: 'О нас',                href: '/about',     width: 'w-[80px]',  height: 'h-[52px]' },
];

export default function Header() {
  const { user } = useAuth();
  const pathname  = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [langOpen, setLangOpen]   = useState(false);
  const [lang, setLang]           = useState('RU');
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-[75px] flex items-center justify-between gap-6">
          <Link href="/" className="h-8 w-auto">
            <img src="/logo.svg" alt="Smart K-Medi Logo" className="h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`${n.width} px-2 py-1.5 rounded-lg text-sm font-medium transition-colors text-center transistion-all duration-250
                ${pathname === n.href ? 'bg-[#ffffff8c] text-[#618075] ' : 'text-[#21393B] hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {/* Язык */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 text-sm text-[#21393B] hover:text-gray-900  hover:bg-gray-50 px-2 py-1 rounded-full transition-colors"
            >
              <img src="/icons/language.svg" alt="lan" className="h-4 w-auto" />
              <span>{lang}</span>
              <span className={`transition-transform duration-250 ${langOpen ? 'rotate-180' : 'rotate-0'}`}><img src="/icons/down-arrow.png" alt="" className="h-4 w-auto" /></span>
            </button>

            {langOpen && (
            <div className="absolute top-8 left-0 bg-white border border-gray-100 rounded-xl shadow-md py-1 z-50 min-w-[80px]">
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
                <span className="text-sm text-gray-800 hidden sm:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1 rounded-full border border-black opacity-80 text-[#21393B] text-sm font-medium transition-colors hover:bg-gray-50 flex items-center gap-2"
                >
                  Мой профиль
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-1 rounded-full border border-black opacity-80 text-[#21393B] text-sm font-medium transition-colors hover:bg-gray-50 flex items-center gap-2"
              >
                <img src="/icons/avatar.svg" alt="" className="h-4 w-4" />
                Войти
              </button>
            )}

            <Link
              href="/quiz"
              className="px-4 py-2 rounded-full bg-[#6b8b80] text-white text-sm font-medium hover:bg-teal-700 transition-colors  whitespace-nowrap"
            >
              Бесплатная консультация по ИИ
            </Link>
          </div>
        </div>
      </header>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
