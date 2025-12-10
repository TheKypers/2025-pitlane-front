"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function PreventBackNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // Only apply this on auth pages
    if (!pathname.startsWith('/auth/')) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent backspace from navigating back when not in an input field
      if (event.key === 'Backspace') {
        const target = event.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.contentEditable === 'true';
        
        if (!isInputField) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // Prevent back navigation on auth pages
      if (pathname.startsWith('/auth/')) {
        event.preventDefault();
        window.history.pushState(null, '', pathname);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('popstate', handlePopState);

    // Push current state to prevent back navigation
    window.history.pushState(null, '', pathname);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname]);

  return null;
}