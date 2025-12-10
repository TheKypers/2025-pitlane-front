import { useState } from "react";

/**
 * Generic hook for managing form submission states
 */
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withSubmission = async <T>(action: () => Promise<T>): Promise<T | null> => {
    if (isSubmitting) return null;
    
    setIsSubmitting(true);
    try {
      const result = await action();
      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    withSubmission
  };
}

/**
 * Hook for managing modal open/close state with optional callbacks
 */
export function useModal(onOpen?: () => void, onClose?: () => void) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
    onOpen?.();
  };

  const closeModal = () => {
    setIsOpen(false);
    onClose?.();
  };

  const toggleModal = () => {
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
}

/**
 * Hook for managing dietary restrictions state
 */
export function useDietaryRestrictions(
  initialRestrictions: number[] = [],
  initialHasRestrictions: boolean | null = null
) {
  const [restrictions, setRestrictions] = useState<number[]>(initialRestrictions);
  const [hasRestrictions, setHasRestrictions] = useState<boolean | null>(initialHasRestrictions);

  const clearRestrictions = () => {
    setRestrictions([]);
    setHasRestrictions(null);
  };

  const setNoRestrictions = () => {
    setRestrictions([]);
    setHasRestrictions(true);
  };

  const setSpecificRestrictions = (newRestrictions: number[]) => {
    setRestrictions(newRestrictions);
    setHasRestrictions(false);
  };

  return {
    restrictions,
    setRestrictions,
    hasRestrictions,
    setHasRestrictions,
    clearRestrictions,
    setNoRestrictions,
    setSpecificRestrictions
  };
}