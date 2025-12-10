import { useMemo } from "react";
import { FoodItem } from "../types";

export function useMealNameSuggestion(foods: FoodItem[]) {
  return useMemo(() => {
    if (foods.length === 0) return "";
    if (foods.length === 1) return `Meal with ${foods[0].name}`;
    if (foods.length === 2) return `${foods[0].name} and ${foods[1].name}`;
    return `${foods[0].name}, ${foods[1].name} +${foods.length - 2} more`;
  }, [foods]);
}