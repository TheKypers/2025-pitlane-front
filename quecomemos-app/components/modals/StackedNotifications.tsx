"use client";

import { useEffect } from "react";
import ReactDOM from 'react-dom';
import { NotificationModal } from './notification-modal';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

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

interface StackedNotificationsProps {
  notifications: NotificationItem[];
  onRemove: (id: string) => void;
  onStartClose?: (id: string) => void;
}

export function StackedNotifications({ notifications, onRemove, onStartClose }: StackedNotificationsProps) {
  // Create portal container
  useEffect(() => {
    const portalEl = document.createElement('div');
    portalEl.id = 'notifications-portal';
    portalEl.className = 'fixed top-4 right-4 z-[99999] pointer-events-none';
    document.body.appendChild(portalEl);

    return () => {
      if (document.body.contains(portalEl)) {
        document.body.removeChild(portalEl);
      }
    };
  }, []);

  if (notifications.length === 0) return null;

  const portal = document.getElementById('notifications-portal');
  if (!portal) return null;

  // Sort notifications by creation time
  const sortedNotifications = [...notifications].sort((a, b) => b.createdAt - a.createdAt);

  const notificationsContainer = (
    <div className="flex flex-col gap-2 max-w-sm sm:max-w-md">
      {sortedNotifications.map((notification, index) => {
        // Calculate opacity based on position (newer notifications more opaque)
        const opacity = Math.max(0.3, 1 - (index * 0.2));
        // Calculate transform for stacking effect
        const translateY = index * 8;
        const scale = Math.max(0.95, 1 - (index * 0.02)); 

        return (
          <div
            key={notification.id}
            className="transition-all  ease-out pointer-events-auto"
            style={{
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
              zIndex: 99999 - index, // Ensure proper stacking order
            }}
          >
            <NotificationModal
              isOpen={true}
              onClose={() => (onStartClose ? onStartClose(notification.id) : onRemove(notification.id))}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              autoClose={notification.autoClose ?? true}
              autoCloseTime={notification.autoCloseTime ?? 2000}
              showProgressBar={true}
              customIcon={notification.customIcon}
              isStacked={true}
              stackIndex={index}
              isClosing={!!notification.closing}
            />
          </div>
        );
      })}
    </div>
  );

  return ReactDOM.createPortal(notificationsContainer, portal);
}