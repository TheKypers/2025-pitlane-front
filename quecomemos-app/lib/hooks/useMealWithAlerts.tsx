'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';

interface MealWithAlerts {
  MealID: number;
  name: string;
  description?: string;
  mealFoods: Array<{
    food: {
      FoodID: number;
      name: string;
      kCal: number;
    };
    quantity: number;
  }>;
  dietaryFitness?: {
    isFit: boolean;
    conflicts?: Array<{
      foodName: string;
      conflicts: Array<{
        id: number;
        name: string;
      }>;
    }>;
  };
  calorieStatus?: 'green' | 'yellow' | 'red';
  totalKcal?: number;
}

export function useMealWithAlerts(mealId: number) {
  const { userData } = useUser();
  const [meal, setMeal] = useState<MealWithAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMealWithAlerts = async () => {
      // Don't fetch if no meal selected or no user
      if (!mealId || mealId === 0 || !userData?.profile?.id) {
        setMeal(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/meals/${mealId}?profileId=${userData.profile.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch meal');
        }

        const data = await response.json();
        setMeal(data);
      } catch (err) {
        console.error('Error fetching meal with alerts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMealWithAlerts();
  }, [mealId, userData?.profile?.id]);

  return { meal, loading, error };
}
