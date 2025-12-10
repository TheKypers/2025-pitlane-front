'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Plus, ChevronDown, Info, Lock, Unlock } from 'lucide-react';
import { Meal } from '@/lib/contexts/MealsContext';
import { CalorieRangeSlider } from '@/components/common/sliders';
import { MultiSelect } from '@/components/common/MultiSelect';
import { fetchAllPreferences, fetchAllDietaryRestrictions, Preference, DietaryRestriction } from '@/lib/utils/preferencesService';
import { UserNameWithBadge } from '@/components/common';

interface MealSearchBarProps {
  allMeals: Meal[];
  onMealSelect: (meal: Meal | null) => void;
  selectedMeal?: Meal | null;
  placeholder?: string;
  className?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  maxResults?: number;
  // For restriction filtering
  userRestrictions?: number[];
  groupRestrictions?: number[];
  isGroupMode?: boolean;
  // For advanced filtering
  showAdvancedFilters?: boolean;
}

interface SearchFilters {
  searchTerm: string;
  minCalories: number;
  maxCalories: number;
  selectedPreferences: string[];
  selectedRestrictions: string[];
  sortBy: 'newest' | 'oldest' | 'calories_asc' | 'calories_desc' | 'name_asc' | 'name_desc';
}

export function MealSearchBar({
  allMeals,
  onMealSelect,
  selectedMeal,
  placeholder = "Search for meals...",
  className = "",
  showCreateButton = false,
  onCreateClick,
  maxResults = 10,
  userRestrictions = [],
  groupRestrictions = [],
  isGroupMode = false,
  showAdvancedFilters = false
}: MealSearchBarProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [allPreferences, setAllPreferences] = useState<Preference[]>([]);
  const [allRestrictions, setAllRestrictions] = useState<DietaryRestriction[]>([]);
  const [applyDietaryFilter, setApplyDietaryFilter] = useState(true); // Toggle for dietary filtering

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    minCalories: 0,
    maxCalories: 3000,
    selectedPreferences: [],
    selectedRestrictions: [],
    sortBy: 'newest'
  });

  // Fetch preferences and restrictions data
  useEffect(() => {
    const fetchPreferencesData = async () => {
      try {
        const [preferencesData, restrictionsData] = await Promise.all([
          fetchAllPreferences(),
          fetchAllDietaryRestrictions()
        ]);
        setAllPreferences(preferencesData);
        setAllRestrictions(restrictionsData);
      } catch (error) {
        console.error('Error fetching preferences/restrictions:', error);
      }
    };

    fetchPreferencesData();
  }, []);

  // Calculate total calories for a meal
  const calculateTotalCalories = React.useCallback((meal: Meal) => {
    return meal.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
  }, []);

  // Check if meal is compatible with restrictions
  // Dietary restrictions on food indicate COMPLIANCE (e.g., "vegan" means it IS vegan)
  // A meal is compatible only if ALL its foods have ALL the user's required restrictions
  const isMealCompatible = React.useCallback((meal: Meal) => {
    const restrictions = isGroupMode ? groupRestrictions : userRestrictions;
    
    if (restrictions.length === 0) return true;

    // Check if all foods in the meal are compatible with ALL user restrictions
    return meal.mealFoods.every(mf => {
      const foodRestrictionsIds = mf.food.dietaryRestrictions?.map(r => 
        typeof r === 'number' ? r : r.DietaryRestrictionID || 0
      ) || [];
      
      // Check for "For Everyone" (0) - this food is safe for everyone
      if (foodRestrictionsIds.includes(0)) return true;
      
      // Food must have ALL of the user's required restrictions to be compatible
      // For example: User needs "vegan" - food must be marked as vegan
      return restrictions.every(userRestId => foodRestrictionsIds.includes(userRestId));
    });
  }, [isGroupMode, groupRestrictions, userRestrictions]);

  // Filter and search meals
  const searchResults = useMemo(() => {
    if (!query.trim() && !showAdvancedFilters) return [];

    let filtered = allMeals.slice();

    // Apply dietary restriction filtering only if toggle is enabled
    if (applyDietaryFilter) {
      filtered = filtered.filter(isMealCompatible);
    }

    // Apply search term filter
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(searchLower) ||
        meal.description?.toLowerCase().includes(searchLower) ||
        meal.mealFoods.some(mf => mf.food.name.toLowerCase().includes(searchLower)) ||
        meal.profile?.username?.toLowerCase().includes(searchLower)
      );
    }

    // Apply advanced filters if shown
    if (showAdvancedFilters) {
      // Calorie filters
      if (filters.minCalories > 0) {
        filtered = filtered.filter(meal => calculateTotalCalories(meal) >= filters.minCalories);
      }
      if (filters.maxCalories < 3000) {
        filtered = filtered.filter(meal => calculateTotalCalories(meal) <= filters.maxCalories);
      }

      // Preference filters
      if (filters.selectedPreferences.length > 0) {
        const selectedPrefIds = filters.selectedPreferences.map(id => parseInt(id));
        filtered = filtered.filter(meal => 
          meal.mealFoods.some(mf => {
            const foodPrefIds = mf.food.preferences?.map(p => 
              typeof p === 'number' ? p : p.PreferenceID || 0
            ) || [];
            return selectedPrefIds.some(prefId => foodPrefIds.includes(prefId));
          })
        );
      }

      // Restriction filters (additional to user/group restrictions)
      if (filters.selectedRestrictions.length > 0) {
        const selectedRestIds = filters.selectedRestrictions.map(id => parseInt(id));
        filtered = filtered.filter(meal => 
          meal.mealFoods.every(mf => {
            const foodRestIds = mf.food.dietaryRestrictions?.map(r => 
              typeof r === 'number' ? r : r.DietaryRestrictionID || 0
            ) || [];
            return foodRestIds.includes(0) || selectedRestIds.some(restId => foodRestIds.includes(restId));
          })
        );
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'calories_asc':
            return calculateTotalCalories(a) - calculateTotalCalories(b);
          case 'calories_desc':
            return calculateTotalCalories(b) - calculateTotalCalories(a);
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    }

    return filtered.slice(0, maxResults);
  }, [allMeals, query, filters, showAdvancedFilters, maxResults, isMealCompatible, calculateTotalCalories, applyDietaryFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(value.trim().length > 0 || showAdvancedFilters);
    setActiveIndex(-1);
    
    if (showAdvancedFilters) {
      setFilters(prev => ({ ...prev, searchTerm: value }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && searchResults[activeIndex]) {
          handleMealSelect(searchResults[activeIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  };

  const handleMealSelect = (meal: Meal) => {
    onMealSelect(meal);
    setQuery(meal.name);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const resetSearch = () => {
    setQuery('');
    setShowDropdown(false);
    setActiveIndex(-1);
    onMealSelect(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (!showFilters) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-300/70" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => (query.trim() || showAdvancedFilters) && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-amber-800/30 border border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
        />
        
        {/* Advanced Filters Toggle */}
        {showAdvancedFilters && (
          <button
            type="button"
            onClick={toggleFilters}
            className={`absolute right-8 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              showFilters ? 'text-amber-200 bg-amber-800/50' : 'text-amber-300/70 hover:text-amber-100'
            }`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        )}
        
        {(query || selectedMeal) && (
          <button
            type="button"
            onClick={resetSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-300/70 hover:text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <div className="mt-2 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calorie Range Slider */}
            <div>
              <CalorieRangeSlider
                minValue={filters.minCalories}
                maxValue={filters.maxCalories}
                onRangeChange={(min, max) => setFilters(prev => ({ ...prev, minCalories: min, maxCalories: max }))}
                absoluteMin={0}
                absoluteMax={3000}
                step={10}
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as SearchFilters['sortBy'] }))}
                className="w-full px-3 py-2 bg-amber-800/30 border border-amber-700/50 rounded text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="calories_desc">Most Calories</option>
                <option value="calories_asc">Least Calories</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preferences Filter */}
            <div>
              <MultiSelect
                options={allPreferences.map(pref => ({ id: pref.PreferenceID.toString(), name: pref.name }))}
                selectedIds={filters.selectedPreferences}
                onSelectionChange={(selectedIds) => setFilters(prev => ({ ...prev, selectedPreferences: selectedIds }))}
                label="Food Preferences"
                placeholder="Select preferences..."
              />
            </div>

            {/* Dietary Restrictions Filter */}
            <div>
              <MultiSelect
                options={allRestrictions.map(rest => ({ id: rest.DietaryRestrictionID.toString(), name: rest.name }))}
                selectedIds={filters.selectedRestrictions}
                onSelectionChange={(selectedIds) => setFilters(prev => ({ ...prev, selectedRestrictions: selectedIds }))}
                label="Additional Dietary Restrictions"
                placeholder="Select restrictions..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Restriction Info */}
      {(userRestrictions.length > 0 || groupRestrictions.length > 0) && (
        <div className="mt-2 space-y-2">
          <div className="p-2 bg-blue-900/20 border border-blue-700/50 rounded text-xs text-blue-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                {isGroupMode 
                  ? `${applyDietaryFilter ? 'Filtering by' : 'Not filtering by'} ${groupRestrictions.length} group restriction(s)`
                  : `${applyDietaryFilter ? 'Filtering by' : 'Not filtering by'} your ${userRestrictions.length} dietary restriction(s)`
                }
              </span>
            </div>
            <button
              type="button"
              onClick={() => setApplyDietaryFilter(!applyDietaryFilter)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                applyDietaryFilter
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {applyDietaryFilter ? (
                <>
                  <Lock className="w-3 h-3" />
                  Filter Active
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" />
                  Show All
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-amber-700/50 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((meal, index) => (
                <button
                  key={meal.MealID}
                  type="button"
                  onClick={() => handleMealSelect(meal)}
                  className={`w-full text-left px-4 py-3 hover:bg-amber-800/30 transition-colors ${
                    index === activeIndex ? 'bg-amber-800/30' : ''
                  }`}
                >
                  <div className="font-medium text-amber-100">{meal.name}</div>
                  {meal.description && (
                    <div className="text-sm text-gray-400 truncate">
                      {meal.description}
                    </div>
                  )}
                  <div className="text-xs text-amber-400 mt-1 flex items-center gap-2">
                    <span>by</span>
                    <UserNameWithBadge 
                      username={meal.profile?.username || 'Unknown'}
                      profileId={meal.profileId}
                      badgeSize="sm"
                      usernameClassName="text-xs"
                    />
                    <span>•</span>
                    <span>{meal.mealFoods?.length || 0} ingredients</span>
                    <span>•</span>
                    <span>{calculateTotalCalories(meal)} kcal</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-center text-gray-400">
              <div>No compatible meals found</div>
              {showCreateButton && onCreateClick && (
                <button
                  type="button"
                  onClick={onCreateClick}
                  className="mt-2 text-sm text-amber-400 hover:text-amber-300"
                >
                  Create new meal
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selected Meal Display */}
      {selectedMeal && (
        <div className="mt-2 p-3 bg-amber-800/20 border border-amber-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-amber-200">{selectedMeal.name}</div>
              {selectedMeal.description && (
                <div className="text-sm text-gray-400">{selectedMeal.description}</div>
              )}
              <div className="text-xs text-amber-400 mt-1 flex items-center gap-2">
                <span>by</span>
                <UserNameWithBadge 
                  username={selectedMeal.profile?.username || 'Unknown'}
                  profileId={selectedMeal.profileId}
                  badgeSize="sm"
                  usernameClassName="text-xs"
                />
                <span>•</span>
                <span>{selectedMeal.mealFoods?.length || 0} ingredients</span>
                <span>•</span>
                <span>{calculateTotalCalories(selectedMeal)} kcal</span>
              </div>
            </div>
            <button
              type="button"
              onClick={resetSearch}
              className="text-gray-400 hover:text-gray-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Button */}
      {showCreateButton && onCreateClick && query && searchResults.length === 0 && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={onCreateClick}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Create &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  );
}