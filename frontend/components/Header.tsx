'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const NAV = [
  { label: 'Главная',  href: '/' },
  { label: 'Клиники',  href: '/hospitals' },
  { label: 'Подбор',   href: '/quiz' },
  { label: 'Консультация', href: '/consult' },
];

export default function Header() {
  const { user } = useAuth();
  const pathname  = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <Link href="/" className="font-bold text-teal-600 text-lg tracking-tight">
            Smart K-Medi
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${pathname === n.href ? 'bg-teal-50 text-teal-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut(auth)}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
