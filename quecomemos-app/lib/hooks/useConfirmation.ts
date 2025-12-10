import { useState, useCallback } from 'react';
import { ConfirmationType } from '@/components/modals/confirmation-modal';

interface ConfirmationOptions {
  type?: ConfirmationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  customIcon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm?: () => void | Promise<void>;
}

export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    isLoading: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const showConfirmation = useCallback((
    options: ConfirmationOptions,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfirmation({
      ...options,
      isOpen: true,
      isLoading: false,
      onConfirm
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmation.onConfirm) return;

    try {
      setConfirmation(prev => ({ ...prev, isLoading: true }));
      await confirmation.onConfirm();
      setConfirmation(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      setConfirmation(prev => ({ ...prev, isLoading: false }));
      // Let the component handle the error (it will be thrown)
      throw error;
    }
  }, [confirmation]);

  const closeConfirmation = useCallback(() => {
    if (!confirmation.isLoading) {
      setConfirmation(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  }, [confirmation.isLoading]);

  return {
    confirmation,
    showConfirmation,
    handleConfirm,
    closeConfirmation
  };
}