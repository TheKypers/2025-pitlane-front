'use client';
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/config/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/contexts/UserContext";
import { useMealNameSuggestion } from "./hooks/useMealNameSuggestion";
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useBadges } from '@/lib/contexts/BadgeContext';
import { AddMealFormProps, FoodItem } from "./types";
import { COMMON_STYLES } from "./constants";
import { processDietaryRestrictions } from "./utils";
import { useFoodsList } from "./hooks/useFoodsList";
import { useFormSubmission, useDietaryRestrictions } from "./hooks/useFormHelpers";
import FoodsList from "./FoodsList";
import MealExtras from "./MealExtras";
import FoodModal from "./FoodModal";
import { Hexagon, Loader2 } from "lucide-react";

interface KorvenProduct {
  name: string;
}

type Props = AddMealFormProps & { onClose?: () => void };

export default function AddMealForm({ onFoodAdded, onClose, initialMealName }: Props) {
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const { processBadgeNotifications } = useBadges();
  
  // Basic meal info
  const [mealName, setMealName] = useState(initialMealName || "");
  const [description, setDescription] = useState("");
  const [isMealKorvenInspired, setIsMealKorvenInspired] = useState(false);
  
  // Korven API states for meal names
  const [korvenMealProducts, setKorvenMealProducts] = useState<KorvenProduct[]>([]);
  const [isLoadingKorvenMeals, setIsLoadingKorvenMeals] = useState(false);
  const [showKorvenMealOptions, setShowKorvenMealOptions] = useState(false);
  const [selectedKorvenMealProduct, setSelectedKorvenMealProduct] = useState<string | null>(null);
  
  // Foods management with custom hook
  const { foods, addFood, updateFood, removeFood, totalKcal, clearFoods } = useFoodsList();
  
  // Form submission state
  const { isSubmitting, withSubmission } = useFormSubmission();

  // Meal preferences and restrictions
  const [showMealExtras] = useState(false);
  const [mealPreferences, setMealPreferences] = useState<number[]>([]);
  const {
    restrictions: mealRestrictions,
    setRestrictions: setMealRestrictions,
    hasRestrictions: mealHasRestrictions,
    setHasRestrictions: setMealHasRestrictions
  } = useDietaryRestrictions();

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'search' | 'create' | 'edit'>('search');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [initialFoodName, setInitialFoodName] = useState<string>("");

  const suggestedMealName = useMealNameSuggestion(foods);

  // Function to check if a name contains connectors (for meal names)
  const hasConnectors = (name: string): boolean => {
    const connectors = ['con', 'y', 'de', 'al', 'en', 'para', 'sin', 'a', 'el', 'la', 'los', 'las'];
    const words = name.toLowerCase().split(/\s+/);
    return words.some(word => connectors.includes(word));
  };

  // Fetch Korven products for meal names (with connectors)
  useEffect(() => {
    const fetchKorvenMealProducts = async () => {
      setIsLoadingKorvenMeals(true);
      try {
        const response = await fetch('/api/korven-products', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const products = await response.json() as KorvenProduct[];
          // For meals: only products WITH connectors
          const filtered = products.filter(product => hasConnectors(product.name));
          setKorvenMealProducts(filtered);
        } else {
          console.error('Korven API returned status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Korven products for meals:', error);
      } finally {
        setIsLoadingKorvenMeals(false);
      }
    };

    fetchKorvenMealProducts();
  }, []);

  const openAddFoodModal = (index: number | null = null) => {
    setEditingIndex(index);
  
    if (index !== null) {
      // Editing existing food - determine if it's a temporary food or an existing one
      const item = foods[index];
      if (item.id) {
        // Existing food with ID - only allow quantity editing
        setModalMode('edit');
      } else {
        // Temporary food without ID - allow full editing in create mode
        setModalMode('create');
      }
      setOpenModal(true);
    } else {
      // Adding new food - open search modal directly
      setModalMode('search');
      setOpenModal(true);
    }
  };


  

  
  const closeModal = () => {
    setOpenModal(false);
    setEditingIndex(null);
    setInitialFoodName(""); // Clear initial name when closing
  };

  const handleSwitchToCreate = (initialName?: string) => {
    // Switch from search mode to create mode
    setModalMode('create');
    // Store the initial name to pass to the modal
    setInitialFoodName(initialName || "");
    // Modal stays open, just switches mode - the modal will handle initialName internally
  };

  const handleConfirmFood = (payload: FoodItem) => {
    if (editingIndex !== null) {
      // Editing existing food
      updateFood(editingIndex, payload);
      return;
    }
    
    // Adding new food
    addFood(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || foods.length === 0) {
      showError(
        "Incomplete Meal Information",
        "Please provide a meal name and add at least one food item."
      );
      return;
    }

    if (!userData?.profile?.id) {
      showError(
        "Authentication Required",
        "You must be logged in to create meals."
      );
      return;
    }

    await withSubmission(async () => {
      // First, create all foods that don't exist yet and collect meal foods with quantities
      const mealFoods: { foodId: number; quantity: number }[] = [];
      
      for (const food of foods) {
        let foodId: number;

        if (food.id) {
          // Food already exists, use its ID
          foodId = food.id;
        } else {
          // Check if food with this name already exists
          try {
            const existingFoodsResponse = await fetch(`${API_BASE_URL}/foods`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            
            if (existingFoodsResponse.ok) {
              const existingFoods = await existingFoodsResponse.json();
              const existingFood = existingFoods.find((f: { name: string; FoodID: number }) => f.name.toLowerCase() === food.name.toLowerCase());
              
              if (existingFood) {
                // Food already exists, use its ID
                foodId = existingFood.FoodID;
              } else {
                // Create new food
                const processed = processDietaryRestrictions(food.hasNoRestrictions ?? null, food.dietaryRestrictions || []);
                const foodResponse = await fetch(`${API_BASE_URL}/foods`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: food.name,
                    kCal: food.kcalPerUnit || (food.kCal / food.quantity), // Use kcalPerUnit for API
                    svgLink: food.svgLink || "",
                    preferences: food.preferences || [],
                    dietaryRestrictions: processed.dietaryRestrictions,
                    hasNoRestrictions: processed.hasNoRestrictions,
                    profileId: userData.profile!.id,
                  }),
                });
                
                if (!foodResponse.ok) {
                  const errorData = await foodResponse.json().catch(() => ({}));
                  throw new Error(`Failed to create food: ${food.name} - ${errorData.error || 'Unknown error'}`);
                }
                
                const createdFood = await foodResponse.json();
                foodId = createdFood.FoodID;
              }
            } else {
              throw new Error('Failed to check existing foods');
            }
          } catch (error) {
            console.error('Error processing food:', error);
            throw new Error(`Failed to process food: ${food.name}`);
          }
        }

        // Add to meal foods with quantity
        mealFoods.push({
          foodId: foodId,
          quantity: food.quantity
        });
      }

      console.log('=== FRONTEND MEAL CREATION DEBUG ===');
      console.log('Sending meal with mealFoods:', mealFoods);

      // Now create the meal with the food IDs and quantities
      const mealResponse = await fetch(`${API_BASE_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mealName,
          description,
          profileId: userData.profile!.id,
          mealFoods: mealFoods,
        }),
      });

      if (!mealResponse.ok) {
        const errorData = await mealResponse.json().catch(() => ({}));
        throw new Error(`Failed to create meal: ${errorData.error || 'Unknown error'}`);
      }

      const createdMeal = await mealResponse.json();

      showSuccess(
        "Meal Created Successfully!",
        `"${mealName}" has been saved with ${foods.length} food${foods.length !== 1 ? 's' : ''}.`
      );
      
      // Process badge notifications through BadgeContext modal
      if (createdMeal.badgeNotifications && Array.isArray(createdMeal.badgeNotifications) && createdMeal.badgeNotifications.length > 0) {
        console.log('[AddMealForm] Processing badge notifications through context');
        await processBadgeNotifications(createdMeal.badgeNotifications);
      }
      
      if (onFoodAdded) onFoodAdded(createdMeal);
      if (onClose) onClose();

      // Reset form
      setMealName(""); 
      setDescription(""); 
      clearFoods();
    });
  };

  return (
    <Card className={`${COMMON_STYLES.CARD_BASE} p-6`}>
      <div className="flex items-center justify-between mb-2">
        <div />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${COMMON_STYLES.TEXT_AMBER_MUTED} hover:text-amber-100 text-sm underline transition-colors`}
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Korven Meal Name Inspiration */}
        <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-600/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <span className="text-amber-100 text-sm font-semibold">
                Get Korven Inspired Meal Name
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKorvenMealOptions(!showKorvenMealOptions)}
              className="text-xs text-amber-300 hover:text-amber-100 underline"
            >
              {showKorvenMealOptions ? 'Hide' : 'Show'} options
            </button>
          </div>
          
          {showKorvenMealOptions && (
            <div className="space-y-2">
              {isLoadingKorvenMeals ? (
                <div className="flex items-center justify-center gap-2 text-amber-300 py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading Korven meal names...</span>
                </div>
              ) : korvenMealProducts.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {korvenMealProducts.map((product, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setMealName(product.name);
                        setSelectedKorvenMealProduct(product.name);
                        setIsMealKorvenInspired(true);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedKorvenMealProduct === product.name
                          ? 'bg-amber-600 text-white border border-amber-500'
                          : 'bg-amber-900/20 text-amber-200 hover:bg-amber-800/40 border border-amber-700/30'
                      }`}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-300 text-center py-3">
                  No Korven meal names with connectors available.
                </p>
              )}
              {selectedKorvenMealProduct && (
                <div className="text-xs text-amber-300 bg-amber-900/30 border border-amber-700 rounded p-2 flex items-center gap-2">
                  <Hexagon className="w-3 h-3 fill-amber-400/20" />
                  <span>Using Korven inspired name: <strong>{selectedKorvenMealProduct}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* nombre + sugerencia */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-amber-200 text-sm">Meal Name</label>
            {isMealKorvenInspired && (
              <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Hexagon className="w-3 h-3 fill-amber-400/30" />
                Korven
              </span>
            )}
          </div>
          <input
            type="text"
            placeholder="Meal Name"
            value={mealName}
            onChange={(e) => {
              setMealName(e.target.value);
              // Clear Korven inspired flag if user manually changes the name
              if (selectedKorvenMealProduct && e.target.value !== selectedKorvenMealProduct) {
                setIsMealKorvenInspired(false);
                setSelectedKorvenMealProduct(null);
              }
            }}
            className={COMMON_STYLES.INPUT_CLASS}
          />
          {!mealName && suggestedMealName && (
            <div className={`mt-1 text-sm ${COMMON_STYLES.TEXT_AMBER_MUTED} flex items-center gap-2`}>
              <span className="opacity-80">Suggestion:</span>
              <span className="px-2 py-0.5 rounded bg-neutral-800 border border-amber-800/40 text-amber-100">
                {suggestedMealName}
              </span>
              <button
                type="button"
                onClick={() => setMealName(suggestedMealName)}
                className={`text-xs px-2 py-0.5 rounded ${COMMON_STYLES.BUTTON_PRIMARY}`}
              >
                Use
              </button>
            </div>
          )}
        </div>

        {showMealExtras && (
          <MealExtras
            inputClass={COMMON_STYLES.INPUT_CLASS}
            description={description}
            setDescription={setDescription}
            mealPreferences={mealPreferences}
            setMealPreferences={setMealPreferences}
            mealHasRestrictions={mealHasRestrictions || false}
            setMealHasRestrictions={(value: boolean) => setMealHasRestrictions(value)}
            mealRestrictions={mealRestrictions}
            setMealRestrictions={setMealRestrictions}
            MealIconSlot={<div></div>}
          />
        )}

        {/* Foods */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className={`${COMMON_STYLES.TEXT_AMBER_PRIMARY} font-semibold`}>
              Foods ({foods.length})
            </h3>
            <Button
              type="button"
              onClick={() => openAddFoodModal(null)}
              className={COMMON_STYLES.BUTTON_PRIMARY}
            >
              + Add food
            </Button>
          </div>

          <FoodsList
            foods={foods}
            onEdit={(i) => openAddFoodModal(i)}
            onRemove={removeFood}
          />
        </div>

        {/* total + guardar */}
        <div className="flex items-center justify-between bg-amber-700 p-3 rounded-lg text-amber-50 font-semibold">
          <span>Total kcal</span><span>{totalKcal}</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting || foods.length === 0 || !mealName}
          className={`w-full ${COMMON_STYLES.CARD_BASE} border border-amber-700/30 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-opacity`}
        >
          {isSubmitting ? "Saving..." : "Save Meal"}
        </button>
      </form>

      {/* Food Modal */}
      <FoodModal
        apiBase={API_BASE_URL}
        open={openModal}
        onClose={closeModal}
        mode={modalMode}
        initialName={initialFoodName}
        editingItem={editingIndex !== null ? foods[editingIndex] : null}
        onConfirm={handleConfirmFood}
        onSwitchToCreate={modalMode === 'search' ? handleSwitchToCreate : undefined}
        forMeal={true}
      />
    </Card>
  );
}