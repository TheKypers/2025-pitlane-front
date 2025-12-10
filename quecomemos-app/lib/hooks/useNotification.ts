"use client";

import { useState } from 'react';
import { NotificationType } from '@/components/modals/notification-modal';

interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showNotification = (
    type: NotificationType, 
    title: string, 
    message: string
  ) => {
    console.log('showNotification called with:', { type, title, message });
    setNotification({
      isOpen: true,
      type,
      title,
      message
    });
    console.log('Notification state set to open');
  };

  const showSuccess = (title: string, message: string) => {
    console.log('showSuccess called with:', { title, message });
    showNotification('success', title, message);
  };

  const showError = (title: string, message: string) => {
    showNotification('error', title, message);
  };

  const showWarning = (title: string, message: string) => {
    showNotification('warning', title, message);
  };

  const showInfo = (title: string, message: string) => {
    showNotification('info', title, message);
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeNotification
  };
}