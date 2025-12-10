'use client';

import React, { createContext, useContext, useCallback } from 'react';

interface CalorieProgressContextType {
  triggerRefresh: () => void;
  registerRefreshCallback: (callback: () => void) => () => void;
}

const CalorieProgressContext = createContext<CalorieProgressContextType | undefined>(undefined);

interface CalorieProgressProviderProps {
  children: React.ReactNode;
}

export function CalorieProgressProvider({ children }: CalorieProgressProviderProps) {
  const refreshCallbacks = React.useRef<Set<() => void>>(new Set());

  const triggerRefresh = useCallback(() => {
    // Call all registered refresh callbacks
    refreshCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in calorie progress refresh callback:', error);
      }
    });
  }, []);

  const registerRefreshCallback = useCallback((callback: () => void) => {
    refreshCallbacks.current.add(callback);
    
    // Return unregister function
    return () => {
      refreshCallbacks.current.delete(callback);
    };
  }, []);

  const value: CalorieProgressContextType = {
    triggerRefresh,
    registerRefreshCallback
  };

  return (
    <CalorieProgressContext.Provider value={value}>
      {children}
    </CalorieProgressContext.Provider>
  );
}

export function useCalorieProgressContext() {
  const context = useContext(CalorieProgressContext);
  if (context === undefined) {
    throw new Error('useCalorieProgressContext must be used within a CalorieProgressProvider');
  }
  return context;
}

// Hook for easier usage - automatically registers and unregisters the callback
export function useCalorieProgressRefresh(onRefresh: () => void) {
  const { registerRefreshCallback } = useCalorieProgressContext();
  
  React.useEffect(() => {
    const unregister = registerRefreshCallback(onRefresh);
    return unregister;
  }, [registerRefreshCallback, onRefresh]);
}