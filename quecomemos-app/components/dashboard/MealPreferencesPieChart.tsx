'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';
import { useUser } from '@/lib/contexts/UserContext';

interface PreferenceData {
  name: string;
  count: number;
  percentage: number;
  color: string;
  visible: boolean;

}

interface Consumption {
  ConsumptionID: number;
  name: string;
  description?: string;
  consumedAt: string;
  consumptionMeals: {
    mealId: number;
    quantity: number;
    meal: {
      MealID: number;
      name: string;
      mealFoods: {
        foodId: number;
        quantity: number;
        food: {
          FoodID: number;
          name: string;
          preferences: {
            PreferenceID: number;
            name: string;
          }[];
        };
      }[];
    };
  }[];
}

// Color palette for the pie chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90',
  '#ffa07a', '#20b2aa', '#87cefa', '#ffd700', '#daa520'
];

export default function MealPreferencesPieChart() {
  const { userData } = useUser();
  const profile = userData.profile;
  
  const [preferencesData, setPreferencesData] = useState<PreferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibilityState, setVisibilityState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchMealPreferences = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get session for auth
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No authenticated session');
        }

        // Fetch user's consumption history
        const consumptionResponse = await fetch(`${API_BASE_URL}/meal-consumptions/user/${profile.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!consumptionResponse.ok) {
          throw new Error('Failed to fetch consumption history');
        }

        const consumptions: Consumption[] = await consumptionResponse.json();
        console.log('Fetched consumptions:', consumptions);

        // Track preference occurrences
        const preferenceCount = new Map<number, { name: string; count: number }>();

        consumptions.forEach(consumption => {
          consumption.consumptionMeals?.forEach(consumptionMeal => {
            const meal = consumptionMeal.meal;
            if (meal?.mealFoods) {
              // Collect unique preferences for this meal
              const mealPreferences = new Map<number, string>();
              
              meal.mealFoods.forEach(mealFood => {
                const food = mealFood.food;
                if (food?.preferences) {
                  food.preferences.forEach(preference => {
                    // Only add unique preferences per meal
                    mealPreferences.set(preference.PreferenceID, preference.name);
                  });
                }
              });

              // Count each unique preference in this meal (considering consumption quantity)
              mealPreferences.forEach((name, preferenceId) => {
                const existing = preferenceCount.get(preferenceId);
                if (existing) {
                  existing.count += consumptionMeal.quantity;
                } else {
                  preferenceCount.set(preferenceId, {
                    name: name,
                    count: consumptionMeal.quantity
                  });
                }
              });
            }
          });
        });

        // Calculate total and percentages
        const totalCount = Array.from(preferenceCount.values()).reduce((sum, item) => sum + item.count, 0);

        if (totalCount === 0) {
          setPreferencesData([]);
          setLoading(false);
          return;
        }

        // Convert to chart data
        const chartData: PreferenceData[] = Array.from(preferenceCount.entries()).map(([, data], index) => ({
          name: data.name,
          count: data.count,
          percentage: Math.round((data.count / totalCount) * 100),
          color: COLORS[index % COLORS.length],
          visible: true,
        }));

        // Sort by count descending
        chartData.sort((a, b) => b.count - a.count);

        setPreferencesData(chartData);

        // Initialize visibility state
        const initialVisibility = chartData.reduce((acc, item) => {
          acc[item.name] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setVisibilityState(initialVisibility);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meal preferences data');
      } finally {
        setLoading(false);
      }
    };

    fetchMealPreferences();
  }, [profile?.id]);

  const togglePreferenceVisibility = (preferenceName: string) => {
    setVisibilityState(prev => ({
      ...prev,
      [preferenceName]: !prev[preferenceName]
    }));
  };

  const toggleAllVisibility = () => {
    const allVisible = Object.values(visibilityState).every(visible => visible);
    const newState = preferencesData.reduce((acc, item) => {
      acc[item.name] = !allVisible;
      return acc;
    }, {} as Record<string, boolean>);
    setVisibilityState(newState);
  };

  // Calculate data for visible preferences only and recalculate percentages
  const getVisibleData = () => {
    const visibleItems = preferencesData.filter(item => visibilityState[item.name]);
    const visibleTotal = visibleItems.reduce((sum, item) => sum + item.count, 0);
    
    if (visibleTotal === 0) return [];

    return visibleItems.map(item => ({
      ...item,
      percentage: Math.round((item.count / visibleTotal) * 100)
    }));
  };

  const visibleData = getVisibleData();

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: PreferenceData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} meal{data.count !== 1 ? 's' : ''} consumed ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string; payload: PreferenceData }> }) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.value} ({entry.payload.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Meal Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading meal preferences...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Meal Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (preferencesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Meal Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No meal consumption history found</p>
              <p className="text-xs text-muted-foreground mt-1">Start consuming some meals to see preference distribution</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          Meal Preferences Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analysis of preferences in your consumed meals
        </p>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Preference Visibility</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllVisibility}
              className="text-xs"
            >
              {Object.values(visibilityState).every(visible => visible) ? (
                <>
                  <EyeOff className="w-3 h-3 mr-1" />
                  Hide All
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  Show All
                </>
              )}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {preferencesData.map((preference, index) => (
              <div key={preference.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`preference-${index}`}
                  checked={visibilityState[preference.name] || false}
                  onCheckedChange={() => togglePreferenceVisibility(preference.name)}
                />
                <label
                  htmlFor={`preference-${index}`}
                  className="text-xs cursor-pointer flex items-center space-x-1"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: preference.color }}
                  />
                  <span className="truncate">{preference.name}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        {visibleData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visibleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {visibleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <EyeOff className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All preferences are hidden</p>
              <p className="text-xs text-muted-foreground mt-1">Enable some preferences to view the chart</p>
            </div>
          </div>
        )}
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">{preferencesData.length}</p>
            <p className="text-muted-foreground">Total preferences</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">{visibleData.length}</p>
            <p className="text-muted-foreground">Visible preferences</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">
              {visibleData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-muted-foreground">Meals consumed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}