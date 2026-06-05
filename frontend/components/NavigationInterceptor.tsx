'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function NavigationInterceptor() {
  const router = useRouter();
  const pathname = usePathname();

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

      // Абсолютно тот же URL — скролл вверх
      if (hrefFull === currentFull) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Тот же путь но другой query (напр. /auth → /auth?tab=register)
      // ИЛИ мы уже на странице /auth — без анимации, просто push
      if (hrefPath === pathname || pathname.startsWith('/auth')) {
        e.preventDefault();
        router.push(href);
        return;
      }

      e.preventDefault();

      // View Transitions API — настоящий cross dissolve (Chrome 111+, Safari 18+)
      if ('startViewTransition' in document) {
        (document as any).startViewTransition(() => router.push(href));
      } else {
        // Fallback для старых браузеров — последовательный fade
        const doc = document as Document;
        doc.documentElement.classList.add('page-leaving');
        setTimeout(() => {
          doc.documentElement.classList.remove('page-leaving');
          router.push(href);
        }, 300);
      }
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [router, pathname]);

  return null;
}
