'use client';

import React from 'react';
import { MealSelectionModal } from '@/components/meal';

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
  return (
    <MealSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onPropose}
      groupId={groupId}
      title="Propose Your Meal"
      description="Choose a meal to compete in the egg clicker game"
      confirmButtonText="Propose Meal"
      primaryColor="yellow"
    />
  );
}
