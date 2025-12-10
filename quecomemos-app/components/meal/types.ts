export type FoodItem = {
  id?: number;
  name: string;
  quantity: number;
  kCal: number;
  kcalPerUnit?: number; // Store original kcal per unit to avoid rounding errors
  svgLink?: string;
  preferences?: number[];
  dietaryRestrictions?: number[];
  hasNoRestrictions?: boolean | null;
  isKorvenInspired?: boolean; // Flag to indicate if the name comes from Korven API
};

export type ExistingFood = {
  id?: string | number;
  name: string;
  kcalPer100g?: number;
  kCal?: number;
  svgLink?: string;
  icon?: string;
  preferences?: Array<{ id: number; name?: string }> | number[];
  dietaryRestrictions?: Array<{ id: number; name?: string }> | number[];
  restrictions?: Array<{ id: number; name?: string }> | number[];
};

export type Meal = {
  MealID: number;
  name: string;
  description?: string;
  isKorvenInspired?: boolean; // Flag to indicate if the name comes from Korven API
};

export interface AddMealFormProps {
  onFoodAdded?: (meal: Meal) => void;
  initialMealName?: string;
}