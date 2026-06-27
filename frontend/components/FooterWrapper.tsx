'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
    const pathname = usePathname();
    if (pathname.startsWith('/auth') || pathname.startsWith('/quiz') || pathname.startsWith('/chat')) return null;
    return <Footer />;
}