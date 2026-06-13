'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface NavigationContextType {
  isNavigating:  boolean;
  isFadingOut:   boolean;
  startFadeOut:    () => void;
  startNavigation: () => void;
  endNavigation:   () => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating:    false,
  isFadingOut:     false,
  startFadeOut:    () => {},
  startNavigation: () => {},
  endNavigation:   () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [isFadingOut,  setIsFadingOut]  = useState(false);

  const startFadeOut    = useCallback(() => setIsFadingOut(true),   []);
  const startNavigation = useCallback(() => { setIsFadingOut(false); setIsNavigating(true); }, []);
  const endNavigation   = useCallback(() => setIsNavigating(false), []);

  return (
    <NavigationContext.Provider value={{ isNavigating, isFadingOut, startFadeOut, startNavigation, endNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
