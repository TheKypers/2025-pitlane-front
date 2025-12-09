"use client";

import { Card } from "@/components/ui/card";
import { ChefHat, Clock, User, Users, Hexagon } from "lucide-react";
import { DEFAULTS } from "./constants";
import { useKorvenCheck } from "./hooks/useKorvenCheck";
import { DietaryBadge, CalorieSemaphore, type SemaphoreStatus } from "@/components/alerts";

interface MealFood {
  food: {
    FoodID: number;
    name: string;
    svgLink?: string;
    kCal: number;
  };
  quantity: number;
}

interface DietaryFitness {
  isFit: boolean;
  conflicts?: Array<{
    foodName: string;
    conflicts: Array<{
      id: number;
      name: string;
    }>;
  }>;
}

interface Meal {
  MealID: number;
  name: string;
  description?: string;
  preparationTime?: number;
  servings?: number;
  createdAt: string;
  updatedAt: string;
  profileId: string;
  profile: {
    username?: string;
    id: string;
    role: string;
  };
  mealFoods: MealFood[];
  dietaryFitness?: DietaryFitness;
  calorieStatus?: SemaphoreStatus;
  totalKcal?: number;
}

interface MealCardProps {
  meal: Meal;
  onClick?: (meal: Meal) => void;
  showExtendedInfo?: boolean;
  maxFoodsToShow?: number;
  className?: string;
  showAlerts?: boolean; // Show dietary and calorie alerts
}

export function MealCard({ 
  meal, 
  onClick, 
  showExtendedInfo = true,
  maxFoodsToShow = DEFAULTS.MAX_FOODS_TO_SHOW,
  className = "",
  showAlerts = false
}: MealCardProps) {
  const { isKorvenInspiredMeal } = useKorvenCheck();
  const isKorven = isKorvenInspiredMeal(meal.name);

  const handleClick = () => {
    if (onClick) {
      onClick(meal);
    }
  };

  const totalFoods = meal.mealFoods?.length || 0;
  const foodsToShow = meal.mealFoods?.slice(0, maxFoodsToShow) || [];
  const remainingFoods = Math.max(0, totalFoods - maxFoodsToShow);

  // Calculate total calories if not provided
  const totalKcal = meal.totalKcal || (meal.mealFoods?.reduce((sum, mf) => 
    sum + (mf.food.kCal * mf.quantity), 0) || 0);

  return (
    <Card
      className={`bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-amber-200 mb-1 line-clamp-1">
              {meal.name}
            </h3>
            {isKorven && (
              <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                <Hexagon className="w-3 h-3 fill-amber-400/30" />
                Korven
              </span>
            )}
          </div>
          <div className="flex items-center text-xs text-gray-400 ml-2">
            <User className="h-3 w-3 mr-1" />
            <span className="capitalize">{meal.profile.role}</span>
          </div>
        </div>
        
        {/* Alerts Section */}
        {showAlerts && (meal.dietaryFitness || meal.calorieStatus) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {meal.dietaryFitness && (
              <DietaryBadge isFit={meal.dietaryFitness.isFit} compact />
            )}
            {meal.calorieStatus && (
              <CalorieSemaphore 
                status={meal.calorieStatus} 
                calories={totalKcal}
                size="sm"
              />
            )}
          </div>
        )}
        
        {/* Description */}
        {meal.description && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {meal.description}
          </p>
        )}
        
        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3 flex-wrap">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{new Date(meal.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <ChefHat className="h-3 w-3 mr-1" />
            <span>{totalFoods} food{totalFoods !== 1 ? 's' : ''}</span>
          </div>
          {showExtendedInfo && meal.preparationTime && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>{meal.preparationTime} min</span>
            </div>
          )}
          {showExtendedInfo && meal.servings && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              <span>{meal.servings} serving{meal.servings !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Created by */}
        <div className="text-xs text-gray-400 mb-3">
          <span>Created by: </span>
          <span className="font-medium">{meal.profile.username || 'Anonymous'}</span>
        </div>

        {/* Foods in meal */}
        {totalFoods > 0 && (
          <div className="border-t border-amber-700/30 pt-3">
            <div className="text-xs text-gray-400 mb-2">Foods:</div>
            <div className="flex flex-wrap gap-1">
              {foodsToShow.map((mealFood) => (
                <span
                  key={mealFood.food.FoodID}
                  className="bg-amber-700/30 text-amber-200 px-2 py-1 rounded text-xs"
                >
                  {mealFood.food.name}
                  {mealFood.quantity > 1 && (
                    <span className="ml-1 text-amber-300/70">
                      ×{mealFood.quantity}
                    </span>
                  )}
                </span>
              ))}
              {remainingFoods > 0 && (
                <span className="bg-amber-700/20 text-amber-300 px-2 py-1 rounded text-xs">
                  +{remainingFoods} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default MealCard;