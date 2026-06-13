import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Вопросы и ответы — KoreaMedTour' };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
