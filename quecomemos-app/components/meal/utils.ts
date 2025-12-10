import { ExistingFood, FoodItem } from "./types";

// Food utility functions
export const getKcalFromFood = (f?: ExistingFood | null): number | undefined => {
  if (!f) return undefined;
  if (typeof f.kcalPer100g === "number") return f.kcalPer100g;
  if (typeof f.kCal === "number") return f.kCal;
  return undefined;
};

export const iconUrl = (f?: ExistingFood | null): string =>
  (f?.svgLink || f?.icon || "");

export const namesFrom = (arr?: ExistingFood["preferences"]): string[] => {
  if (!arr) return [];
  return (arr as Array<{ id?: number; name?: string }>)
    .map((x: { id?: number; name?: string }) => (typeof x === "number" ? `#${x}` : (x?.name || `#${x?.id}`)))
    .filter(Boolean);
};

export const restrNames = (f: ExistingFood | null) =>
  namesFrom((f?.dietaryRestrictions ?? f?.restrictions) as ExistingFood["preferences"]);

export const calcKcalFromUnits = (kcalPerUnit: number, units: number) =>
  Math.round(kcalPerUnit * units);

// Food validation utilities
export const checkFoodNameExists = (foodName: string, allFoods: ExistingFood[]): boolean => {
  const trimmedName = foodName.trim().toLowerCase();
  return allFoods.some(food => food.name?.toLowerCase() === trimmedName);
};

export const validateFoodItem = (food: Partial<FoodItem>): string | null => {
  if (!food.name?.trim()) return "Food name is required";
  if (!food.quantity || food.quantity <= 0) return "Quantity must be greater than 0";
  if (!food.kcalPerUnit || food.kcalPerUnit <= 0) return "Calories per unit must be greater than 0";
  return null;
};

// Meal calculation utilities
export const calculateTotalKcal = (foods: FoodItem[]): number => {
  return foods.reduce((acc, f) => acc + f.kCal, 0);
};

export const calculateMealKcal = (kcalPerUnit: number, quantity: number): number | undefined => {
  if (!kcalPerUnit || quantity <= 0 || isNaN(quantity) || isNaN(kcalPerUnit)) {
    return undefined;
  }
  return Math.round(kcalPerUnit * quantity);
};

// Dietary restrictions utilities
export const processDietaryRestrictions = (
  hasRestrictions: boolean | null,
  restrictions: number[]
): { dietaryRestrictions: number[]; hasNoRestrictions: boolean | null } => {
  if (hasRestrictions === true) {
    // "For All" - represented as restriction ID 0
    return { dietaryRestrictions: [0], hasNoRestrictions: true };
  } else if (hasRestrictions === false && restrictions.length > 0) {
    // Specific restrictions
    return { dietaryRestrictions: restrictions, hasNoRestrictions: false };
  } else {
    // No restrictions defined
    return { dietaryRestrictions: [], hasNoRestrictions: true };
  }
};

// Food creation/update utilities
export const createFoodPayload = (
  name: string,
  quantity: number,
  kcalPerUnit: number,
  svgLink?: string,
  preferences?: number[],
  dietaryRestrictions?: number[],
  hasNoRestrictions?: boolean | null
): FoodItem => {
  const processed = processDietaryRestrictions(hasNoRestrictions ?? null, dietaryRestrictions || []);
  
  return {
    name: name.trim(),
    quantity,
    kCal: Math.round(kcalPerUnit * quantity),
    kcalPerUnit,
    svgLink: svgLink || "",
    preferences: preferences || [],
    dietaryRestrictions: processed.dietaryRestrictions,
    hasNoRestrictions: processed.hasNoRestrictions
  };
};

// Array utilities
export const findDuplicateFood = (foods: FoodItem[], newFoodName: string): FoodItem | undefined => {
  return foods.find(food => 
    food.name.toLowerCase() === newFoodName.toLowerCase()
  );
};

export const removeFoodByIndex = (foods: FoodItem[], index: number): FoodItem[] => {
  return foods.filter((_, i) => i !== index);
};

export const updateFoodByIndex = (foods: FoodItem[], index: number, updatedFood: FoodItem): FoodItem[] => {
  const clone = [...foods];
  clone[index] = updatedFood;
  return clone;
};