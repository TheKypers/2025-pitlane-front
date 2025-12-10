'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { CalorieSemaphore } from '@/components/alerts';
import { useCalorieProgress } from '@/lib/hooks/useKcalProgress';

interface MealFood {
  foodId: number;
  foodName: string;
  quantity: number; // Units of food (not grams)
  svgLink?: string;
  kCal: number; // kcal per unit
}

interface Meal {
  mealId: number;
  name: string;
  description?: string;
  mealFoods: MealFood[];
  totalCalories: number;
}

export interface PortionData {
  mode: 'percentage';
  portionFraction: number; // Calculated from food portions
  foodPortions: Array<{
    foodId: number;
    portionFraction: number;
    absoluteQuantity?: number;
  }>;
  totalCalories: number;
}

interface MealPortionSelectorProps {
  meal: Meal;
  onConfirm: (portionData: PortionData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function MealPortionSelector({
  meal,
  onConfirm,
  onCancel,
  loading = false
}: MealPortionSelectorProps) {
  const { progress } = useCalorieProgress();
  
  console.log('[MealPortionSelector] Initialized with meal:', {
    mealId: meal.mealId,
    name: meal.name,
    totalCalories: meal.totalCalories,
    mealFoodsCount: meal.mealFoods.length,
    mealFoods: meal.mealFoods.map(f => ({
      foodId: f.foodId,
      name: f.foodName,
      quantity: f.quantity,
      kCal: f.kCal
    }))
  });
  
  // Per-food portions - initialize with full portions (100%)
  const [foodPortions, setFoodPortions] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    meal.mealFoods.forEach(food => {
      initial[food.foodId] = food.quantity; // Start with full quantity
    });
    return initial;
  });

  // Input values for manual editing (separate from actual portions)
  const [inputValues, setInputValues] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    meal.mealFoods.forEach(food => {
      initial[food.foodId] = food.quantity.toString();
    });
    return initial;
  });

  const handleFoodPortionChange = (foodId: number, value: string) => {
    const food = meal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;

    // Allow empty input for better UX
    if (value === '') {
      setInputValues(prev => ({
        ...prev,
        [foodId]: value
      }));
      setFoodPortions(prev => ({
        ...prev,
        [foodId]: 0
      }));
      return;
    }

    const newValue = parseFloat(value);

    // If not a valid number, don't update
    if (isNaN(newValue)) {
      return;
    }

    // Clamp between 0 and max quantity defined in meal
    const clamped = Math.max(0, Math.min(food.quantity, newValue));

    // Only update if the clamped value is different (prevents unnecessary updates)
    if (clamped !== newValue) {
      // If user tried to enter a value above the limit, set to max
      setInputValues(prev => ({
        ...prev,
        [foodId]: clamped.toString()
      }));
    } else {
      // Valid value, update input
      setInputValues(prev => ({
        ...prev,
        [foodId]: value
      }));
    }

    setFoodPortions(prev => ({
      ...prev,
      [foodId]: clamped
    }));
  };

  const handleIncrementFoodPortion = (foodId: number) => {
    const food = meal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;

    const current = foodPortions[foodId] ?? food.quantity;
    const increment = food.quantity / 8; // 1/8 increment
    const newValue = Math.min(food.quantity, current + increment); // Cannot exceed meal quantity

    setFoodPortions(prev => ({
      ...prev,
      [foodId]: newValue
    }));

    setInputValues(prev => ({
      ...prev,
      [foodId]: newValue.toString()
    }));
  };

  const handleDecrementFoodPortion = (foodId: number) => {
    const food = meal.mealFoods.find(f => f.foodId === foodId);
    if (!food) return;

    const current = foodPortions[foodId] ?? food.quantity;
    const decrement = food.quantity / 8; // 1/8 decrement
    const newValue = Math.max(0, current - decrement);

    setFoodPortions(prev => ({
      ...prev,
      [foodId]: newValue
    }));

    setInputValues(prev => ({
      ...prev,
      [foodId]: newValue.toString()
    }));
  };

  const calculateCalories = (): number => {
    return meal.mealFoods.reduce((total, food) => {
      const consumedQuantity = foodPortions[food.foodId] ?? food.quantity;
      // Each unit of food has kCal calories
      return total + (food.kCal * consumedQuantity);
    }, 0);
  };

  const calculateMealPortionFraction = (): number => {
    // Calculate overall meal portion fraction (weighted average by calories)
    const totalConsumedCalories = calculateCalories();
    return totalConsumedCalories / meal.totalCalories;
  };

  const handleConfirmClick = () => {
    // Calculate portion fractions for each food
    const portionDataArray = meal.mealFoods.map(food => {
      const consumedQuantity = foodPortions[food.foodId] ?? food.quantity;
      return {
        foodId: food.foodId,
        portionFraction: consumedQuantity / food.quantity,
        absoluteQuantity: consumedQuantity
      };
    });

    const portionData = {
      mode: 'percentage' as const,
      portionFraction: calculateMealPortionFraction(),
      foodPortions: portionDataArray,
      totalCalories: calculateCalories()
    };
    
    onConfirm(portionData);
  };

  // Format quantity for display (eighths fractions)
  const formatQuantity = (quantity: number): string => {
    if (quantity % 1 === 0) {
      return quantity.toString();
    }
    // Check if it's a common fraction
    const eighths = Math.round(quantity * 8);
    if (Math.abs(quantity - eighths / 8) < 0.001) {
      const whole = Math.floor(quantity);
      const remainder = eighths - (whole * 8);
      if (whole > 0 && remainder > 0) {
        return `${whole} ${remainder}/8`;
      } else if (remainder > 0) {
        return `${remainder}/8`;
      }
      return whole.toString();
    }
    return quantity.toFixed(2);
  };

  const totalCalories = calculateCalories();
  const mealPortionPercentage = (calculateMealPortionFraction() * 100).toFixed(0);

  // Calculate calorie semaphore status
  const calculateSemaphoreStatus = (): 'green' | 'yellow' | 'red' => {
    const dailyGoal = progress?.goal || 2000;
    
    const mealThreshold = dailyGoal / 3;
    const redThreshold = (dailyGoal * 4) / 3;
    
    if (totalCalories <= mealThreshold) return 'green';
    if (totalCalories > redThreshold) return 'red';
    return 'yellow';
  };

  return (
    <div className="space-y-6">
      {/* Meal Portion Summary */}
      <div className="bg-amber-900/20 border border-amber-700/50 p-4 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span className="font-semibold text-amber-200">Total Meal Portion</span>
            <span className="text-xs text-neutral-400">(Auto-calculated)</span>
          </div>
          <span className="text-2xl font-bold text-amber-400">{mealPortionPercentage}%</span>
        </div>
        <div className="flex justify-between items-center text-sm text-neutral-300 pt-2 border-t border-amber-700/30">
          <span>Total Calories</span>
          <span className="font-medium">
            <span className="text-amber-400 font-bold">{totalCalories.toFixed(0)}</span>
            <span className="text-neutral-500"> / {meal.totalCalories}</span>
            <span className="text-neutral-400"> kcal</span>
          </span>
        </div>
        
        {/* Calorie Semaphore */}
        {progress?.goal && (
          <div className="pt-2 border-t border-amber-700/30">
            <p className="text-xs text-gray-400 font-medium mb-2">Calorie Impact:</p>
            <CalorieSemaphore 
              status={calculateSemaphoreStatus()}
              calories={Math.round(totalCalories)}
              size="md"
              showLabel={true}
            />
          </div>
        )}
      </div>

      {/* Food List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-amber-200">Customize Food Portions</h4>
          <div className="flex-grow h-px bg-neutral-700"></div>
        </div>
        
        {meal.mealFoods.map((food) => {
          const currentQuantity = foodPortions[food.foodId] ?? food.quantity;
          const portionPercentage = ((currentQuantity / food.quantity) * 100).toFixed(0);

          return (
            <div
              key={food.foodId}
              className="flex items-center gap-3 p-3 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-amber-700/50 transition-colors"
            >
              {/* Food Image */}
              {food.svgLink && (
                <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-neutral-900 border border-neutral-700">
                  <Image
                    src={food.svgLink}
                    alt={food.foodName}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              )}

              {/* Food Info */}
              <div className="flex-grow min-w-0">
                <div className="font-medium text-neutral-200 truncate">{food.foodName}</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {food.kCal} kcal per unit • Max: {food.quantity} units
                </div>
              </div>

              {/* Portion Controls */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecrementFoodPortion(food.foodId)}
                  disabled={loading || currentQuantity === 0}
                  className="h-8 w-8 p-0 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 hover:border-amber-600 text-neutral-200"
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <div className="flex flex-col items-center min-w-[90px]">
                  <input
                    type="number"
                    value={inputValues[food.foodId] ?? currentQuantity.toString()}
                    onChange={(e) => handleFoodPortionChange(food.foodId, e.target.value)}
                    className="w-20 px-2 py-1 text-center bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-200 focus:ring-1 focus:ring-amber-600 focus:border-amber-600"
                    step="0.001"
                    min="0"
                    max={food.quantity}
                    disabled={loading}
                  />
                  <div className="mt-1 text-center">
                    <span className="text-xs font-semibold text-amber-400">{portionPercentage}%</span>
                    <span className="text-xs text-neutral-500 mx-1">•</span>
                    <span className="text-xs text-neutral-400">{formatQuantity(currentQuantity)}u</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleIncrementFoodPortion(food.foodId)}
                  disabled={loading || currentQuantity >= food.quantity}
                  className="h-8 w-8 p-0 bg-neutral-700 border-neutral-600 hover:bg-neutral-600 hover:border-amber-600 text-neutral-200"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-neutral-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-200"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirmClick}
          disabled={loading}
          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
        >
          {loading ? 'Confirming...' : 'Confirm Selection'}
        </Button>
      </div>
    </div>
  );
}
