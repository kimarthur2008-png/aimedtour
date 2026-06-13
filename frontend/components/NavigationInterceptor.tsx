'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigation } from '@/context/NavigationContext';

export default function NavigationInterceptor() {
  const router   = useRouter();
  const pathname = usePathname();
  const { isNavigating, startFadeOut, startNavigation, endNavigation } = useNavigation();
  const prevPath  = useRef(pathname);
  const startedAt = useRef<number>(0);
  const MIN_MS = 2200;

  // Блокировка скролла и пауза CSS-анимаций во время навигации
  useEffect(() => {
    if (isNavigating) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('is-navigating');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('is-navigating');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('is-navigating');
    };
  }, [isNavigating]);

  // Pathname сменился → навигация завершена, но не раньше MIN_MS от старта
  useEffect(() => {
    if (pathname !== prevPath.current) {
      prevPath.current = pathname;
      const elapsed   = Date.now() - startedAt.current;
      const remaining = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => endNavigation(), remaining);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:') ||
        anchor.getAttribute('target') === '_blank'
      ) return;

      const hrefPath    = href.split('?')[0].split('#')[0];
      const hrefFull    = href.split('#')[0];
      const currentFull = pathname + window.location.search;

      if (hrefFull === currentFull) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (hrefPath === pathname || pathname.startsWith('/auth')) {
        e.preventDefault();
        router.push(href);
        return;
      }

      e.preventDefault();
      startedAt.current = Date.now();
      startFadeOut();
      setTimeout(() => startNavigation(), 250);
      setTimeout(() => router.push(href), 250 + 350);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [router, pathname]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          key="nav-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center"
          style={{ backgroundColor: '#F7FAE8' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1,    opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className="w-11 h-11 rounded-full border-[3px] animate-spin"
              style={{ borderColor: '#DAE3E8', borderTopColor: '#73907E' }}
            />
            <p className="text-sm font-medium" style={{ color: '#21393B', opacity: 0.6 }}>
              Загрузка...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
