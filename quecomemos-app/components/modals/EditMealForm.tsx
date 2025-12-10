"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { ConfirmationModal } from "./confirmation-modal";
import { useConfirmation } from "@/lib/hooks/useConfirmation";
import { SquarePen, Trash2, Plus, Utensils } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";
import { useFoods } from "@/lib/contexts/FoodsContext";
import { useMeals } from "@/lib/contexts/MealsContext";
import { useUser } from "@/lib/contexts/UserContext";
import FoodModal from "../meal/FoodModal";

interface MealFood {
  foodId: number;
  quantity: number;
  name: string;
  kcal: number;
  svgLink?: string;
  isTemporary?: boolean; // Flag for foods that need to be created in DB
  tempData?: {
    name: string;
    kcal: number;
    svgLink?: string;
    preferences: number[];
    dietaryRestrictions: number[];
    hasNoRestrictions?: boolean;
  };
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

interface EditMealFormProps {
  meal: Meal;
  onSuccess: () => void;
  onMealUpdated?: (updatedMeal: Partial<Meal>) => void;
}

export function EditMealForm({ meal, onSuccess, onMealUpdated }: EditMealFormProps) {
  const { foods, setFoods, addFood } = useFoods();
  const { removeMeal, updateMeal } = useMeals();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  const { userData } = useUser();
  
  // Load all foods when component mounts
  useEffect(() => {
    const loadAllFoods = async () => {
      try {
        console.log('Loading foods...');
        const response = await fetch(`${API_BASE_URL}/foods`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const allFoods = await response.json();
          setFoods(allFoods);
        } else {
          console.error('Failed to load foods:', response.status);
        }
      } catch (error) {
        console.error('Error loading foods:', error);
      }
    };

    if (foods.length === 0) {
      loadAllFoods();
    }
  }, [setFoods, foods.length]);
  
  const [mealName, setMealName] = useState(meal.name || "");
  const [description, setDescription] = useState(meal.description || "");
  const [mealFoods, setMealFoods] = useState<MealFood[]>(
    meal.mealFoods.map(mf => ({
      foodId: mf.food.FoodID,
      quantity: mf.quantity,
      name: mf.food.name,
      kcal: mf.food.kCal,
      svgLink: mf.food.svgLink
    }))
  );
  const [isLoading, setIsLoading] = useState(false);

  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodModalAction, setFoodModalAction] = useState<'search' | 'create' | 'edit'>('search');
  const [initialFoodName, setInitialFoodName] = useState<string>("");

  const handleEditMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mealFoods.length === 0) {
        throw new Error("A meal must have at least one food item");
      }

      if (!userData?.profile?.id) {
        throw new Error("You must be logged in to update meals");
      }

      // First, create any temporary foods that don't exist in the database
      const finalMealFoods: { foodId: number; quantity: number }[] = [];
      
      for (const food of mealFoods) {
        if (food.isTemporary && food.tempData) {
          // Create the food in the database
          
          try {
            const foodResponse = await fetch(`${API_BASE_URL}/foods`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: food.tempData.name,
                kCal: food.tempData.kcal,
                svgLink: food.tempData.svgLink || "",
                preferences: food.tempData.preferences,
                dietaryRestrictions: food.tempData.hasNoRestrictions === true ? [0] : food.tempData.dietaryRestrictions,
                hasNoRestrictions: food.tempData.hasNoRestrictions === true ? true : (food.tempData.dietaryRestrictions && food.tempData.dietaryRestrictions.length > 0 ? false : true),
                profileId: userData.profile.id,
              }),
            });

            if (!foodResponse.ok) {
              const errorData = await foodResponse.json().catch(() => ({}));
              throw new Error(errorData.error || `Failed to create food: ${food.tempData.name}`);
            }

            const createdFood = await foodResponse.json();
            
            // Add to the foods context for future use
            addFood(createdFood);
            
            // Update the meal foods state to reflect that this food is no longer temporary
            setMealFoods(prev => prev.map(mf => 
              mf.foodId === food.foodId ? {
                ...mf,
                foodId: createdFood.FoodID,
                isTemporary: false,
                tempData: undefined
              } : mf
            ));
            
            // Use the real food ID for the meal
            finalMealFoods.push({
              foodId: createdFood.FoodID,
              quantity: food.quantity
            });
          } catch (error) {
            console.error('Error creating food:', food.tempData.name, error);
            throw new Error(`Failed to create food "${food.tempData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          // Existing food, use as-is
          finalMealFoods.push({
            foodId: food.foodId,
            quantity: food.quantity
          });
        }
      }

      // Now update the meal with all the food IDs
      const response = await fetch(`${API_BASE_URL}/meals/${meal.MealID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description: description,
          mealFoods: finalMealFoods
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update meal");
      }

      const updatedMeal = await response.json();

      // Update the context directly
      updateMeal(meal.MealID, {
        ...updatedMeal,
        name: mealName,
        description: description
      });

      // Also call the optional callback for backward compatibility
      if (onMealUpdated) {
        onMealUpdated({
          ...updatedMeal,
          name: mealName,
          description: description
        });
      }

      showSuccess(
        "Meal Updated Successfully!",
        `"${mealName}" has been updated with your latest changes.`,
        <SquarePen className="w-8 h-8" />
      );
      
      // Delay onSuccess to allow notification to show
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      showError(
        "Failed to Update Meal",
        err instanceof Error ? err.message : "An unexpected error occurred while updating the meal."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMeal = async () => {
    const response = await fetch(`${API_BASE_URL}/meals/${meal.MealID}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to delete meal");
    }

    // Remove meal from context
    removeMeal(meal.MealID);

    showSuccess(
      "Meal Deleted Successfully!",
      `"${meal.name}" has been permanently removed.`,
      <Trash2 className="w-8 h-8" />
    );
    
    setTimeout(() => {
      onSuccess();
    }, 1000);
  };

  const confirmDelete = () => {
    showConfirmation({
      type: 'danger',
      title: "Delete Meal",
      message: `Are you sure you want to delete "${meal.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel"
    }, handleDeleteMeal);
  };

  const removeFood = (foodId: number) => {
    setMealFoods(prev => prev.filter(ing => ing.foodId !== foodId));
  };

  const addMealFood = async (foodItem: { 
    name: string; 
    quantity: number; 
    kCal: number; 
    svgLink?: string;
    preferences?: number[];
    dietaryRestrictions?: number[];
    hasNoRestrictions?: boolean | null;
  }) => {
    console.log('Adding food:', foodItem.name);
    console.log('Available foods:', foods.length, foods.map(f => f.name));
    
    // Try exact match first
    let existingFood = foods.find(f => f.name === foodItem.name);
    
    // If no exact match, try case-insensitive
    if (!existingFood) {
      existingFood = foods.find(f => f.name.toLowerCase() === foodItem.name.toLowerCase());
    }
    
    // If still no match, try trimmed
    if (!existingFood) {
      existingFood = foods.find(f => f.name.trim() === foodItem.name.trim());
    }
    
    let newFood: MealFood;
    
    if (existingFood) {
      // Existing food - use its data
      newFood = {
        foodId: existingFood.FoodID,
        quantity: foodItem.quantity,
        name: existingFood.name,
        kcal: existingFood.kCal,
        svgLink: existingFood.svgLink,
        isTemporary: false
      };
    } else {
      // New food - create temporary food that will be created when meal is saved
      console.log('Food not found, creating temporary food:', foodItem.name);
      
      // Determine the correct restrictions based on hasNoRestrictions flag
      const hasRestrictions = foodItem.dietaryRestrictions && foodItem.dietaryRestrictions.length > 0;
      const finalRestrictions = foodItem.hasNoRestrictions === true ? [0] : (foodItem.dietaryRestrictions || []);
      const finalHasNoRestrictions = foodItem.hasNoRestrictions === true ? true : (hasRestrictions ? false : true);
      
      newFood = {
        foodId: Date.now(), // Temporary ID (will be replaced when food is created)
        quantity: foodItem.quantity,
        name: foodItem.name,
        kcal: Math.round(foodItem.kCal / foodItem.quantity), // kCal per unit
        svgLink: foodItem.svgLink,
        isTemporary: true,
        tempData: {
          name: foodItem.name,
          kcal: Math.round(foodItem.kCal / foodItem.quantity),
          svgLink: foodItem.svgLink || "",
          preferences: foodItem.preferences || [],
          dietaryRestrictions: finalRestrictions,
          hasNoRestrictions: finalHasNoRestrictions
        }
      };
    }
    
    // Check if already added (by name for temporary foods, by foodId for existing foods)
    const alreadyExists = mealFoods.some(ing => 
      ing.isTemporary 
        ? ing.name.toLowerCase() === newFood.name.toLowerCase()
        : ing.foodId === newFood.foodId
    );
    
    if (!alreadyExists) {
      setMealFoods(prev => [...prev, newFood]);
      showSuccess(
        "Food Added",
        `"${newFood.name}" has been added to the meal.${newFood.isTemporary ? ' (New food will be created when meal is saved)' : ''}`
      );
    } else {
      showError(
        "Food Already Added",
        `"${newFood.name}" is already in this meal.`
      );
    }
  };

  const updateFoodQuantity = (foodId: number, newQuantity: number) => {
    setMealFoods(prev => 
      prev.map(ing => 
        ing.foodId === foodId ? { ...ing, quantity: newQuantity } : ing
      )
    );
  };



  const handleSwitchToCreateInEdit = (initialName?: string) => {
    // Switch from search mode to create mode
    setFoodModalAction('create');
    // Store the initial name to pass to the modal
    setInitialFoodName(initialName || "");
    // Modal stays open, just switches mode - the modal will handle the state internally
  };

  return (
    <div className="space-y-6">

      <form onSubmit={handleEditMeal} className="space-y-4">
        {/* Meal Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-amber-200">Meal Name</Label>
          <Input
            id="name"
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="bg-amber-900/20 border-amber-700/50 text-amber-100 placeholder:text-amber-300/50"
            placeholder="Enter meal name"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-amber-200">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-100 placeholder:text-amber-300/50 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Describe your meal (optional)"
            rows={3}
          />
        </div>

        {/* Foods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-amber-100 font-semibold">Foods ({mealFoods.length})</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                // Open the search modal directly
                setFoodModalAction('search');
                setInitialFoodName("");
                setShowFoodModal(true);
              }}
              className="border-amber-700/50 text-amber-200 hover:bg-amber-800/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food
            </Button>
          </div>
          
          {mealFoods.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mealFoods.map((food) => (
                <div
                  key={food.foodId}
                  className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                    {food.svgLink ? (
                      <Image
                        src={food.svgLink}
                        alt={food.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Utensils className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-semibold text-amber-200">{food.name}</h5>
                      <div className="text-sm text-amber-300">
                        {(food.kcal * food.quantity)} kCal
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Quantity: {food.quantity} units • {food.kcal} kCal per unit
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateFoodQuantity(food.foodId, Math.max(1, food.quantity - 1))}
                        className="w-7 h-7 rounded bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center text-sm font-medium"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        min="1"
                        value={food.quantity}
                        onChange={(e) => updateFoodQuantity(food.foodId, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center bg-amber-900/20 border-amber-700/50 text-amber-100"
                      />
                      <button
                        type="button"
                        onClick={() => updateFoodQuantity(food.foodId, food.quantity + 1)}
                        className="w-7 h-7 rounded bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFood(food.foodId)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded"
                      title="Remove food"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-300/70 text-sm italic">No foods selected. Please add some foods.</p>
          )}
        </div>



        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || mealFoods.length === 0}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? "Updating..." : "Update Meal"}
          </Button>
          
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            className="px-4"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
        onConfirm={handleConfirm}
        onClose={closeConfirmation}
      />

      {/* Food Modal */}
      <FoodModal
        apiBase={API_BASE_URL}
        open={showFoodModal}
        onClose={() => {
          setShowFoodModal(false);
          // Reset modal state
          setInitialFoodName("");
        }}
        mode={foodModalAction}
        initialName={initialFoodName}
        onConfirm={async (foodItem) => {
          await addMealFood(foodItem);
          setShowFoodModal(false);
        }}
        onSwitchToCreate={foodModalAction === 'search' ? handleSwitchToCreateInEdit : undefined}
      />
    </div>
  );
}