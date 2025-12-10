'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { MealSearchBar } from './MealSearchBar';
import { MealComposition } from './MealComposition';
import AddMealForm from './AddMealForm';
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

interface MealSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mealId: number) => void;
  groupId?: number;
  title?: string;
  description?: string;
  confirmButtonText?: string;
  primaryColor?: 'amber' | 'yellow' | 'orange';
}

export function MealSelectionModal({
  isOpen,
  onClose,
  onSelect,
  groupId,
  title = 'Select a Meal',
  description = 'Choose a meal from your collection',
  confirmButtonText = 'Confirm Selection',
  primaryColor = 'amber'
}: MealSelectionModalProps) {
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

  const handleConfirm = () => {
    if (selectedMeal) {
      onSelect(selectedMeal.MealID);
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

  const colorClasses = {
    amber: {
      gradient: 'from-amber-900/20 to-amber-800/20',
      border: 'border-amber-800/30',
      text: 'text-amber-200',
      button: 'bg-amber-600 hover:bg-amber-700',
      info: 'bg-amber-900/20 border-amber-700/50 text-amber-200'
    },
    yellow: {
      gradient: 'from-yellow-900/20 to-yellow-800/20',
      border: 'border-yellow-800/30',
      text: 'text-yellow-400',
      button: 'bg-yellow-500 hover:bg-yellow-600',
      info: 'bg-yellow-900/20 border-yellow-700/50 text-yellow-200'
    },
    orange: {
      gradient: 'from-orange-900/20 to-orange-800/20',
      border: 'border-orange-800/30',
      text: 'text-orange-400',
      button: 'bg-orange-500 hover:bg-orange-600',
      info: 'bg-orange-900/20 border-orange-700/50 text-orange-200'
    }
  };

  const colors = colorClasses[primaryColor];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border ${colors.border} overflow-hidden max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${colors.gradient} border-b ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${colors.text}`}>{title}</h2>
              <p className="text-gray-300 mt-1">{description}</p>
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
            <div className={`p-4 ${colors.info} border rounded-lg`}>
              <h3 className={`${colors.text} font-medium mb-2`}>Group Dietary Information</h3>
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
                    className={`flex items-center gap-2 px-4 py-2 ${colors.button} text-white rounded-lg transition-colors text-sm font-medium`}
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
                  isGroupMode={!!groupId}
                  showAdvancedFilters={true}
                  placeholder="Search for a meal..."
                />

                {/* Selected Meal Composition */}
                {selectedMeal && (
                  <div className="space-y-4">
                    <MealComposition meal={selectedMeal} />
                    
                    {/* Dietary and Calorie Alerts */}
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
                        onClick={handleConfirm}
                        className={`px-6 py-2 ${colors.button} text-white rounded-lg transition-colors font-medium`}
                      >
                        {confirmButtonText}
                      </button>
                    </div>
                  </div>
                )}

                {!selectedMeal && (
                  <div className="text-center py-8 text-gray-400">
                    <p>Select a meal from the search above</p>
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
