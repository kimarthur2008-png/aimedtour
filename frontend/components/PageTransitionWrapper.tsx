'use client';

import { useNavigation } from '@/context/NavigationContext';

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { isNavigating, isFadingOut } = useNavigation();

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        opacity:    isFadingOut || isNavigating ? 0 : 1,
        transition: isFadingOut ? 'opacity 0.25s ease-in-out' : 'none',
      }}
    >
      {children}
    </div>
  );
}
