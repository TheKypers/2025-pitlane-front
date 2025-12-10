// Barrel exports for the meal module
// This index file serves as the main entry point for meal-related components

// Main components
export { default as AddMealForm } from "./AddMealForm";
export { default as MealCard } from "./MealCard";
export { default as FoodsList } from "./FoodsList";
export { default as MealExtras } from "./MealExtras";
export { default as FoodModal } from "./FoodModal";
export { CustomCheckbox } from "./CustomCheckbox";
export { MealPortionSelector, type PortionData } from "./MealPortionSelector";
export { MealSelectionModal } from "./MealSelectionModal";

// Common reusable components
export { default as Modal } from "./common/Modal";
export { FoodIcon, KcalDisplay, FoodQuantityDisplay } from "./common/FoodDisplayComponents";

// Hooks
export { useMealNameSuggestion } from "./hooks/useMealNameSuggestion";
export { useFoodsList } from "./hooks/useFoodsList";
export { useFormSubmission, useModal, useDietaryRestrictions } from "./hooks/useFormHelpers";

// Types
export type * from "./types";

// Utilities and constants
export * from "./utils";
export * from "./constants";

// Default export - the most commonly used component
export { default } from "./AddMealForm";