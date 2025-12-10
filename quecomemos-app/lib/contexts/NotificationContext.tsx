"use client";

import { createContext, useContext, useState, ReactNode, useRef, useCallback } from 'react';
import { NotificationType } from '@/components/modals/StackedNotifications';
import { StackedNotifications } from '@/components/modals/StackedNotifications';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  customIcon?: React.ReactNode;
  createdAt: number;
  closing?: boolean;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      autoClose?: boolean;
      autoCloseTime?: number;
      customIcon?: React.ReactNode;
      broadcast?: boolean;
      groupId?: number;
      notificationId?: string;
    }
  ) => void;
  showSuccess: (title: string, message: string, customIcon?: React.ReactNode) => void;
  showError: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  removeNotification: (id: string) => void;
  startCloseNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const shownNotificationIds = useRef<Set<string>>(new Set());

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const EXIT_ANIMATION_MS = 300; // duration for exit animation

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      autoClose?: boolean;
      autoCloseTime?: number;
      customIcon?: React.ReactNode;
      broadcast?: boolean;
      groupId?: number;
      notificationId?: string;
    }
  ) => {
    const notificationId = options?.notificationId || generateId();
    
    // Prevent duplicate notifications using ID deduplication
    if (shownNotificationIds.current.has(notificationId)) {
      console.log('[NotificationContext] Skipping duplicate notification:', notificationId);
      return;
    }
    
    console.log('[NotificationContext] Showing notification:', { type, title, message, notificationId });
    shownNotificationIds.current.add(notificationId);
    
    const newNotification: NotificationItem = {
      id: notificationId,
      type,
      title,
      message,
      autoClose: options?.autoClose ?? true,
      autoCloseTime: options?.autoCloseTime ?? 4000,
      customIcon: options?.customIcon,
      createdAt: Date.now(),
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification if autoClose is enabled.
    if (newNotification.autoClose) {
      const startClosingAt = Math.max(0, (newNotification.autoCloseTime ?? 4000) - EXIT_ANIMATION_MS);
      // start closing (trigger exit animation)
      setTimeout(() => {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, closing: true } : n));
      }, startClosingAt);

      // remove after full duration
      setTimeout(() => {
        removeNotification(notificationId);
        // Clean up deduplication set after notification is fully removed
        setTimeout(() => {
          shownNotificationIds.current.delete(notificationId);
        }, 1000);
      }, newNotification.autoCloseTime);
    }
  }, []);

  // Start close (manual or programmatic): mark as closing then remove after exit animation
  const startCloseNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, closing: true } : n));
    setTimeout(() => removeNotification(id), EXIT_ANIMATION_MS);
  };

  const showSuccess = (title: string, message: string, customIcon?: React.ReactNode) => {
    showNotification('success', title, message, { customIcon });
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

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };



  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        startCloseNotification,
        clearAllNotifications,
      }}
    >
      {children}
      
      {/* Global Notification Stack - Non-blocking */}
      <StackedNotifications 
        notifications={notifications}
        onRemove={removeNotification}
        onStartClose={startCloseNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useGlobalNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useGlobalNotification must be used within a NotificationProvider');
  }
  return context;
}