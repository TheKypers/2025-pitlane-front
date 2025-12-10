'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCalorieProgressRefresh } from '@/lib/contexts/CalorieProgressContext';

interface ConsumptionItem {
  name: string;
  calories: number;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface CalorieProgress {
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
  consumptionHistory?: ConsumptionItem[];
}

export function useCalorieProgress(date?: Date) {
  const [progress, setProgress] = useState<CalorieProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const dateParam = date ? `?date=${date.toISOString()}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${user.id}/calorie-progress${dateParam}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch calorie progress');

      const data = await response.json();
      
      // Calcular remaining y percentage en el frontend
      const consumed = data.consumed || 0;
      const goal = data.goal || 2000;
      const remaining = Math.max(0, goal - consumed);
      const percentage = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
      
      setProgress({
        consumed,
        goal,
        remaining,
        percentage: Math.round(percentage * 100) / 100 // Redondear a 2 decimales
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Register this hook to refresh when meals are registered
  useCalorieProgressRefresh(fetchProgress);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateCalorieGoal = async (newGoal: number) => {
    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/${user.id}/calorie-goal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ calorieGoal: newGoal })
      });

      if (!response.ok) {
        throw new Error(`Failed to update calorie goal: ${response.status}`);
      }

      await response.json();

      await fetchProgress();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return { progress, loading, error, refetch: fetchProgress, updateCalorieGoal };
}