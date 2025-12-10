import { useState } from "react";
import { FoodItem } from "../types";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { findDuplicateFood, removeFoodByIndex, updateFoodByIndex, calculateTotalKcal } from "../utils";

/**
 * Custom hook to manage a list of foods in a meal
 */
export function useFoodsList(initialFoods: FoodItem[] = []) {
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const { showSuccess, showError } = useGlobalNotification();

  const addFood = (newFood: FoodItem): boolean => {
    // Check for duplicates
    const existingFood = findDuplicateFood(foods, newFood.name);
    
    if (existingFood) {
      showError(
        "Food Already Added",
        `"${newFood.name}" is already in this meal.`
      );
      return false;
    }
    
    // Add new food
    setFoods(prev => [...prev, newFood]);
    showSuccess(
      "Food Added Successfully",
      `"${newFood.name}" has been added to the meal.`
    );
    return true;
  };

  const updateFood = (index: number, updatedFood: FoodItem): void => {
    setFoods(prev => updateFoodByIndex(prev, index, updatedFood));
    showSuccess(
      "Food Updated",
      `"${updatedFood.name}" has been updated.`
    );
  };

  const removeFood = (index: number): void => {
    setFoods(prev => removeFoodByIndex(prev, index));
  };

  const clearFoods = (): void => {
    setFoods([]);
  };

  const totalKcal = calculateTotalKcal(foods);

  return {
    foods,
    setFoods,
    addFood,
    updateFood,
    removeFood,
    clearFoods,
    totalKcal,
    foodCount: foods.length
  };
}