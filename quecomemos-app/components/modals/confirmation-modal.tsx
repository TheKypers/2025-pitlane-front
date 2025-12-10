'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, HelpCircle, Info, AlertCircle } from 'lucide-react';

export type ConfirmationType = 'danger' | 'warning' | 'info' | 'question';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type?: ConfirmationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  customIcon?: React.ReactNode;
}

const getIconAndColors = (type: ConfirmationType) => {
  switch (type) {
    case 'danger':
      return {
        icon: <AlertTriangle className="w-6 h-6" />,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
        border: 'border-red-200 dark:border-red-800/30'
      };
    case 'warning':
      return {
        icon: <AlertCircle className="w-6 h-6" />,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        confirmButton: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600',
        border: 'border-amber-200 dark:border-amber-800/30'
      };
    case 'info':
      return {
        icon: <Info className="w-6 h-6" />,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
        border: 'border-blue-200 dark:border-blue-800/30'
      };
    case 'question':
      return {
        icon: <HelpCircle className="w-6 h-6" />,
        iconBg: 'bg-purple-100 dark:bg-purple-900/30',
        iconColor: 'text-purple-600 dark:text-purple-400',
        confirmButton: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600',
        border: 'border-purple-200 dark:border-purple-800/30'
      };
    default:
      return {
        icon: <AlertTriangle className="w-6 h-6" />,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
        border: 'border-red-200 dark:border-red-800/30'
      };
  }
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type = 'danger',
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  customIcon
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const { icon, iconBg, iconColor, confirmButton, border } = getIconAndColors(type);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[9998] p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={`
        bg-background 
        rounded-2xl 
        shadow-2xl 
        w-full 
        max-w-md 
        p-6 
        border 
        ${border}
        animate-in 
        slide-in-from-bottom-4 
        zoom-in-95 
        duration-300
        relative
      `}>
        <div className="text-center">
          {/* Icon */}
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBg} mb-4`}>
            <div className={iconColor}>
              {customIcon || icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="min-w-[80px] transition-all duration-200"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`min-w-[80px] text-white transition-all duration-200 ${confirmButton}`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}