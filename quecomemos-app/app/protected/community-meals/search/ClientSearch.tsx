"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, SlidersHorizontal, X, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MealCard } from '@/components/meal';
import { MealModal } from '@/components/modals';
import { CalorieRangeSlider } from '@/components/common/sliders';
import { MultiSelect } from '@/components/common/MultiSelect';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';
import { fetchAllPreferences, fetchAllDietaryRestrictions, Preference, DietaryRestriction } from '@/lib/utils/preferencesService';

interface SearchFilters {
  searchTerm: string;
  minCalories: number;
  maxCalories: number;
  sortBy: 'newest' | 'oldest' | 'calories_asc' | 'calories_desc' | 'name_asc' | 'name_desc';
  createdBy: string;
  selectedPreferences: string[];
  selectedRestrictions: string[];
}

export default function CommunityMealsSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useUser();
  const { allMeals, fetchAllMeals, loadingMeals, error } = useMeals();
  
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: searchParams?.get('q') || '',
    minCalories: 0,
    maxCalories: 3000,
    sortBy: 'newest',
    createdBy: '',
    selectedPreferences: [],
    selectedRestrictions: []
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allPreferences, setAllPreferences] = useState<Preference[]>([]);
  const [allRestrictions, setAllRestrictions] = useState<DietaryRestriction[]>([]);
  const mealsPerPage = 12;

  const profile = userData?.profile;

  useEffect(() => {
    if (profile) {
      fetchAllMeals();
    }
  }, [profile, fetchAllMeals]);

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

  // Filter and sort meals
  const filteredMeals = useMemo(() => {
    if (!allMeals.length) return [];

    // Filter out current user's meals for community search
    let filtered = allMeals.filter(meal => meal.profileId !== profile?.id);

    // Apply search term filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(meal => 
        meal.name.toLowerCase().includes(searchLower) ||
        meal.description?.toLowerCase().includes(searchLower) ||
        meal.mealFoods.some(mf => mf.food.name.toLowerCase().includes(searchLower)) ||
        meal.profile?.username?.toLowerCase().includes(searchLower)
      );
    }

    // Apply creator filter
    if (filters.createdBy.trim()) {
      const creatorLower = filters.createdBy.toLowerCase();
      filtered = filtered.filter(meal => 
        meal.profile?.username?.toLowerCase().includes(creatorLower)
      );
    }

    // Apply calorie filters
    if (filters.minCalories > 0) {
      filtered = filtered.filter(meal => {
        const totalCalories = meal.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
        return totalCalories >= filters.minCalories;
      });
    }

    if (filters.maxCalories < 3000) {
      filtered = filtered.filter(meal => {
        const totalCalories = meal.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
        return totalCalories <= filters.maxCalories;
      });
    }

    // Apply preference filters
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

    // Apply dietary restriction filters
    if (filters.selectedRestrictions.length > 0) {
      const selectedRestIds = filters.selectedRestrictions.map(id => parseInt(id));
      filtered = filtered.filter(meal => 
        meal.mealFoods.every(mf => {
          const foodRestIds = mf.food.dietaryRestrictions?.map(r => 
            typeof r === 'number' ? r : r.DietaryRestrictionID || 0
          ) || [];
          // Food is compatible if it has "For Everyone" (0) or matches user's restrictions
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
        case 'calories_asc': {
          const aCalories = a.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
          const bCalories = b.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
          return aCalories - bCalories;
        }
        case 'calories_desc': {
          const aCalories = a.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
          const bCalories = b.mealFoods.reduce((sum, mf) => sum + (mf.food.kCal * mf.quantity), 0);
          return bCalories - aCalories;
        }
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allMeals, filters, profile?.id]);

  // Pagination
  const totalPages = Math.ceil(filteredMeals.length / mealsPerPage);
  const paginatedMeals = filteredMeals.slice(
    (currentPage - 1) * mealsPerPage,
    currentPage * mealsPerPage
  );

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsMealModalOpen(true);
  };

  const closeMealModal = () => {
    setSelectedMeal(null);
    setIsMealModalOpen(false);
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      minCalories: 0,
      maxCalories: 3000,
      sortBy: 'newest',
      createdBy: '',
      selectedPreferences: [],
      selectedRestrictions: []
    });
    setCurrentPage(1);
  };

  if (loadingMeals) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-amber-700/30 rounded animate-pulse"></div>
            <div className="w-64 h-8 bg-amber-700/30 rounded animate-pulse"></div>
          </div>
          
          {/* Search Bar Skeleton */}
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="w-full h-10 bg-amber-800/30 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-32 h-10 bg-amber-700/30 rounded-lg animate-pulse"></div>
            </div>
          </div>
          
          {/* Results Count Skeleton */}
          <div className="w-48 h-5 bg-amber-700/30 rounded animate-pulse"></div>
          
          {/* Results Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-48 bg-amber-800/30 border border-amber-700/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            aria-label="Back"
            className="w-10 h-10 p-0 flex items-center justify-center text-amber-200 hover:text-amber-100 hover:bg-amber-800/30"
        >
            <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-amber-200">Search Community Meals</h1>
      </div>

      {/* Search and Filter Bar */}
      <Card className="mb-6 bg-amber-900/20 border-amber-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-300/70" />
              <input
                type="text"
                placeholder="Search meals, foods, or creators..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 bg-amber-800/30 border border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-amber-700/50 text-amber-200 hover:bg-amber-800/30"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {Object.values(filters).some(v => v && v !== 'newest') && (
                <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
            </Button>

            {/* Reset Filters Button */}
            {Object.values(filters).some(v => v && v !== 'newest') && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="text-amber-300 hover:text-amber-100 hover:bg-amber-800/30"
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-amber-700/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Creator Filter */}
                <div>
                  <label className="block text-sm font-medium text-amber-200 mb-1">
                    Created By
                  </label>
                  <input
                    type="text"
                    placeholder="Username..."
                    value={filters.createdBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
                    className="w-full px-3 py-2 bg-amber-800/30 border border-amber-700/50 rounded text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-1 focus:ring-amber-600"
                  />
                </div>

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
                  <label className="block text-sm font-medium text-amber-200 mb-1">
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

              {/* Preference and Restriction Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                    label="Dietary Restrictions"
                    placeholder="Select restrictions..."
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-amber-300/70">
          Found {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''}
          {filteredMeals.length > mealsPerPage && (
            <span> • Page {currentPage} of {totalPages}</span>
          )}
        </p>
      </div>

      {/* Results Grid */}
      {error ? (
        <div className="text-center py-12 bg-red-900/20 rounded-lg border border-red-700/50">
          <div className="text-red-400 mb-4">
            <p className="text-lg font-medium">Error Loading Meals</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            onClick={() => fetchAllMeals()}
            className="bg-red-700 hover:bg-red-600"
          >
            Try Again
          </Button>
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="text-center py-12 bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-700/50">
          <ChefHat className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h3 className="text-lg font-medium text-amber-200 mb-2">No meals found</h3>
          <p className="text-gray-400 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="border-amber-700/50 text-amber-200 hover:bg-amber-800/30"
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {paginatedMeals.map((meal) => (
              <MealCard
                key={meal.MealID}
                meal={meal}
                onClick={handleMealClick}
                showExtendedInfo={true}
                maxFoodsToShow={3}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-amber-700/50 text-amber-200 hover:bg-amber-800/30 disabled:opacity-50"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-amber-700 hover:bg-amber-600" 
                      : "border-amber-700/50 text-amber-200 hover:bg-amber-800/30"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-amber-700/50 text-amber-200 hover:bg-amber-800/30 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Meal Details Modal */}
      <MealModal
        meal={selectedMeal}
        isOpen={isMealModalOpen}
        onClose={closeMealModal}
      />
    </div>
  );
}