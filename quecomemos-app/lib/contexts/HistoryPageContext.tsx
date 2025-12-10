'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface HistoryPageContextType {
  calorieGoal: number;
  setCalorieGoal: (goal: number) => void;
}

const HistoryPageContext = createContext<HistoryPageContextType | undefined>(undefined);

export function HistoryPageProvider({ children }: { children: React.ReactNode }) {
  const [calorieGoal, setCalorieGoalState] = useState(2000);

  const setCalorieGoal = useCallback((goal: number) => {
    setCalorieGoalState(goal);
  }, []);

  return (
    <HistoryPageContext.Provider value={{ calorieGoal, setCalorieGoal }}>
      {children}
    </HistoryPageContext.Provider>
  );
}

export function useHistoryPageContext() {
  const context = useContext(HistoryPageContext);
  if (context === undefined) {
    throw new Error('useHistoryPageContext must be used within a HistoryPageProvider');
  }
  return context;
}
