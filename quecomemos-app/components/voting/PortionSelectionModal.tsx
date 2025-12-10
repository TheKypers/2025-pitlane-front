'use client';

import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { VotingService } from './VotingService';
import { GameHistoryService } from '@/components/games/clicker-game/GameHistoryService';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { MealPortionSelector, type PortionData } from '@/components/meal';
import { API_BASE_URL } from '@/lib/config/api';

interface MealFood {
  foodId: number;
  foodName: string;
  quantity: number;
  svgLink?: string;
  kCal: number;
}

interface WinnerMeal {
  mealId: number;
  name: string;
  description?: string;
  mealFoods: MealFood[];
  totalCalories: number;
}

export interface PortionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  // For backwards compatibility with voting
  winnerMeal?: WinnerMeal;
  userId?: string;
  // For game sessions
  mealId?: number;
  mealName?: string;
  isGameSession?: boolean;
  // For group registration
  isRegistration?: boolean;
  groupConsumptionId?: number;
  onSuccess?: () => void;
}

export function PortionSelectionModal({
  isOpen,
  onClose,
  sessionId,
  winnerMeal,
  userId,
  mealId,
  mealName,
  isGameSession = false,
  isRegistration = false,
  groupConsumptionId,
  onSuccess,
}: PortionSelectionModalProps) {
  const { showSuccess, showError } = useGlobalNotification();
  const [loading, setLoading] = useState(false);

  const handlePortionConfirm = async (portionData: PortionData) => {
    console.log('[PortionSelectionModal] Confirming portion:', {
      isGameSession,
      isRegistration,
      groupConsumptionId,
      mealId,
      sessionId,
      userId,
      portionData: {
        portionFraction: portionData.portionFraction,
        totalCalories: portionData.totalCalories,
        mode: portionData.mode,
        foodPortions: portionData.foodPortions
      }
    });
    
    setLoading(true);
    try {
      if (isRegistration && groupConsumptionId) {
        // Group registration portion selection
        const response = await fetch(
          `${API_BASE_URL}/meal-consumptions/group/${groupConsumptionId}/portions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileId: userId,
              portionFraction: portionData.portionFraction,
              foodPortions: portionData.foodPortions
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to select portion');
        }
      } else if (isGameSession && mealId) {
        // Game session portion registration
        console.log('[PortionSelectionModal] Calling GameHistoryService with:', {
          sessionId,
          userId,
          mealId,
          mealPortionFraction: portionData.portionFraction,
          foodPortionsCount: portionData.foodPortions.length
        });
        
        await GameHistoryService.registerGameMealPortion(
          sessionId,
          userId!,
          mealId,
          portionData.portionFraction,
          portionData.foodPortions.map(fp => ({
            foodId: fp.foodId,
            portionFraction: fp.portionFraction
          }))
        );
      } else if (winnerMeal && userId) {
        // Voting session portion registration
        await VotingService.selectMealPortion(
          sessionId,
          userId,
          portionData.portionFraction,
          portionData.foodPortions
        );
      } else {
        throw new Error('Invalid configuration for portion selection');
      }

      const percentLabel = portionData.mode === 'percentage' 
        ? `${(portionData.portionFraction * 100).toFixed(1)}%`
        : 'Custom';

      const mealDisplayName = isGameSession ? mealName : winnerMeal?.name;

      showSuccess(
        'Portion Registered',
        `You've registered ${percentLabel} portion of ${mealDisplayName} (${portionData.totalCalories} kcal)`
      );

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error registering portion:', error);
      showError(
        'Registration Failed',
        error instanceof Error ? error.message : 'Failed to register portion'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const meal = winnerMeal;
  const displayMealName = isGameSession ? mealName : winnerMeal?.name;

  // Validate required data based on session type
  // For voting sessions, winnerMeal is always required
  if (!isGameSession && !meal) return null;
  
  // For game sessions, we need winnerMeal for the MealPortionSelector
  // If only mealId is provided without winnerMeal, we can't render the portion selector
  if (isGameSession && !meal) {
    console.error('[PortionSelectionModal] Game session requires winnerMeal object for portion selection');
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70">
      <div className="relative w-full max-w-2xl bg-neutral-900 rounded-2xl shadow-2xl border border-amber-800/30 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <CardHeader className={`p-6 border-b ${
          isGameSession 
            ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
            : 'bg-gradient-to-r from-amber-900/20 to-amber-800/20 border-amber-800/30'
        }`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-2xl font-bold ${
              isGameSession ? 'text-amber-400' : 'text-amber-200'
            }`}>
              Select Your Portion
            </CardTitle>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white transition-colors p-2"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-neutral-300 mt-2">
            Choose how much of <span className={`font-semibold ${
              isGameSession ? 'text-amber-400' : 'text-amber-200'
            }`}>{displayMealName}</span> you consumed
          </p>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6">
          <MealPortionSelector
            meal={meal!}
            onConfirm={handlePortionConfirm}
            onCancel={onClose}
            loading={loading}
          />
        </CardContent>
      </div>
    </div>
  );
}
