import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Клиника — KoreaMedTour' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
