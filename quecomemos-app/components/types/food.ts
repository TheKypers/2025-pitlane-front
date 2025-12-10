export type FoodItem = {
  id?: number;
  name: string;
  quantity: number;
  kCal: number;
  svgLink?: string;
  preferences?: number[];
  dietaryRestrictions?: number[];
  hasNoRestrictions?: boolean;
};

export type Preference = {
  id: number;
  name: string;
};

export type DietaryRestriction = {
  id: number;
  name: string;
};