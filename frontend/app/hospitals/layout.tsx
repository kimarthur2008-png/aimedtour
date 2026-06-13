import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Клиники — KoreaMedTour' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
