'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import AddMealForm from '../meal/AddMealForm';
import { MealSearchBar } from '../meal/MealSearchBar';
import { MealComposition } from '../meal/MealComposition';
import { MealPortionSelector, type PortionData } from '../meal';
import { fetchGroupDietaryInfo } from '@/lib/utils/groupService';
import { Group } from '../groups/index';
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

interface RegisterMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mealData: { 
    mealId: number; 
    date: string; 
    portions?: PortionData; 
  }) => void;
  group?: Group | null; // For group meal registration
}

export function RegisterMealModal({ isOpen, onClose, onSubmit, group }: RegisterMealModalProps) {
  const { userData } = useUser();
  const { allMeals, addMeal } = useMeals();
  
  // Form state
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealDate, setMealDate] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Group restrictions state
  const [groupDietaryInfo, setGroupDietaryInfo] = useState<GroupDietaryInfo | null>(null);
  
  // Create new meal state
  const [showCreateMeal, setShowCreateMeal] = useState(false);
  
  // Date/time selection mode
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [showDateTimeSelection, setShowDateTimeSelection] = useState(false);

  // Portion selection state
  const [portionMode, setPortionMode] = useState<'full' | 'partial'>('full');
  const [showPortionSelector, setShowPortionSelector] = useState(false);
  const [selectedPortions, setSelectedPortions] = useState<PortionData | null>(null);
  
  // Ignore dietary restrictions state
  const [ignoreDietaryWarnings, setIgnoreDietaryWarnings] = useState(false);

  const profile = userData?.profile;
  const userRestrictions = userData?.preferences?.dietaryRestrictions || [];
  const groupRestrictions = groupDietaryInfo?.dietaryRestrictions?.map(r => r.DietaryRestrictionID) || [];
  const isGroupMode = !!group;

  // Fetch meal details with alerts when meal is selected
  const { meal: mealWithAlerts } = useMealWithAlerts(selectedMeal?.MealID || 0);

  // Fetch group dietary info when group is provided
  useEffect(() => {
    const fetchGroupInfo = async () => {
      if (group && isOpen) {
        try {
          const info = await fetchGroupDietaryInfo(group.GroupID.toString());
          setGroupDietaryInfo(info);
        } catch (error) {
          console.error('Error fetching group dietary info:', error);
        }
      }
    };

    fetchGroupInfo();
  }, [group, isOpen]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedMeal) {
      setError('Please select a meal.');
      return;
    }

    // Validate date/time based on mode
    if (!useCurrentTime && (!mealDate || !mealTime)) {
      setError('Please select a date and time.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalDateTime: string;
      
      if (useCurrentTime) {
        // Use current date and time
        finalDateTime = new Date().toISOString();
      } else {
        // Combine selected date and time
        finalDateTime = new Date(`${mealDate}T${mealTime}`).toISOString();
      }

      await onSubmit({ 
        mealId: selectedMeal.MealID, 
        date: finalDateTime,
        portions: selectedPortions || undefined
      });
      handleClose();
    } catch {
      setError('Failed to register meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close and reset form
  const handleClose = useCallback(() => {
    setSelectedMeal(null);
    setMealDate('');
    setMealTime('');
    setError(null);
    setShowCreateMeal(false);
    setUseCurrentTime(true);
    setShowDateTimeSelection(false);
    setPortionMode('full');
    setShowPortionSelector(false);
    setSelectedPortions(null);
    setIgnoreDietaryWarnings(false);
    onClose();
  }, [onClose]);

  // Handle closing the AddMealForm
  const handleCloseAddMealForm = () => {
    setShowCreateMeal(false);
    setError(null);
  };

  // Handle register now button
  const handleRegisterNow = () => {
    setUseCurrentTime(true);
    setShowDateTimeSelection(true);
  };

  // Handle choose date/time button
  const handleChooseDateTime = () => {
    setUseCurrentTime(false);
    setShowDateTimeSelection(true);
    // Set default values for date and time if empty
    if (!mealDate) {
      setMealDate(new Date().toISOString().split('T')[0]);
    }
    if (!mealTime) {
      setMealTime(new Date().toTimeString().slice(0, 5));
    }
  };

  // Go back to time selection
  const handleBackToTimeSelection = () => {
    setShowDateTimeSelection(false);
  };

  // Handle when a new meal is successfully created
  const handleMealAdded = async (newMeal: Meal) => {
    // Add the new meal to context instead of refetching
    if (profile?.id && newMeal) {
      addMeal(newMeal);
    }
    
    // Automatically select the newly created meal if it has ID
    if (newMeal && newMeal.MealID) {
      setSelectedMeal(newMeal);
    }
    
    // Return to the main form
    setShowCreateMeal(false);
  };

  // Close modal with ESC key and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCreateMeal) {
          setShowCreateMeal(false);
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, showCreateMeal, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-200">
                {group ? `Register Meal for ${group.name}` : 'Register Meal'}
              </h2>
              <p className="text-gray-300 mt-1">
                {group ? 'Add a meal consumption for your group' : 'Track your meal consumption'}
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
        <div className="p-6">
          {!showCreateMeal ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              {/* Group Info */}
              {group && groupDietaryInfo && (
                <div className="p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                  <h3 className="text-amber-200 font-medium mb-2">Group Dietary Information</h3>
                  <div className="text-sm text-gray-300">
                    <p>Members: {group.members?.length || 0}</p>
                    {groupDietaryInfo.dietaryRestrictions.length > 0 && (
                      <p>Group Restrictions: {groupDietaryInfo.dietaryRestrictions.map(r => r.name).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Meal Search Section */}
              <div className="space-y-3">
                {/* Meal Search */}
                <MealSearchBar
                  allMeals={allMeals}
                  selectedMeal={selectedMeal}
                  onMealSelect={setSelectedMeal}
                  userRestrictions={userRestrictions}
                  groupRestrictions={groupRestrictions}
                  isGroupMode={isGroupMode}
                  showCreateButton={true}
                  onCreateClick={() => setShowCreateMeal(true)}
                  showAdvancedFilters={true}
                />

                {/* Selected Meal Composition */}
                {selectedMeal && (
                  <div className="space-y-3">
                    <MealComposition meal={selectedMeal} />
                    
                    {/* Dietary and Calorie Alerts */}
                    {mealWithAlerts && (
                      <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                        {/* Dietary Alert */}
                        {mealWithAlerts.dietaryFitness && (
                          <div className="space-y-2">
                            <DietaryAlert 
                              isFit={mealWithAlerts.dietaryFitness.isFit}
                              conflicts={mealWithAlerts.dietaryFitness.conflicts}
                              size="md"
                            />
                            
                            {/* Ignore Dietary Warnings Button */}
                            {!mealWithAlerts.dietaryFitness.isFit && (
                              <button
                                type="button"
                                onClick={() => setIgnoreDietaryWarnings(!ignoreDietaryWarnings)}
                                className={`w-full px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                                  ignoreDietaryWarnings
                                    ? 'bg-orange-600 border-orange-500 text-white hover:bg-orange-700'
                                    : 'bg-neutral-700 border-neutral-600 text-gray-300 hover:bg-neutral-600'
                                }`}
                              >
                                {ignoreDietaryWarnings
                                  ? '⚠️ Ignoring dietary warnings - Click to re-enable'
                                  : '🔓 Ignore dietary restrictions for this meal'}
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Calorie Semaphore with Portion Consideration */}
                        {mealWithAlerts.totalKcal !== undefined && profile?.calorie_goal && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-400 font-medium">Nutritional Impact:</p>
                            <CalorieSemaphore 
                              status={
                                (() => {
                                  const portionFraction = portionMode === 'partial' && selectedPortions 
                                    ? selectedPortions.portionFraction 
                                    : 1;
                                  const adjustedCalories = mealWithAlerts.totalKcal * portionFraction;
                                  const dailyGoal = profile.calorie_goal || 2000;
                                  const mealThreshold = dailyGoal / 3;
                                  const redThreshold = (dailyGoal * 4) / 3;
                                  
                                  if (adjustedCalories <= mealThreshold) return 'green';
                                  if (adjustedCalories > redThreshold) return 'red';
                                  return 'yellow';
                                })()
                              }
                              calories={Math.round(
                                mealWithAlerts.totalKcal * 
                                (portionMode === 'partial' && selectedPortions 
                                  ? selectedPortions.portionFraction 
                                  : 1)
                              )}
                              size="md"
                            />
                            {portionMode === 'partial' && selectedPortions && (
                              <p className="text-xs text-gray-400">
                                Based on {(selectedPortions.portionFraction * 100).toFixed(0)}% portion
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Portion Selection Option */}
                {selectedMeal && !showPortionSelector && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-amber-200">
                      Portion Selection
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPortionMode('full');
                          setSelectedPortions(null);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          portionMode === 'full'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">Full Meal</div>
                          <div className="text-xs opacity-80 mt-1">100% of all foods</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPortionMode('partial');
                          setShowPortionSelector(true);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          portionMode === 'partial'
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-amber-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="font-semibold">Partial Portion</div>
                          <div className="text-xs opacity-80 mt-1">
                            {selectedPortions 
                              ? `${(selectedPortions.portionFraction * 100).toFixed(0)}% selected`
                              : 'Customize amounts'
                            }
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateMeal(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Create New Meal
                  </button>
                </div>
              </div>

              {/* Portion Selector Modal */}
              {showPortionSelector && selectedMeal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
                  <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
                    <div className="p-6 bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-b border-amber-800/30">
                      <h3 className="text-xl font-bold text-amber-200">Select Portion</h3>
                      <p className="text-neutral-300 mt-1 text-sm">
                        Customize how much of {selectedMeal.name} you consumed
                      </p>
                    </div>
                    <div className="p-6">
                      <MealPortionSelector
                        meal={{
                          mealId: selectedMeal.MealID,
                          name: selectedMeal.name,
                          description: selectedMeal.description,
                          mealFoods: selectedMeal.mealFoods.map(mf => ({
                            foodId: mf.food.FoodID,
                            foodName: mf.food.name,
                            quantity: mf.quantity,
                            svgLink: mf.food.svgLink,
                            kCal: mf.food.kCal
                          })),
                          totalCalories: selectedMeal.mealFoods.reduce(
                            (sum, mf) => sum + mf.food.kCal * mf.quantity,
                            0
                          )
                        }}
                        onConfirm={(portionData) => {
                          setSelectedPortions(portionData);
                          setShowPortionSelector(false);
                        }}
                        onCancel={() => {
                          setShowPortionSelector(false);
                          setPortionMode('full');
                          setSelectedPortions(null);
                        }}
                        loading={false}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Date/Time Selection Mode */}
              {!showDateTimeSelection ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-amber-200">
                    When did you eat this meal? <span className="text-red-400">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Register Now Button */}
                    <button
                      type="button"
                      onClick={handleRegisterNow}
                      disabled={!selectedMeal || isSubmitting || (!ignoreDietaryWarnings && mealWithAlerts?.dietaryFitness && !mealWithAlerts.dietaryFitness.isFit)}
                      className="p-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium border-2 border-transparent hover:border-amber-500 disabled:border-gray-500"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Register Now</div>
                        <div className="text-sm opacity-90 mt-1">
                          Current time: {new Date().toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </button>

                    {/* Choose Date/Time Button */}
                    <button
                      type="button"
                      onClick={handleChooseDateTime}
                      disabled={!selectedMeal || isSubmitting || (!ignoreDietaryWarnings && mealWithAlerts?.dietaryFitness && !mealWithAlerts.dietaryFitness.isFit)}
                      className="p-4 bg-neutral-700 hover:bg-neutral-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium border-2 border-transparent hover:border-neutral-500 disabled:border-gray-500"
                    >
                      <div className="text-center">
                        <div className="font-semibold">Choose Date & Time</div>
                        <div className="text-sm opacity-90 mt-1">
                          Specify when you ate this meal
                        </div>
                      </div>
                    </button>
                  </div>

                  {!selectedMeal ? (
                    <p className="text-sm text-gray-400 text-center">
                      Please select a meal first
                    </p>
                  ) : (!ignoreDietaryWarnings && mealWithAlerts?.dietaryFitness && !mealWithAlerts.dietaryFitness.isFit) ? (
                    <p className="text-sm text-orange-400 text-center font-medium">
                      ⚠️ Dietary conflicts detected. Click &quot;Ignore dietary restrictions&quot; above to proceed.
                    </p>
                  ) : null}
                </div>
              ) : (
                /* Date/Time Selection Form */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-amber-200">
                      {useCurrentTime ? 'Register Now' : 'Choose Date & Time'} <span className="text-red-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleBackToTimeSelection}
                      className="text-xs text-gray-400 hover:text-gray-200 underline"
                    >
                      Back to time options
                    </button>
                  </div>

                  {useCurrentTime ? (
                    <div className="p-4 bg-neutral-800 rounded-lg border border-amber-600/30">
                      <p className="text-gray-300">
                        Meal will be registered at: <span className="text-amber-200 font-medium">
                          {new Date().toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mealDate" className="block text-sm font-medium text-gray-300 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          id="mealDate"
                          value={mealDate}
                          onChange={(e) => setMealDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label htmlFor="mealTime" className="block text-sm font-medium text-gray-300 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          id="mealTime"
                          value={mealTime}
                          onChange={(e) => setMealTime(e.target.value)}
                          className="w-full px-3 py-2 bg-neutral-800 text-gray-100 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedMeal || (!useCurrentTime && (!mealDate || !mealTime)) || (!ignoreDietaryWarnings && mealWithAlerts?.dietaryFitness && !mealWithAlerts.dietaryFitness.isFit)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                  >
                    {isSubmitting ? 'Registering...' : 'Register Meal'}
                  </button>
                  
                  {/* Dietary warning reminder in date/time section */}
                  {!ignoreDietaryWarnings && mealWithAlerts?.dietaryFitness && !mealWithAlerts.dietaryFitness.isFit && (
                    <p className="text-xs text-orange-400 text-center font-medium">
                      ⚠️ Dietary conflicts detected. Return to meal selection and enable "Ignore dietary restrictions" to proceed.
                    </p>
                  )}
                </div>
              )}
            </form>
          ) : (
            /* Create New Meal Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-amber-200">Create New Meal</h3>
                <button
                  onClick={handleCloseAddMealForm}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <AddMealForm 
                onFoodAdded={(meal) => handleMealAdded(meal as Meal)}
                onClose={handleCloseAddMealForm}
                initialMealName={undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}