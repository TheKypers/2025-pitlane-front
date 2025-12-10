"use client";
import { Button } from "@/components/ui/button";
import { CustomCheckbox } from "@/components/forms";
import { DropdownWrapper } from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/forms";
import { useState, useEffect } from "react";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";
import { useMeals } from "@/lib/contexts/MealsContext";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";
import { ConfirmationModal } from "@/components/modals";
import { useConfirmation } from "@/lib/hooks/useConfirmation";
import { SquarePen, Hexagon, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/config/api";

interface KorvenProduct {
  name: string;
}

interface EditFoodFormProps {
  food: Food;
  onSuccess: () => void;
}

export function EditFoodForm({ food, onSuccess }: EditFoodFormProps) {
  const { updateFood, removeFood } = useFoods();
  const { handleFoodDeletion } = useMeals();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm, closeConfirmation } = useConfirmation();
  
  const [foodName, setFoodName] = useState(food.name || "");
  const [kCal, setKCal] = useState<number>(food.kCal || 0);
  const [preferences, setPreferences] = useState<number[]>(
    food.preferences?.map((p: { PreferenceID?: number } | number) => typeof p === 'number' ? p : p.PreferenceID || 0) || []
  );
  const [restrictions, setRestrictions] = useState<number[]>(
    food.dietaryRestrictions?.map((r: { DietaryRestrictionID?: number } | number) => typeof r === 'number' ? r : r.DietaryRestrictionID || 0) || []
  );
  const [hasRestrictions, setHasRestrictions] = useState<boolean>(
    () => {
      const initialRestrictions = food.dietaryRestrictions?.map((r: { DietaryRestrictionID?: number } | number) => typeof r === 'number' ? r : r.DietaryRestrictionID || 0) || [];
      // If has no restrictions or only has "For Everyone" (id=0), then hasRestrictions = false
      return initialRestrictions.length > 0 && !(initialRestrictions.length === 1 && initialRestrictions[0] === 0);
    }
  );
  const [icon, setIcon] = useState<string | null>(food.svgLink || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation states
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  
  // Korven integration states
  const [korvenProducts, setKorvenProducts] = useState<KorvenProduct[]>([]);
  const [selectedKorvenProduct, setSelectedKorvenProduct] = useState<string | null>(null);
  const [isKorvenInspired, setIsKorvenInspired] = useState(false);

  // Function to check if a name contains connectors (for meal names)
  const hasConnectors = (name: string): boolean => {
    const connectors = ['con', 'y', 'de', 'al', 'en', 'para', 'sin', 'a', 'el', 'la', 'los', 'las'];
    const words = name.toLowerCase().split(/\s+/);
    return words.some(word => connectors.includes(word));
  };

  // Fetch Korven products on mount
  useEffect(() => {
    const fetchKorvenProducts = async () => {
      try {
        const response = await fetch('/api/korven-products', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const products = await response.json() as KorvenProduct[];
          // Filter products WITHOUT connectors (for individual foods)
          const filtered = products.filter(product => !hasConnectors(product.name));
          setKorvenProducts(filtered);
        }
      } catch (error) {
        console.error('Error fetching Korven products:', error);
      }
    };

    fetchKorvenProducts();
  }, []);

  // Check if current food name is Korven-inspired
  useEffect(() => {
    const normalizedFoodName = foodName.toLowerCase().trim();
    const isInspired = korvenProducts.some(
      product => product.name.toLowerCase().trim() === normalizedFoodName
    );
    setIsKorvenInspired(isInspired);
    if (isInspired) {
      setSelectedKorvenProduct(foodName);
    }
  }, [foodName, korvenProducts]);

  // Check if food name already exists in database (debounced)
  useEffect(() => {
    const trimmedName = foodName.trim();
    
    // Don't check if name hasn't changed or is empty
    if (!trimmedName || trimmedName.toLowerCase() === food.name.toLowerCase()) {
      setIsDuplicateName(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingName(true);
      try {
        const response = await fetch(`${API_BASE_URL}/foods`);
        if (response.ok) {
          const allFoods: Food[] = await response.json();
          const exists = allFoods.some(f => 
            f.FoodID !== food.FoodID && 
            f.name?.toLowerCase() === trimmedName.toLowerCase()
          );
          setIsDuplicateName(exists);
        }
      } catch (error) {
        console.error('Error checking food name:', error);
      } finally {
        setIsCheckingName(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
  }, [foodName, food.FoodID, food.name]);

  const isNameChanged = foodName.trim().toLowerCase() !== food.name.toLowerCase();

  const handleEditFood = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate food name doesn't exist
    if (isDuplicateName) {
      showError(
        "Duplicate Food Name",
        `A food named "${foodName.trim()}" already exists. Please choose a different name.`
      );
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/foods/${food.FoodID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: foodName,
          kCal: kCal,
          svgLink: icon,
          preferences: preferences,
          dietaryRestrictions: restrictions
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update food");
      }

      const updatedFood = await response.json();
      
      updateFood(food.FoodID, {
        name: foodName,
        kCal: kCal,
        svgLink: icon,
        preferences: preferences,
        dietaryRestrictions: restrictions,
        ...updatedFood
      });
      
      showSuccess(
        "Food Updated Successfully!",
        `"${foodName}" has been updated with your latest changes.`,
        <SquarePen className="w-8 h-8" />
      );
      
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      showError(
        "Failed to Update Food",
        err instanceof Error ? err.message : "An unexpected error occurred while updating the food item."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/foods/${food.FoodID}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete food');
      }

      // Remove from global context
      removeFood(food.FoodID);
      
      // Update meals that contain this food
      handleFoodDeletion(food.FoodID);
      
      showSuccess(
        'Food Deleted Successfully!',
        `"${food.name}" has been permanently removed from your food list.`,
        <Trash2 className="w-8 h-8" />
      );
      
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: unknown) {
      showError(
        'Failed to Delete Food',
        err instanceof Error ? err.message : 'An unexpected error occurred while deleting the food.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    showConfirmation(
      {
        type: 'danger',
        title: 'Delete Food',
        message: `Are you sure you want to delete "${food.name}"? This action cannot be undone and will remove this food from all meals.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        customIcon: <Trash2 className="w-6 h-6" />
      },
      handleDeleteFood
    );
  };

  const inputClass = "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleEditFood} className="space-y-4">
        
        {/* Food Name */}
        <div>
          <Label className="text-amber-200 text-sm mb-2 block flex items-center gap-2">
            Food Name
            {isKorvenInspired && (
              <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Hexagon className="w-3 h-3 fill-amber-400/30" />
                Korven
              </span>
            )}
          </Label>
          <Input
            value={foodName}
            onChange={(e) => {
              setFoodName(e.target.value);
              if (selectedKorvenProduct && e.target.value !== selectedKorvenProduct) {
                setIsKorvenInspired(false);
                setSelectedKorvenProduct(null);
              }
            }}
            placeholder="Enter food name"
            disabled={isLoading}
            className={`${inputClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${
              isDuplicateName ? 'border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {/* Show validation messages */}
          {isCheckingName ? (
            <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Checking availability...
            </p>
          ) : isDuplicateName ? (
            <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              A food with this name already exists. Please choose a different name.
            </p>
          ) : isNameChanged && foodName.trim().length > 0 ? (
            <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
              ✓ Food name is available
            </p>
          ) : null}
        </div>

        {/* Second row - Two columns: Calories and Icon */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-amber-200 text-sm mb-2 block">Calories per unit</Label>
            <Input
              type="number"
              min="0"
              value={kCal}
              onChange={(e) => setKCal(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Enter calories per unit"
              disabled={isLoading}
              className={`${inputClass} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="mt-1 text-xs text-amber-400">Total: {kCal} kcal</p>
          </div>
          <div>
            <Label className="text-amber-200 text-sm mb-2 block">Icon</Label>
            <IconSelect onSelectionChange={setIcon} />
          </div>
        </div>

        {/* Dietary Information */}
        <div className="border-t border-amber-800/30 pt-4">
          <Label className="text-amber-200 text-sm mb-3 block">Dietary Information (Optional)</Label>
          
          {/* Preferences */}
          <div className="mb-3">
            <Label className="text-amber-200 text-sm mb-2 block">Preferences</Label>
            <DropdownWrapper label="Preferences">
              <CustomCheckbox
                initialOptions={preferences}
                endpoint="preferences"
                onSelectionChange={setPreferences}
              />
            </DropdownWrapper>
          </div>

          {/* Dietary Restrictions */}
          <div className="mb-3">
            <Label className="text-amber-200 text-sm mb-2 block">Does this food have dietary restrictions?</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Button
                type="button"
                onClick={() => {
                  setHasRestrictions(false);
                  setRestrictions([]);
                }}
                className={`py-2 px-4 rounded-lg transition-colors ${
                  !hasRestrictions
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'bg-transparent text-gray-400 border border-gray-700 hover:bg-gray-800'
                }`}
              >
                No restrictions (For Everyone)
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setHasRestrictions(true);
                  // When switching to "Has restrictions", remove the "For Everyone" restriction if present
                  if (restrictions.length === 1 && restrictions[0] === 0) {
                    setRestrictions([]);
                  }
                }}
                className={`py-2 px-4 rounded-lg transition-colors ${
                  hasRestrictions
                    ? 'bg-orange-600 text-white border border-orange-500'
                    : 'bg-transparent text-gray-400 border border-gray-700 hover:bg-gray-800'
                }`}
              >
                Has restrictions
              </Button>
            </div>
            
            {hasRestrictions && (
              <div>
                <Label className="text-amber-200 text-sm mb-2 block">Select Dietary Restrictions</Label>
                <DropdownWrapper label="Select Dietary Restrictions">
                  <CustomCheckbox
                    initialOptions={restrictions.filter(id => id !== 0)}
                    endpoint="dietary-restrictions/excluding-for-everyone"
                    onSelectionChange={setRestrictions}
                  />
                </DropdownWrapper>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            type="button"
            onClick={handleDeleteClick}
            disabled={isLoading || confirmation.isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </div>
            )}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || confirmation.isLoading || isDuplicateName || isCheckingName}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </div>
            ) : (
              'Update food'
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        isLoading={confirmation.isLoading}
        customIcon={confirmation.customIcon}
      />
    </div>
  );
}
