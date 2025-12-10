"use client";

import { useEffect, useState } from "react";
import { X, ChefHat, Clock, Users, User, Utensils, Edit, Hexagon } from "lucide-react";
import Image from "next/image";
import { useUser } from "@/lib/contexts/UserContext";
import { useKorvenCheck } from "@/components/meal/hooks/useKorvenCheck";
import { UserNameWithBadge } from "@/components/common";

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
  mealFoods: {
    food: {
      FoodID: number;
      name: string;
      svgLink?: string;
      kCal: number;
      dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
      preferences?: { name?: string; PreferenceID?: number }[] | number[];
    };
    quantity: number;
  }[];
}

interface MealModalProps {
  meal: Meal | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (meal: Meal) => void;
}

export function MealModal({ meal, isOpen, onClose, onEdit }: MealModalProps) {
  const { userData } = useUser();
  const [isOwner, setIsOwner] = useState(false);
  const [expandedPrefs, setExpandedPrefs] = useState<Record<number, boolean>>({});
  const [expandedRestrs, setExpandedRestrs] = useState<Record<number, boolean>>({});
  const { isKorvenInspiredMeal, isKorvenInspiredFood } = useKorvenCheck();

  // Check if current user is the owner of the meal
  useEffect(() => {
    if (meal && userData?.profile) {
      setIsOwner(meal.profileId === userData.profile.id);
    }
  }, [meal, userData]);

  // Close modal with ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !meal) return null;

  // Calculate total calories
  const totalCalories = meal.mealFoods.reduce((total, mealFood) => {
    return total + (mealFood.food.kCal * mealFood.quantity);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-amber-800/30">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 rounded-t-2xl border-b border-amber-800/30 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100">Meal Details</h2>
            <div className="flex items-center gap-2">
              {/* Edit button for owner */}
              {isOwner && onEdit && (
                <button
                  onClick={() => onEdit(meal)}
                  className="p-2 hover:bg-amber-800/20 rounded-full transition-colors text-amber-300 hover:text-amber-200"
                  aria-label="Edit meal"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-amber-800/20 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-amber-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Meal Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <h3 className="text-2xl font-bold text-amber-100">{meal.name}</h3>
                {isKorvenInspiredMeal(meal.name) && (
                  <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Hexagon className="w-3 h-3 fill-amber-400/30" />
                    Korven
                  </span>
                )}
              </div>
              <div className="text-sm text-amber-300 bg-amber-800/30 px-3 py-1 rounded-full">
                {totalCalories} kCal total
              </div>
            </div>
            
            {meal.description && (
              <p className="text-gray-300 mb-4">{meal.description}</p>
            )}

            {/* Meal Info */}
            <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
              {meal.preparationTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{meal.preparationTime} min</span>
                </div>
              )}
              {meal.servings && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{meal.servings} serving{meal.servings !== 1 ? 's' : ''}</span>
                </div>
              )}
              {meal.createdAt && (
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>{new Date(meal.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4" />
              <span>Created by:</span>
              <UserNameWithBadge 
                username={meal.profile.username || 'Anonymous'}
                profileId={meal.profileId}
                badgeSize="sm"
                usernameClassName="text-sm"
              />
              <span className="capitalize bg-amber-800/20 px-2 py-1 rounded text-xs">
                {meal.profile.role}
              </span>
            </div>
          </div>

          {/* Foods Section */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-amber-100 mb-4 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
              Foods ({meal.mealFoods.length})
            </h4>
            
            {meal.mealFoods.length > 0 ? (
              <div className="space-y-3">
                {meal.mealFoods.map((mealFood, index) => (
                  <div 
                    key={index} 
                    className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                      {mealFood.food.svgLink ? (
                        <Image 
                          src={mealFood.food.svgLink} 
                          alt={mealFood.food.name} 
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain" 
                        />
                      ) : (
                        <Utensils className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-amber-200">{mealFood.food.name}</h5>
                          {isKorvenInspiredFood(mealFood.food.name) && (
                            <span className="text-xs bg-amber-600/50 text-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Hexagon className="w-2.5 h-2.5 fill-amber-400/30" />
                              Korven
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-amber-300">
                          {mealFood.food.kCal * mealFood.quantity} kCal
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        Quantity: {mealFood.quantity} • {mealFood.food.kCal} kCal per unit
                      </div>
                      
                      {/* Food tags */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {mealFood.food.preferences && mealFood.food.preferences.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {(expandedPrefs[index] ? mealFood.food.preferences : mealFood.food.preferences.slice(0, 2)).map((pref, prefIndex) => (
                              <span
                                key={prefIndex}
                                className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded"
                              >
                                {typeof pref === 'string' ? pref : 
                                 typeof pref === 'number' ? `ID: ${pref}` : 
                                 pref.name || `ID: ${pref.PreferenceID}`}
                              </span>
                            ))}
                            {mealFood.food.preferences.length > 2 && (
                              <button
                                onClick={() => setExpandedPrefs(prev => ({ ...prev, [index]: !prev[index] }))}
                                className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded hover:underline"
                              >
                                {expandedPrefs[index] ? 'Show less' : `+${mealFood.food.preferences.length - 2} more`}
                              </button>
                            )}
                          </div>
                        )}
                        {mealFood.food.dietaryRestrictions && mealFood.food.dietaryRestrictions.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {(expandedRestrs[index] ? mealFood.food.dietaryRestrictions : mealFood.food.dietaryRestrictions.slice(0, 2)).map((restriction, restrictionIndex) => (
                              <span
                                key={restrictionIndex}
                                className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded"
                              >
                                {typeof restriction === 'string' ? restriction : 
                                 typeof restriction === 'number' ? `ID: ${restriction}` : 
                                 restriction.name || `ID: ${restriction.DietaryRestrictionID}`}
                              </span>
                            ))}
                            {mealFood.food.dietaryRestrictions.length > 2 && (
                              <button
                                onClick={() => setExpandedRestrs(prev => ({ ...prev, [index]: !prev[index] }))}
                                className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded hover:underline"
                              >
                                {expandedRestrs[index] ? 'Show less' : `+${mealFood.food.dietaryRestrictions.length - 2} more`}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">
                No foods found for this meal
              </p>
            )}
          </div>

          {/* Close Button */}
          <div className="pt-4 border-t border-amber-800/30">
            <button
              onClick={onClose}
              className="w-full bg-amber-700 hover:bg-amber-600 text-white font-medium py-3 rounded-lg transition-colors shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}