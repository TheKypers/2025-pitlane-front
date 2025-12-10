'use client';

import React from 'react';
import { MealSelectionModal } from '@/components/meal';

interface ProposeMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropose: (mealId: number) => void;
  groupId: number;
}

export function ProposeMealModal({ isOpen, onClose, onPropose, groupId }: ProposeMealModalProps) {
  return (
    <MealSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      onSelect={onPropose}
      groupId={groupId}
      title="Propose a Meal"
      description="Choose a meal to propose for the group voting"
      confirmButtonText="Propose This Meal"
      primaryColor="amber"
    />
  );
}
