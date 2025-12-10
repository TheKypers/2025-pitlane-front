'use client';

import React from 'react';
import { Meal } from '@/lib/contexts/MealsContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UtensilsCrossed, Flame } from 'lucide-react';

interface MealCompositionProps {
  meal: Meal;
  className?: string;
}

export function MealComposition({ meal, className = "" }: MealCompositionProps) {
  const calculateTotalCalories = () => {
    return meal.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
  };

  const getPreferenceNames = (preferences: { name?: string; PreferenceID?: number }[] | number[] | undefined) => {
    if (!preferences) return [];
    return preferences.map(p => typeof p === 'object' ? p.name || 'Unknown' : 'Preference');
  };

  const totalCalories = calculateTotalCalories();

  return (
    <Card className={`bg-amber-900/20 border-amber-700/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-200">
          <UtensilsCrossed className="w-5 h-5" />
          Meal Composition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Meal Overview */}
        <div className="flex items-center justify-between p-3 bg-amber-800/20 rounded-lg">
          <div>
            <h3 className="font-semibold text-amber-100">{meal.name}</h3>
            {meal.description && (
              <p className="text-sm text-gray-400 mt-1">{meal.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-amber-200">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-lg">{totalCalories}</span>
              <span className="text-sm">kcal</span>
            </div>
            <p className="text-xs text-gray-400">{meal.mealFoods.length} ingredients</p>
          </div>
        </div>

        {/* Food Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-200 mb-3">Ingredients Breakdown:</h4>
          {meal.mealFoods.map((mealFood, index) => {
            const food = mealFood.food;
            const individualCalories = food.kCal * mealFood.quantity;
            const preferences = getPreferenceNames(food.preferences);

            return (
              <div key={index} className="flex items-center justify-between p-2 bg-neutral-800/50 rounded border border-amber-700/30">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-amber-100">{food.name}</span>
                    <span className="text-gray-400 text-sm">× {mealFood.quantity}</span>
                  </div>
                  
                  {/* Food Preferences */}
                  {preferences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preferences.map((pref, prefIndex) => (
                        <Badge 
                          key={prefIndex} 
                          variant="secondary" 
                          className="text-xs bg-amber-800/40 text-amber-200 border-amber-600/50"
                        >
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-amber-300">
                    <Flame className="w-3 h-3" />
                    <span className="font-medium">{individualCalories}</span>
                    <span className="text-xs">kcal</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {food.kCal} kcal/unit
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="border-t border-amber-700/30 pt-3 mt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-400">Total Ingredients</div>
              <div className="text-lg font-bold text-amber-200">{meal.mealFoods.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Calories</div>
              <div className="text-lg font-bold text-amber-200">{totalCalories} kcal</div>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-amber-700/30">
          <span>Created by </span>
          <span className="text-amber-300 font-medium">{meal.profile?.username || 'Unknown'}</span>
        </div>
      </CardContent>
    </Card>
  );
}