import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';
import { NavigationProvider } from '@/context/NavigationContext';
import HeaderWrapper from '@/components/HeaderWrapper';
import FooterWrapper from '@/components/FooterWrapper';
import LanguageBlurWrapper from '@/components/LanguageBlurWrapper';
import NavigationInterceptor from '@/components/NavigationInterceptor';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import FloatingChatWidget from '@/components/FloatingChatWidget';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'KoreaMedTour — Медицинский туризм в Корею',
  description: 'Подбор корейских клиник и запись на консультацию',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50">
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <NavigationProvider>
                <NavigationInterceptor />
                <FloatingChatWidget />
                <LanguageBlurWrapper>
                  <PageTransitionWrapper>
                    <HeaderWrapper />
                    <main className="flex-1">{children}</main>
                    <FooterWrapper />
                  </PageTransitionWrapper>
                </LanguageBlurWrapper>
              </NavigationProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
