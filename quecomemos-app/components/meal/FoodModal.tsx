'use client';
import { useMemo, useRef, KeyboardEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DropdownWrapper } from "@/components/forms";
import { CustomCheckbox } from "@/components/forms";
import { IconSelect } from "@/components/forms";
import { X, Utensils, Plus, Loader2, Search, AlertCircle, Hexagon, Trash2 } from "lucide-react";
import { ExistingFood, FoodItem } from "./types";
import { getKcalFromFood } from "./utils";
import { useFoodSearch } from "./hooks/useFoodSearch";
import { useGlobalNotification } from "@/lib/contexts/NotificationContext";

type FoodModalMode = 'search' | 'create' | 'edit';
type PreferenceObject = { id?: number; name?: string; PreferenceID?: number };
type RestrictionObject = { id?: number; name?: string; RestrictionID?: number };

interface KorvenProduct {
  name: string;
}

type Props = {
  apiBase: string;
  open: boolean;
  onClose: () => void;
  mode: FoodModalMode;
  editingItem?: FoodItem | null;
  onConfirm: (payload: FoodItem) => void;
  onSwitchToCreate?: (initialName?: string) => void;
  initialName?: string; // Add prop to pass initial name for create mode
  forMeal?: boolean; // Flag to determine if selecting for meal (with connectors) or food (without connectors)
  allowDelete?: boolean; // Flag to show delete button in edit mode
  onDelete?: () => void; // Callback for delete action
};

export default function FoodModal(props: Props) {
  const {
    apiBase, open, onClose, mode, editingItem, onConfirm, onSwitchToCreate, initialName, forMeal = false,
    allowDelete = false, onDelete,
  } = props;

  const { showError } = useGlobalNotification();

  // Expand/collapse states for selected food details
  const [showAllSelectedPreferences, setShowAllSelectedPreferences] = useState(false);
  const [showAllSelectedRestrictions, setShowAllSelectedRestrictions] = useState(false);
  // Expand/collapse states for editingItem (read-only) details
  const [showAllEditPreferences, setShowAllEditPreferences] = useState(false);
  const [showAllEditRestrictions, setShowAllEditRestrictions] = useState(false);

  // Korven API states
  const [korvenProducts, setKorvenProducts] = useState<KorvenProduct[]>([]);
  const [isLoadingKorven, setIsLoadingKorven] = useState(false);
  const [showKorvenOptions, setShowKorvenOptions] = useState(false);
  const [selectedKorvenProduct, setSelectedKorvenProduct] = useState<string | null>(null);

  // Internal state for form fields
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [kcalPerUnit, setKcalPerUnit] = useState<number | "">("");
  const [createIcon, setCreateIcon] = useState("");
  const [createPreferences, setCreatePreferences] = useState<number[]>([]);
  const [createRestrictions, setCreateRestrictions] = useState<number[]>([]);
  const [createHasRestrictions, setCreateHasRestrictions] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKorvenInspired, setIsKorvenInspired] = useState(false);

  // Search functionality (only used in search mode)
  const {
    setQuery,
    results, showDropdown,
    selected, setSelected,
    activeIndex, setActiveIndex,
    kcalSelected,
    allFoods,
    isLoadingFoods,
    isLoadingDetails,
    setIsLoadingDetails,
  } = useFoodSearch({ apiBase, open });

  const searchRef = useRef<HTMLInputElement>(null);

  // Function to check if a name contains connectors (for meal names)
  const hasConnectors = (name: string): boolean => {
    const connectors = ['con', 'y', 'de', 'al', 'en', 'para', 'sin', 'a', 'el', 'la', 'los', 'las'];
    const words = name.toLowerCase().split(/\s+/);
    return words.some(word => connectors.includes(word));
  };

  // Fetch Korven products
  useEffect(() => {
    if (!open || mode !== 'create') return;
    
    const fetchKorvenProducts = async () => {
      setIsLoadingKorven(true);
      try {
        const response = await fetch('/api/korven-products', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (response.ok) {
          const products = await response.json() as KorvenProduct[];
          // Filter based on forMeal flag
          const filtered = products.filter(product => {
            if (forMeal) {
              // For meals: only products WITH connectors
              return hasConnectors(product.name);
            } else {
              // For foods: only products WITHOUT connectors
              return !hasConnectors(product.name);
            }
          });
          setKorvenProducts(filtered);
        } else {
          console.error('Korven API returned status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching Korven products:', error);
      } finally {
        setIsLoadingKorven(false);
      }
    };

    fetchKorvenProducts();
  }, [open, mode, forMeal]);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (!open) {
      // Reset everything when modal closes
      setName("");
      setQuantity("");
      setKcalPerUnit("");
      setCreateIcon("");
      setCreatePreferences([]);
      setCreateRestrictions([]);
      setCreateHasRestrictions(null);
      setSelected(null);
      setQuery("");
      setActiveIndex(-1);
      setIsSubmitting(false);
      setShowKorvenOptions(false);
      setSelectedKorvenProduct(null);
      setIsKorvenInspired(false);
      return;
    }

    // Initialize form based on mode and editing item
    if (mode === 'edit' && editingItem) {
      // Edit mode: populate with existing item data (for existing foods with IDs)
      setName(editingItem.name);
      setQuantity(editingItem.quantity);
      setKcalPerUnit(editingItem.kcalPerUnit || (editingItem.kCal / editingItem.quantity));
      setCreateIcon(editingItem.svgLink || "");
      setCreatePreferences(editingItem.preferences || []);
      setCreateRestrictions(editingItem.dietaryRestrictions || []);
      setCreateHasRestrictions(editingItem.hasNoRestrictions ?? null);
    } else if (mode === 'create') {
      if (editingItem) {
        // Create mode but editing an existing item (temporary food) - populate with existing data
        setName(editingItem.name);
        setQuantity(editingItem.quantity);
        setKcalPerUnit(editingItem.kcalPerUnit || (editingItem.kCal / editingItem.quantity));
        setCreateIcon(editingItem.svgLink || "");
        setCreatePreferences(editingItem.preferences || []);
        setCreateRestrictions(editingItem.dietaryRestrictions || []);
        setCreateHasRestrictions(editingItem.hasNoRestrictions ?? null);
      } else {
        // Create mode: start with form, using initialName if provided (from search mode switch)
        setName(initialName || "");
        setQuantity(1);
        setKcalPerUnit("");
        setCreateIcon("");
        setCreatePreferences([]);
        setCreateRestrictions([]);
        setCreateHasRestrictions(null);
      }
    } else if (mode === 'search') {
      // Search mode: start with empty search
      setName("");
      setQuantity(1);
      setKcalPerUnit("");
      setQuery("");
      setSelected(null);
      setActiveIndex(-1);
    }
  }, [open, mode, editingItem, initialName, setQuery, setSelected, setActiveIndex]);

  // Sync search query with name in search mode
  useEffect(() => {
    if (mode === 'search' && open) {
      setQuery(name);
    }
  }, [mode, name, open, setQuery]);

  const inputClass = "w-full p-3 rounded-lg border border-amber-700 bg-amber-800 text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500";

  // Check if food name already exists (for create mode)
  const checkFoodNameExists = (foodName: string): boolean => {
    const trimmedName = foodName.trim().toLowerCase();
    return allFoods.some(food => {
      // When editing (either edit mode or create mode with existing item), exclude the current food from duplicate check
      if ((mode === 'edit' || (mode === 'create' && editingItem)) && editingItem) {
        if (editingItem.id && food.id === editingItem.id) {
          return false;
        }
        if (!editingItem.id && food.name?.toLowerCase() === editingItem.name.toLowerCase()) {
          return false;
        }
      }
      return food.name?.toLowerCase() === trimmedName;
    });
  };

  // Load detailed food information when a food is selected
  const hydrateSelectedWithDetails = async (food: ExistingFood) => {
    if (!food?.id) return;
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`${apiBase}/foods/${food.id}?include=preferences,dietaryRestrictions`);
      if (res.ok) {
        const full = await res.json();
        // Map FoodID to id for consistency
        setSelected({
          ...full,
          id: full.FoodID || full.id
        });
      }
    } catch (e) {
      console.error("Could not load food details", e);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle search keyboard navigation
  const onKeyDownSearch = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && e.key !== "Enter") return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault(); 
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); 
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (showDropdown && activeIndex >= 0 && results[activeIndex]) {
        const selectedFood = results[activeIndex];
        setSelected(selectedFood);
        setName(selectedFood.name);
        setQuery(selectedFood.name);
        const k = getKcalFromFood(selectedFood);
        if (typeof k === "number") setKcalPerUnit(k);
        await hydrateSelectedWithDetails(selectedFood);
        return;
      }
      handleConfirm();
    }
  };

  // Calculate total calories
  const liveKcal = useMemo(() => {
    const base = selected ? kcalSelected : (typeof kcalPerUnit === "number" ? kcalPerUnit : undefined);
    const quantityNum = typeof quantity === "number" ? quantity : (quantity === "" ? 0 : Number(quantity));
    
    if (!base || quantityNum <= 0 || isNaN(quantityNum) || isNaN(base)) return undefined;
    return Math.round(base * quantityNum);
  }, [selected, kcalSelected, kcalPerUnit, quantity]);

  // Handle form submission
  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      if (mode === 'edit' && editingItem) {
        // Check if this is an existing food (has id) or a newly created food (no id)
        const isExistingFood = Boolean(editingItem.id);
        
        if (forMeal && isExistingFood) {
          // Existing food in meal context - only allow quantity changes
          if (!quantity || typeof quantity !== "number" || quantity <= 0) {
            showError("Invalid Quantity", "Please enter a valid quantity.");
            return;
          }
          
          const originalKcalPerUnit = editingItem.kcalPerUnit || (editingItem.kCal / editingItem.quantity);
          onConfirm({ 
            ...editingItem,
            quantity: quantity,
            kCal: Math.round(originalKcalPerUnit * quantity),
            kcalPerUnit: originalKcalPerUnit
          });
          onClose(); 
          return;
        } else if (forMeal && !isExistingFood) {
          // Newly created food in meal context - allow full editing including quantity
          if (!name.trim() || !quantity || !kcalPerUnit) {
            showError("Invalid Input", "Please fill in all required fields.");
            return;
          }
          
          if (typeof quantity !== "number" || quantity <= 0) {
            showError("Invalid Quantity", "Please enter a valid quantity.");
            return;
          }
          
          const kcalPerUnitNum = typeof kcalPerUnit === "number" ? kcalPerUnit : Number(kcalPerUnit);
          if (isNaN(kcalPerUnitNum) || kcalPerUnitNum < 0) {
            showError("Invalid Calories", "Please enter valid calories per unit.");
            return;
          }
          
          // Check if name already exists (if it was changed)
          if (name.trim() !== editingItem.name && checkFoodNameExists(name)) {
            showError("Duplicate Name", "A food with this name already exists.");
            return;
          }
          
          onConfirm({
            name: name.trim(),
            quantity: quantity,
            kCal: Math.round(kcalPerUnitNum * quantity),
            kcalPerUnit: kcalPerUnitNum,
            svgLink: createIcon,
            preferences: createPreferences,
            dietaryRestrictions: createHasRestrictions === true ? [] : createRestrictions,
            hasNoRestrictions: createHasRestrictions === true ? true : (createRestrictions.length > 0 ? false : null),
          });
          onClose();
          return;
        } else {
          // Outside meal context - full editing allowed (handled by existing logic below)
          // This case shouldn't normally happen in meal creation flow
          if (!quantity || typeof quantity !== "number" || quantity <= 0) {
            showError("Invalid Quantity", "Please enter a valid quantity.");
            return;
          }
          
          const originalKcalPerUnit = editingItem.kcalPerUnit || (editingItem.kCal / editingItem.quantity);
          onConfirm({ 
            ...editingItem,
            quantity: quantity,
            kCal: Math.round(originalKcalPerUnit * quantity),
            kcalPerUnit: originalKcalPerUnit
          });
          onClose(); 
          return;
        }
      }
      
      if (mode === 'search') {
        // Search mode: must have a selected food
        if (!selected) {
          showError("No Food Selected", "Please select a food from the search results.");
          return;
        }
        
        if (!quantity || typeof quantity !== "number" || quantity <= 0) {
          showError("Invalid Quantity", "Please enter a valid quantity.");
          return;
        }
        
        const k = kcalSelected;
        if (typeof k !== "number") { 
          showError("Calorie Information Missing", "Calorie information per unit was not found for this food.");
          return;
        }
        
        onConfirm({ 
          id: typeof selected.id === 'string' ? parseInt(selected.id) : selected.id,
          name: selected.name, 
          quantity: quantity, 
          kCal: Math.round(k * quantity),
          kcalPerUnit: k,
          svgLink: selected.svgLink || selected.icon || "",
          preferences: Array.isArray(selected.preferences) ? 
            selected.preferences.map(p => typeof p === 'object' && p && 'id' in p ? p.id : p) : [],
          dietaryRestrictions: Array.isArray(selected.dietaryRestrictions) ? 
            selected.dietaryRestrictions.map(r => typeof r === 'object' && r && 'id' in r ? r.id : r) : [],
          hasNoRestrictions: selected.dietaryRestrictions?.some(r => 
            (typeof r === 'object' && r && 'id' in r ? r.id : r) === 0
          ) ?? false
        });
        onClose(); 
        return;
      }
      
      if (mode === 'create') {
        // Create mode: validate all required fields
        if (!name.trim() || !quantity || !kcalPerUnit) {
          showError("Incomplete Information", "Please complete the food name, quantity, and calories per unit.");
          return;
        }
        
        if (typeof quantity !== "number" || quantity <= 0) {
          showError("Invalid Quantity", "Please enter a valid quantity.");
          return;
        }
        
        if (typeof kcalPerUnit !== "number" || kcalPerUnit <= 0) {
          showError("Invalid Calories", "Please enter valid calories per unit.");
          return;
        }
        
        // When editing a temporary food, don't check for duplicate names against itself
        if (!editingItem && checkFoodNameExists(name)) {
          showError("Duplicate Food Name", `A food named "${name.trim()}" already exists. Please choose a different name or search for the existing food.`);
          return;
        }
        
        // If editing a temporary food and name changed, check for duplicates
        if (editingItem && editingItem.name !== name.trim() && checkFoodNameExists(name)) {
          showError("Duplicate Food Name", `A food named "${name.trim()}" already exists. Please choose a different name or search for the existing food.`);
          return;
        }
        
        onConfirm({ 
          // Preserve ID if editing an existing temporary food
          ...(editingItem?.id ? { id: editingItem.id } : {}),
          name: name.trim(), 
          quantity: quantity, 
          kCal: Math.round(kcalPerUnit * quantity),
          kcalPerUnit: kcalPerUnit,
          svgLink: createIcon || "",
          preferences: createPreferences,
          dietaryRestrictions: createRestrictions,
          hasNoRestrictions: createHasRestrictions ?? false,
          isKorvenInspired: isKorvenInspired
        });
        onClose();
        return;
      }

      if (mode === 'edit') {
        // Edit mode: validate based on context (forMeal or standalone)
        if (forMeal) {
          // In meal context: only validate quantity
          if (!quantity || typeof quantity !== "number" || quantity <= 0) {
            showError("Invalid Quantity", "Please enter a valid quantity.");
            return;
          }
          
          const existingKcalPerUnit = editingItem?.kcalPerUnit || (editingItem ? editingItem.kCal / editingItem.quantity : 0);
          
          onConfirm({
            ...(editingItem || {}),
            quantity: quantity,
            kCal: Math.round(existingKcalPerUnit * quantity),
            kcalPerUnit: existingKcalPerUnit,
          } as FoodItem);
        } else {
          // Standalone edit: validate all fields like create mode
          if (!name.trim() || !kcalPerUnit) {
            showError("Incomplete Information", "Please complete the food name and calories per unit.");
            return;
          }
          
          if (typeof kcalPerUnit !== "number" || kcalPerUnit < 0) {
            showError("Invalid Calories", "Please enter valid calories per unit.");
            return;
          }
          
          // Check for duplicate names when name changed
          if (editingItem && editingItem.name !== name.trim() && checkFoodNameExists(name)) {
            showError("Duplicate Food Name", `A food named "${name.trim()}" already exists. Please choose a different name.`);
            return;
          }
          
          onConfirm({
            ...(editingItem?.id ? { id: editingItem.id } : {}),
            name: name.trim(),
            quantity: quantity || 1,
            kCal: Math.round(kcalPerUnit * (quantity || 1)),
            kcalPerUnit: kcalPerUnit,
            svgLink: createIcon || "",
            preferences: createPreferences,
            dietaryRestrictions: createRestrictions,
            hasNoRestrictions: createHasRestrictions ?? false,
          });
        }
        onClose();
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch (mode) {
      case 'search': return "Search Existing Food";
      case 'create': 
        return editingItem ? "Edit Food" : "Create New Food";
      case 'edit': return "Edit Food";
      default: return "Food Modal";
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-4xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
        style={{ zIndex: 96 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
          <h4 className="text-amber-100 font-semibold text-sm md:text-base">
            {getModalTitle()}
          </h4>
          <button onClick={onClose} className="p-2 text-amber-200 hover:text-amber-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[85vh] overflow-y-auto">
          {mode === 'search' ? (
            // SEARCH MODE
            <div className="space-y-4">
              {/* Search Section */}
              <div>
                <Label className="text-amber-200 text-sm mb-2 block flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search for existing food
                </Label>
                <div className="border border-amber-700 rounded-lg bg-neutral-800 overflow-hidden">
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Type food name to search..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={onKeyDownSearch}
                    disabled={isLoadingFoods || isSubmitting}
                    className={`w-full px-4 py-3 bg-neutral-800 text-amber-100 border-b border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-600 ${isLoadingFoods || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  
                  {/* Search Results */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {isLoadingFoods ? (
                      <div className="px-4 py-6 text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-200">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm">Loading foods...</span>
                        </div>
                      </div>
                    ) : results.length > 0 ? (
                      <>
                        {results.map((food, i) => {
                          const k = getKcalFromFood(food);
                          const active = i === activeIndex;
                          return (
                            <button
                              key={`${food.id ?? food.name}-${i}`}
                              type="button"
                              onMouseEnter={() => setActiveIndex(i)}
                              onClick={async () => {
                                setSelected(food);
                                setName(food.name);
                                setQuery(food.name);
                                if (typeof k === "number") {
                                  setKcalPerUnit(k);
                                }
                                await hydrateSelectedWithDetails(food);
                              }}
                              className={`w-full text-left px-4 py-3 border-b border-amber-800/50 transition-colors ${active ? "bg-amber-700 text-white" : "hover:bg-amber-700/60 text-amber-100"}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="truncate">{food.name}</span>
                                <span className="text-xs opacity-80">{typeof k === "number" ? `${k} kcal/unit` : "No kcal data"}</span>
                              </div>
                            </button>
                          );
                        })}
                        
                        {/* Create option in search results */}
                        {onSwitchToCreate && name.trim().length > 0 && !checkFoodNameExists(name.trim()) && (
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = name.trim();
                              onSwitchToCreate(trimmed);
                            }}
                            className="w-full text-left px-4 py-3 border-t-2 border-amber-600 bg-amber-700/80 hover:bg-amber-600 text-amber-100 flex items-center gap-2 font-medium"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Create &ldquo;{name.trim()}&rdquo; as new food</span>
                          </button>
                        )}
                      </>
                    ) : name.trim().length > 0 ? (
                      <div className="px-4 py-6 text-center">
                        <div className="text-sm text-amber-200 mb-3">No existing foods found for &ldquo;{name.trim()}&rdquo;.</div>
                        {onSwitchToCreate && (
                          checkFoodNameExists(name.trim()) ? (
                            <div className="text-xs text-red-400 bg-red-900/30 border border-red-700 rounded p-2">
                              <AlertCircle className="w-4 h-4 inline mr-2" />
                              A food named &ldquo;{name.trim()}&rdquo; already exists in the database.
                            </div>
                          ) : (
                            <Button
                              onClick={() => {
                                const trimmed = name.trim();
                                onSwitchToCreate(trimmed);
                              }}
                              className="w-full bg-amber-700 hover:bg-amber-600 text-amber-100 border border-amber-600 text-sm py-2 flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Create &ldquo;{name.trim()}&rdquo; as new food
                            </Button>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        Start typing to search for existing foods...
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selected Food Indicator */}
                {selected && (
                  <div className="mt-3 text-sm text-green-200 bg-green-900/30 border border-green-700 rounded-lg p-3">
                    {isLoadingDetails ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading food details...</span>
                      </div>
                    ) : (
                      <>
                        ✓ Selected: <strong>{selected.name}</strong>
                        {kcalSelected && <span className="text-xs block mt-1">{kcalSelected} kcal per unit</span>}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Food Details - Show when food is selected */}
              {selected && (
                <div className="border-t border-amber-800/30 pt-4">
                  <Label className="text-amber-200 text-sm mb-3 block">Food Details</Label>
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                        {selected.svgLink ? (
                          <Image 
                            src={selected.svgLink} 
                            alt={selected.name} 
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain" 
                          />
                        ) : (
                          <Utensils className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-100">{selected.name}</h4>
                        <p className="text-sm text-amber-300">{kcalSelected} kcal per unit</p>
                      </div>
                    </div>
                    
                    {/* Show preferences and restrictions if available */}
                    {selected.preferences && selected.preferences.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200 mb-1">Preferences:</p>
                        <div className="flex flex-wrap gap-1">
                          {(showAllSelectedPreferences ? selected.preferences : selected.preferences.slice(0, 2)).map((pref, index) => {
                            let displayName = '';
                            if (typeof pref === 'string') {
                              displayName = pref;
                            } else if (typeof pref === 'object' && pref) {
                              const prefObj = pref as PreferenceObject;
                              displayName = prefObj.name || `ID: ${prefObj.PreferenceID || prefObj.id || 'Unknown'}`;
                            } else if (typeof pref === 'number') {
                              displayName = `ID: ${pref}`;
                            } else {
                              displayName = 'Unknown';
                            }
                            return (
                              <span key={index} className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded">
                                {displayName}
                              </span>
                            );
                          })}
                          {selected.preferences.length > 2 && (
                            <button
                              onClick={() => setShowAllSelectedPreferences(prev => !prev)}
                              className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded hover:underline"
                            >
                              {showAllSelectedPreferences ? 'Show less' : `+${selected.preferences.length - 2} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selected.dietaryRestrictions && selected.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200 mb-1">Dietary Restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {(showAllSelectedRestrictions ? selected.dietaryRestrictions : selected.dietaryRestrictions.slice(0, 2)).map((restriction, index) => {
                            let displayName = '';
                            if (typeof restriction === 'string') {
                              displayName = restriction;
                            } else if (typeof restriction === 'object' && restriction) {
                              const restrictionObj = restriction as RestrictionObject;
                              displayName = restrictionObj.name || `ID: ${restrictionObj.RestrictionID || restrictionObj.id || 'Unknown'}`;
                            } else if (typeof restriction === 'number') {
                              displayName = `ID: ${restriction}`;
                            } else {
                              displayName = 'Unknown';
                            }
                            return (
                              <span key={index} className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded">
                                {displayName}
                              </span>
                            );
                          })}
                          {selected.dietaryRestrictions.length > 2 && (
                            <button
                              onClick={() => setShowAllSelectedRestrictions(prev => !prev)}
                              className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded hover:underline"
                            >
                              {showAllSelectedRestrictions ? 'Show less' : `+${selected.dietaryRestrictions.length - 2} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity Section - Only show if food is selected */}
              {selected && (
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Quantity</Label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Enter quantity"
                    value={quantity === "" ? "" : quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantity('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num) && num > 0) {
                          setQuantity(num);
                        }
                      }
                    }}
                    disabled={isLoadingDetails || isSubmitting}
                    className={`${inputClass} ${isLoadingDetails || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {liveKcal !== undefined && (
                    <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                  )}
                </div>
              )}
            </div>
          ) : mode === 'edit' ? (
            // EDIT MODE - Full editing capabilities when outside meal creation, quantity-only when in meal
            <div className="space-y-4">
              {forMeal && editingItem?.id ? (
                // When editing in meal context - only allow quantity changes
                <>
                  {/* Food Information - Read Only */}
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                    <Label className="text-amber-200 text-sm mb-3 block">Food Information (Read-only)</Label>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0">
                        {editingItem?.svgLink ? (
                          <Image 
                            src={editingItem.svgLink} 
                            alt={editingItem.name} 
                            width={24}
                            height={24}
                            className="w-6 h-6 object-contain" 
                          />
                        ) : (
                          <Utensils className="w-5 h-5 text-amber-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-amber-100">{editingItem?.name}</h4>
                        <p className="text-sm text-amber-300">{editingItem?.kcalPerUnit || (editingItem ? editingItem.kCal / editingItem.quantity : 0)} kcal per unit</p>
                      </div>
                    </div>
                    
                    {/* Show preferences and restrictions if available */}
                    {editingItem?.preferences && editingItem.preferences.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-amber-200 mb-1">Preferences:</p>
                        <div className="flex flex-wrap gap-1">
                          {(showAllEditPreferences ? editingItem.preferences : editingItem.preferences.slice(0, 2)).map((pref, index) => {
                            let displayName = '';
                            if (typeof pref === 'string') {
                              displayName = pref;
                            } else if (typeof pref === 'object' && pref) {
                              const prefObj = pref as PreferenceObject;
                              displayName = prefObj.name || `ID: ${prefObj.PreferenceID || prefObj.id || pref}`;
                            } else if (typeof pref === 'number') {
                              displayName = `ID: ${pref}`;
                            } else {
                              displayName = String(pref);
                            }
                            return (
                              <span key={index} className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded">
                                {displayName}
                              </span>
                            );
                          })}
                          {editingItem.preferences.length > 2 && (
                            <button
                              onClick={() => setShowAllEditPreferences(prev => !prev)}
                              className="bg-amber-800/40 text-amber-200 text-xs px-2 py-1 rounded hover:underline"
                            >
                              {showAllEditPreferences ? 'Show less' : `+${editingItem.preferences.length - 2} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {editingItem?.dietaryRestrictions && editingItem.dietaryRestrictions.length > 0 && (
                      <div>
                        <p className="text-xs text-amber-200 mb-1">Dietary Restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {(showAllEditRestrictions ? editingItem.dietaryRestrictions : editingItem.dietaryRestrictions.slice(0, 2)).map((restriction, index) => {
                            let displayName = '';
                            if (typeof restriction === 'string') {
                              displayName = restriction;
                            } else if (typeof restriction === 'object' && restriction) {
                              const restrictionObj = restriction as RestrictionObject;
                              displayName = restrictionObj.name || `ID: ${restrictionObj.RestrictionID || restrictionObj.id || restriction}`;
                            } else if (typeof restriction === 'number') {
                              displayName = `ID: ${restriction}`;
                            } else {
                              displayName = String(restriction);
                            }
                            return (
                              <span key={index} className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded">
                                {displayName}
                              </span>
                            );
                          })}
                          {editingItem.dietaryRestrictions.length > 2 && (
                            <button
                              onClick={() => setShowAllEditRestrictions(prev => !prev)}
                              className="bg-green-800/40 text-green-200 text-xs px-2 py-1 rounded hover:underline"
                            >
                              {showAllEditRestrictions ? 'Show less' : `+${editingItem.dietaryRestrictions.length - 2} more`}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity Section - Editable */}
                  <div>
                    <Label className="text-amber-200 text-sm mb-2 block">Quantity (Editable)</Label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Enter quantity"
                      value={quantity === "" ? "" : quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setQuantity('');
                        } else {
                          const num = Number(val);
                          if (!isNaN(num) && num > 0) {
                            setQuantity(num);
                          }
                        }
                      }}
                      disabled={isSubmitting}
                      className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    {liveKcal !== undefined && (
                      <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                    )}
                  </div>
                </>
              ) : (
                // When editing outside meal context - allow full editing (same as create mode)
                <>
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 gap-4">
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
                      <input
                        type="text"
                        placeholder="Enter food name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          // Clear Korven inspired flag if user manually changes the name
                          if (selectedKorvenProduct && e.target.value !== selectedKorvenProduct) {
                            setIsKorvenInspired(false);
                            setSelectedKorvenProduct(null);
                          }
                        }}
                        disabled={isSubmitting}
                        className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${
                          name.trim() && checkFoodNameExists(name) 
                            ? 'border-red-500 focus:ring-red-500' 
                            : ''
                        }`}
                      />
                      {/* Show validation messages */}
                      {editingItem && editingItem.name !== name.trim() && name.trim() && checkFoodNameExists(name) ? (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          A food with this name already exists. Please choose a different name.
                        </p>
                      ) : editingItem && editingItem.name !== name.trim() && name.trim() && !checkFoodNameExists(name) && name.trim().length > 0 ? (
                        <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                          ✓ Food name is available
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-amber-200 text-sm mb-2 block">Calories per unit</Label>
                      <input
                        type="number"
                        min={0}
                        placeholder="Enter calories per unit"
                        value={kcalPerUnit === "" ? "" : kcalPerUnit}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setKcalPerUnit('');
                          } else {
                            const num = Number(val);
                            if (!isNaN(num) && num >= 0) {
                              setKcalPerUnit(num);
                            }
                          }
                        }}
                        disabled={isSubmitting}
                        className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      {liveKcal !== undefined && (
                        <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-amber-200 text-sm mb-2 block">Icon</Label>
                      <IconSelect onSelectionChange={setCreateIcon} />
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t border-amber-800/30 pt-4">
                    <Label className="text-amber-200 text-sm mb-3 block">Dietary Information</Label>
                    <div className="space-y-3">
                      <DropdownWrapper label="Preferences">
                        <CustomCheckbox
                          initialOptions={createPreferences}
                          endpoint="preferences"
                          onSelectionChange={setCreatePreferences}
                        />
                      </DropdownWrapper>
                      
                      <div>
                        <Label className="text-amber-200 mb-3 block">Does this food have dietary restrictions?</Label>
                        <div className="flex gap-4 mb-4">
                          <button
                            type="button"
                            onClick={() => setCreateHasRestrictions(true)}
                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                              createHasRestrictions === true
                                ? 'bg-amber-700 border-amber-600 text-white'
                                : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                            }`}
                          >
                            No restrictions (For Everyone)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreateHasRestrictions(false)}
                            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                              createHasRestrictions === false
                                ? 'bg-amber-700 border-amber-600 text-white'
                                : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                            }`}
                          >
                            Has restrictions
                          </button>
                        </div>
                        
                        {createHasRestrictions === false && (
                          <DropdownWrapper label="Select Dietary Restrictions">
                            <CustomCheckbox
                              initialOptions={createRestrictions}
                              endpoint="dietary-restrictions/excluding-for-everyone"
                              onSelectionChange={setCreateRestrictions}
                            />
                          </DropdownWrapper>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // CREATE MODE - Full form
            <div className="space-y-4">
              {/* Korven Inspiration Section */}
              {!editingItem && (
                <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border border-amber-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hexagon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                      <Label className="text-amber-100 text-sm font-semibold">
                        Get Korven Inspired
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowKorvenOptions(!showKorvenOptions)}
                      className="text-xs text-amber-300 hover:text-amber-100 underline"
                    >
                      {showKorvenOptions ? 'Hide' : 'Show'} options
                    </button>
                  </div>
                  
                  {showKorvenOptions && (
                    <div className="space-y-2">
                      {isLoadingKorven ? (
                        <div className="flex items-center justify-center gap-2 text-amber-300 py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Loading Korven products...</span>
                        </div>
                      ) : korvenProducts.length > 0 ? (
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {korvenProducts.map((product, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setName(product.name);
                                setSelectedKorvenProduct(product.name);
                                setIsKorvenInspired(true);
                              }}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                selectedKorvenProduct === product.name
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
                          {forMeal 
                            ? 'No Korven products with connectors available for meals.'
                            : 'No Korven products without connectors available for foods.'}
                        </p>
                      )}
                      {selectedKorvenProduct && (
                        <div className="text-xs text-amber-300 bg-amber-900/30 border border-amber-700 rounded p-2 flex items-center gap-2">
                          <Hexagon className="w-3 h-3 fill-amber-400/20" />
                          <span>Using Korven inspired name: <strong>{selectedKorvenProduct}</strong></span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Basic Info */}
              <div className={`grid grid-cols-1 ${forMeal ? 'md:grid-cols-2' : ''} gap-4`}>
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
                  <input
                    type="text"
                    placeholder="Enter food name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      // Clear Korven inspired flag if user manually changes the name
                      if (selectedKorvenProduct && e.target.value !== selectedKorvenProduct) {
                        setIsKorvenInspired(false);
                        setSelectedKorvenProduct(null);
                      }
                    }}
                    disabled={isSubmitting}
                    className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''} ${
                      name.trim() && checkFoodNameExists(name) 
                        ? 'border-red-500 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  {/* Show validation messages based on whether we're editing or creating */}
                  {editingItem ? (
                    // When editing a temporary food
                    editingItem.name !== name.trim() && name.trim() && checkFoodNameExists(name) ? (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        A food with this name already exists. Please choose a different name.
                      </p>
                    ) : editingItem.name !== name.trim() && name.trim() && !checkFoodNameExists(name) && name.trim().length > 0 ? (
                      <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                        ✓ Food name is available
                      </p>
                    ) : null
                  ) : (
                    // When creating a new food
                    name.trim() && checkFoodNameExists(name) ? (
                      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        A food with this name already exists. Please choose a different name.
                      </p>
                    ) : name.trim() && !checkFoodNameExists(name) && name.trim().length > 0 ? (
                      <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
                        ✓ Food name is available
                      </p>
                    ) : null
                  )}
                </div>
                {/* Only show Quantity field when forMeal is true (adding food to meal) */}
                {forMeal && (
                  <div>
                    <Label className="text-amber-200 text-sm mb-2 block">Quantity</Label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Enter quantity"
                      value={quantity === "" ? "" : quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setQuantity('');
                        } else {
                          const num = Number(val);
                          if (!isNaN(num) && num > 0) {
                            setQuantity(num);
                          }
                        }
                      }}
                      disabled={isSubmitting}
                      className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Calories per uniteee</Label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter calories per unit"
                    value={kcalPerUnit === "" ? "" : kcalPerUnit}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setKcalPerUnit('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num) && num >= 0) {
                          setKcalPerUnit(num);
                        }
                      }
                    }}
                    disabled={isSubmitting}
                    className={`${inputClass} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {liveKcal !== undefined && (
                    <p className="mt-1 text-xs text-amber-300">Total: <b>{liveKcal}</b> kcal</p>
                  )}
                </div>
                <div>
                  <Label className="text-amber-200 text-sm mb-2 block">Icon</Label>
                  <IconSelect onSelectionChange={setCreateIcon} />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-amber-800/30 pt-4">
                <Label className="text-amber-200 text-sm mb-3 block">Dietary Information (Optional)</Label>
                <div className="space-y-3">
                  <DropdownWrapper label="Preferences">
                    <CustomCheckbox
                      initialOptions={createPreferences}
                      endpoint="preferences"
                      onSelectionChange={setCreatePreferences}
                    />
                  </DropdownWrapper>
                  
                  <div>
                    <Label className="text-amber-200 mb-3 block">Does this food have dietary restrictions?</Label>
                    <div className="flex gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => setCreateHasRestrictions(true)}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                          createHasRestrictions === true
                            ? 'bg-amber-700 border-amber-600 text-white'
                            : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                        }`}
                      >
                        No restrictions (For Everyone)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateHasRestrictions(false)}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                          createHasRestrictions === false
                            ? 'bg-amber-700 border-amber-600 text-white'
                            : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
                        }`}
                      >
                        Has restrictions
                      </button>
                    </div>
                    
                    {createHasRestrictions === false && (
                      <DropdownWrapper label="Select Dietary Restrictions">
                        <CustomCheckbox
                          initialOptions={createRestrictions}
                          endpoint="dietary-restrictions/excluding-for-everyone"
                          onSelectionChange={setCreateRestrictions}
                        />
                      </DropdownWrapper>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit and Delete Buttons */}
          <div className="pt-4 border-t border-amber-800/30">
            <div className="flex gap-3">
              {/* Delete Button - Only show in edit mode when outside meal context */}
              {mode === 'edit' && !forMeal && allowDelete && onDelete && (
                <Button 
                  type="button" 
                  onClick={onDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              )}
              
              {/* Submit Button */}
              <Button 
                type="button" 
                onClick={handleConfirm} 
                className={`${mode === 'edit' && !forMeal && allowDelete ? 'flex-1' : 'w-full'} bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={Boolean((mode === 'search' && !selected) || isSubmitting || isLoadingDetails || 
                          (mode === 'create' && (!name.trim() || !quantity || !kcalPerUnit || 
                            (!editingItem && checkFoodNameExists(name)) || 
                            (editingItem && editingItem.name !== name.trim() && checkFoodNameExists(name)))) ||
                          (mode === 'edit' && !forMeal && (!name.trim() || !kcalPerUnit || 
                            (editingItem && editingItem.name !== name.trim() && checkFoodNameExists(name)))))}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {(mode === 'edit' || (mode === 'create' && editingItem)) ? "Updating..." : "Adding food..."}
                  </>
                ) : (
                  (mode === 'edit' || (mode === 'create' && editingItem)) ? "Update food" : "Confirm and add food"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}