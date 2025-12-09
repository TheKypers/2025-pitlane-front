'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { MealSearchBar } from '@/components/meal/MealSearchBar';
import { MealComposition } from '@/components/meal/MealComposition';
import AddMealForm from '@/components/meal/AddMealForm';
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

interface ProposeGameMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (mealId: number) => void;
  groupId: number;
}

export function ProposeGameMealModal({
  isOpen,
  onClose,
  onPropose,
  groupId,
}: ProposeGameMealModalProps) {
  const { userData } = useUser();
  const { allMeals } = useMeals();

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [groupDietaryInfo, setGroupDietaryInfo] = useState<GroupDietaryInfo | null>(null);
  const [showCreateMeal, setShowCreateMeal] = useState(false);

  const userRestrictions = userData?.preferences?.dietaryRestrictions || [];
  const groupRestrictions =
    groupDietaryInfo?.dietaryRestrictions?.map((r) => r.DietaryRestrictionID) || [];
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
    setShowCreateMeal(false);
    setSelectedMeal(createdMeal as Meal);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border border-yellow-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-b border-yellow-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">Propose Your Meal</h2>
              <p className="text-gray-300 mt-1">
                Choose a meal to compete in the egg clicker game
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
          {!showCreateMeal ? (
            <>
              {/* Meal Search */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Select a Meal
                  </h3>
                  <button
                    onClick={() => setShowCreateMeal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Meal
                  </button>
                </div>

                <MealSearchBar
                  allMeals={allMeals}
                  onMealSelect={setSelectedMeal}
                  selectedMeal={selectedMeal}
                  userRestrictions={userRestrictions}
                  groupRestrictions={groupRestrictions}
                  isGroupMode={true}
                />
              </div>

              {/* Selected Meal Preview */}
              {selectedMeal && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-yellow-400">
                    Selected Meal
                  </h3>
                  <div className="bg-neutral-800/50 rounded-xl p-4 border border-yellow-700/30">
                    <MealComposition meal={selectedMeal} />
                  </div>
                  
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
                </div>
              )}
            </>
          ) : (
            /* Create Meal Form */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-yellow-400">
                  Create New Meal
                </h3>
                <button
                  onClick={() => setShowCreateMeal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back to Selection
                </button>
              </div>
              <AddMealForm
                onFoodAdded={handleMealCreated}
                onClose={() => setShowCreateMeal(false)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!showCreateMeal && (
          <div className="p-6 bg-neutral-800/50 border-t border-yellow-800/30 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePropose}
              disabled={!selectedMeal}
              className="px-6 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Propose Meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

