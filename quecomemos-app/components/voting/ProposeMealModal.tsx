'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { MealSearchBar } from '../meal/MealSearchBar';
import { MealComposition } from '../meal/MealComposition';
import AddMealForm from '../meal/AddMealForm';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';
import { fetchGroupDietaryInfo } from '@/lib/utils/groupService';
import { DietaryAlert, CalorieSemaphore } from '@/components/alerts';
import { useMealWithAlerts } from '@/lib/hooks/useMealWithAlerts';

interface GroupDietaryInfo {
  dietaryRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
  preferences: Array<{
    PreferenceID: number; 
    name: string;
  }>;
}

interface ProposeMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (mealId: number) => void;
  groupId: number;
}

export function ProposeMealModal({ isOpen, onClose, onPropose, groupId }: ProposeMealModalProps) {
  const { userData } = useUser();
  const { allMeals } = useMeals();
  
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [groupDietaryInfo, setGroupDietaryInfo] = useState<GroupDietaryInfo | null>(null);
  const [showCreateMeal, setShowCreateMeal] = useState(false);

  const userRestrictions = userData?.preferences?.dietaryRestrictions || [];
  const groupRestrictions = groupDietaryInfo?.dietaryRestrictions?.map(r => r.DietaryRestrictionID) || [];
  const profile = userData?.profile;

  // Fetch meal details with alerts when meal is selected
  const { meal: mealWithAlerts } = useMealWithAlerts(selectedMeal?.MealID || 0);

  // Fetch group dietary info when modal opens
  React.useEffect(() => {
    const fetchGroupInfo = async () => {
      if (groupId && isOpen) {
        try {
          const info = await fetchGroupDietaryInfo(groupId.toString());
          setGroupDietaryInfo(info);
        } catch (error) {
          console.error('Error fetching group dietary info:', error);
        }
      }
    };

    fetchGroupInfo();
  }, [groupId, isOpen]);

  const handlePropose = () => {
    if (selectedMeal) {
      onPropose(selectedMeal.MealID);
      setSelectedMeal(null);
    }
  };

  const handleClose = () => {
    setSelectedMeal(null);
    setShowCreateMeal(false);
    onClose();
  };

  const handleMealCreated = (createdMeal: Partial<Meal> & { MealID: number }) => {
    // When a new meal is created, select it automatically and show it
    setShowCreateMeal(false);
    // Cast to Meal since we know it has the essential properties
    setSelectedMeal(createdMeal as Meal);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-200">Propose a Meal</h2>
              <p className="text-gray-300 mt-1">
                Choose a meal to propose for the group voting
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group Info */}
          {groupDietaryInfo && (
            <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
              <h3 className="text-amber-200 font-medium mb-2">Group Dietary Information</h3>
              <div className="text-sm text-gray-300">
                {groupDietaryInfo.dietaryRestrictions.length > 0 && (
                  <p>Group Restrictions: {groupDietaryInfo.dietaryRestrictions.map(r => r.name).join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Meal Search */}
          <div className="space-y-4">
            {!showCreateMeal ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">Search for an existing meal or create a new one</p>
                  <button
                    onClick={() => setShowCreateMeal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Meal
                  </button>
                </div>

                <MealSearchBar
                  allMeals={allMeals}
                  selectedMeal={selectedMeal}
                  onMealSelect={setSelectedMeal}
                  userRestrictions={userRestrictions}
                  groupRestrictions={groupRestrictions}
                  isGroupMode={true}
                  showAdvancedFilters={true}
                  placeholder="Search for a meal to propose..."
                />

                {/* Selected Meal Composition */}
                {selectedMeal && (
                  <div className="space-y-4">
                    <MealComposition meal={selectedMeal} />
                    
                    {/* Dietary and Calorie Alerts - Below Meal Composition */}
                    {mealWithAlerts && (
                      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        {/* Dietary Alert */}
                        {mealWithAlerts.dietaryFitness && (
                          <DietaryAlert 
                            isFit={mealWithAlerts.dietaryFitness.isFit}
                            conflicts={mealWithAlerts.dietaryFitness.conflicts}
                            size="md"
                          />
                        )}
                        
                        {/* Calorie Semaphore */}
                        {mealWithAlerts.totalKcal !== undefined && profile?.calorie_goal && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-medium">Nutritional Impact:</p>
                            <CalorieSemaphore 
                              status={mealWithAlerts.calorieStatus || 'green'}
                              calories={mealWithAlerts.totalKcal}
                              size="md"
                            />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePropose}
                        className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Propose This Meal
                      </button>
                    </div>
                  </div>
                )}

                {!selectedMeal && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Select a meal from the search above to propose it for voting</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowCreateMeal(false)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Back to Search
                  </button>
                </div>

                <div className="bg-neutral-800 rounded-lg p-6">
                  <AddMealForm 
                    onFoodAdded={handleMealCreated}
                    onClose={() => setShowCreateMeal(false)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}