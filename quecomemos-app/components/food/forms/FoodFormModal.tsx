'use client';
import { useState } from 'react';
import FoodModal from '@/components/meal/FoodModal';
import { API_BASE_URL } from '@/lib/config/api';
import { useFoods } from '@/lib/contexts/FoodsContext';
import { useMeals } from '@/lib/contexts/MealsContext';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useConfirmation } from '@/lib/hooks/useConfirmation';
import { ConfirmationModal } from '@/components/modals';
import { FoodItem } from '@/components/meal/types';
import { Plus, Check, Trash2 } from 'lucide-react';

interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  existingFood?: {
    id?: number;
    name: string;
    kCal: number;
    svgLink?: string;
    preferences?: { name?: string; PreferenceID?: number; id?: number }[] | number[];
    dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number; RestrictionID?: number; id?: number }[] | number[];
    hasNoRestrictions?: boolean;
  } | null;
}

export function FoodFormModal({ isOpen, onClose, mode, existingFood }: FoodFormModalProps) {
  const { addFood, updateFood, removeFood } = useFoods();
  const { handleFoodDeletion } = useMeals();
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const { confirmation, showConfirmation, handleConfirm: handleConfirmAction, closeConfirmation } = useConfirmation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFoodConfirm = async (foodPayload: FoodItem) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Validate user is logged in
      if (!userData?.profile?.id) {
        throw new Error('You must be logged in to manage foods');
      }

      if (mode === 'edit' && existingFood?.id) {
        // Update existing food - match EditForm.tsx implementation exactly
        console.log('🔧 Editing food:', {
          foodId: existingFood.id,
          payload: foodPayload,
          kcalToSend: foodPayload.kcalPerUnit || foodPayload.kCal
        });
        
        const response = await fetch(`${API_BASE_URL}/foods/${existingFood.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: foodPayload.name,
            kCal: foodPayload.kcalPerUnit || foodPayload.kCal, // Calories per unit
            svgLink: foodPayload.svgLink ?? '',
            preferences: foodPayload.preferences || [],
            dietaryRestrictions: foodPayload.dietaryRestrictions || []
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          console.error('❌ Backend error:', data);
          throw new Error(data.error || 'Failed to update food');
        }

        const updatedFood = await response.json();
        
        // Update in global context - backend response first, then override with our values
        const finalUpdate = {
          ...updatedFood, // Backend response as base
          name: foodPayload.name,
          kCal: foodPayload.kcalPerUnit || foodPayload.kCal,
          svgLink: foodPayload.svgLink ?? '',
          preferences: foodPayload.preferences || [],
          dietaryRestrictions: foodPayload.dietaryRestrictions || []
        };
        
        updateFood(existingFood.id, finalUpdate);
        
        showSuccess(
          'Food Updated Successfully!',
          `"${foodPayload.name}" has been updated with all changes.`,
          <Check className="w-8 h-8" />
        );
      } else {
        // Create new food
        const hasNoRestrictions = foodPayload.hasNoRestrictions === true;
        
        const response = await fetch(`${API_BASE_URL}/foods`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: foodPayload.name,
            kCal: foodPayload.kcalPerUnit || foodPayload.kCal, // Use kcalPerUnit (per unit calories)
            svgLink: foodPayload.svgLink ?? '',
            preferences: foodPayload.preferences || [],
            dietaryRestrictions: hasNoRestrictions ? [] : (foodPayload.dietaryRestrictions || []),
            hasNoRestrictions: hasNoRestrictions,
            profileId: userData.profile.id,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create food');
        }

        const newFood = await response.json();
        
        // Add to global context
        addFood(newFood);
        
        showSuccess(
          'Food Added Successfully!',
          `"${foodPayload.name}" has been added to your food list with all selected preferences and restrictions.`,
          <Plus className="w-8 h-8" />
        );
      }

      // Close modal after a short delay to allow notification to show
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      showError(
        mode === 'edit' ? 'Failed to Update Food' : 'Failed to Add Food',
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!existingFood?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/foods/${existingFood.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete food');
      }

      // Remove from global context
      removeFood(existingFood.id);
      
      // Update meals that contain this food
      handleFoodDeletion(existingFood.id);
      
      showSuccess(
        'Food Deleted Successfully!',
        `"${existingFood.name}" has been permanently removed from your food list.`,
        <Trash2 className="w-8 h-8" />
      );
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      showError(
        'Failed to Delete Food',
        err instanceof Error ? err.message : 'An unexpected error occurred while deleting the food.'
      );
    }
  };

  const handleDeleteClick = () => {
    if (!existingFood) return;
    
    showConfirmation(
      {
        type: 'danger',
        title: 'Delete Food',
        message: `Are you sure you want to delete "${existingFood.name}"? This action cannot be undone and will remove this food from all meals.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        customIcon: <Trash2 className="w-6 h-6" />
      },
      handleDeleteFood
    );
  };

  // Convert existing food to FoodItem format for editing
  const editingItem = existingFood ? {
    id: existingFood.id,
    name: existingFood.name,
    quantity: 1, // Not used in standalone food editing
    kCal: existingFood.kCal,
    kcalPerUnit: existingFood.kCal,
    svgLink: existingFood.svgLink || '',
    // Convert preferences to number[] if needed
    preferences: Array.isArray(existingFood.preferences) 
      ? existingFood.preferences.map(p => typeof p === 'number' ? p : (p.PreferenceID || p.id || 0))
      : [],
    // Convert dietary restrictions to number[] if needed
    dietaryRestrictions: Array.isArray(existingFood.dietaryRestrictions)
      ? existingFood.dietaryRestrictions.map(d => typeof d === 'number' ? d : (d.DietaryRestrictionID || d.RestrictionID || d.id || 0))
      : [],
    hasNoRestrictions: existingFood.hasNoRestrictions ?? null,
  } : undefined;

  return (
    <>
      <FoodModal
        apiBase={API_BASE_URL}
        open={isOpen}
        onClose={onClose}
        mode={mode}
        editingItem={editingItem}
        onConfirm={handleFoodConfirm}
        forMeal={false} // This is for standalone food creation/editing
        allowDelete={mode === 'edit'} // Allow delete in edit mode
        onDelete={handleDeleteClick} // Pass delete handler
      />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirmAction}
        type={confirmation.type}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        customIcon={confirmation.customIcon}
      />
    </>
  );
}
