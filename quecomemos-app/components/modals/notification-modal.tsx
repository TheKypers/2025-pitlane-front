"use client";

import { useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import { CheckCircle, XCircle, X, AlertCircle, Info } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: NotificationType;
  title: string;
  message: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  customIcon?: React.ReactNode;
  showProgressBar?: boolean;
  isStacked?: boolean;
  stackIndex?: number;
  isClosing?: boolean;
}

export function NotificationModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  autoClose = true,
  autoCloseTime = 3000,
  customIcon,
  showProgressBar = true,
  isStacked = false,
  stackIndex = 0,
  isClosing = false
}: NotificationModalProps) {
  
  // Auto close functionality
    useEffect(() => {
      // For stacked notifications, the global context handles auto-close timing
      if (isOpen && autoClose && !isStacked) {
        const timer = setTimeout(() => {
          onClose();
        }, autoCloseTime);

        return () => clearTimeout(timer);
      }
  }, [isOpen, autoClose, autoCloseTime, onClose, isStacked]);

  // Close modal with ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Portal container to escape any parent stacking contexts (filters/blur)
  const portalElRef = useRef<HTMLDivElement | null>(null);
  if (typeof document !== 'undefined' && !portalElRef.current && !isStacked) {
    portalElRef.current = document.createElement('div');
  }

  useEffect(() => {
    const el = portalElRef.current;
    if (!el || isStacked) return;
    // ensure it's appended at the end of body so it's above other elements
    document.body.appendChild(el);
    return () => {
      if (document.body.contains(el)) document.body.removeChild(el);
    };
  }, [isStacked]);

  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          iconBg: "bg-green-100 dark:bg-green-900/30",
          iconColor: "text-green-600 dark:text-green-400",
          borderColor: "border-green-200 dark:border-green-800",
          titleColor: "text-green-800 dark:text-green-300",
          messageColor: "text-green-700 dark:text-green-400",
          progressColor: "bg-green-500"
        };
      case "error":
        return {
          icon: <XCircle className="w-4 h-4" />,
          iconBg: "bg-red-100 dark:bg-red-900/30",
          iconColor: "text-red-600 dark:text-red-400",
          borderColor: "border-red-200 dark:border-red-800",
          titleColor: "text-red-800 dark:text-red-300",
          messageColor: "text-red-700 dark:text-red-400",
          progressColor: "bg-red-500"
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          titleColor: "text-yellow-800 dark:text-yellow-300",
          messageColor: "text-yellow-700 dark:text-yellow-400",
          progressColor: "bg-yellow-500"
        };
      case "info":
        return {
          icon: <Info className="w-4 h-4" />,
          iconBg: "bg-blue-100 dark:bg-blue-900/30",
          iconColor: "text-blue-600 dark:text-blue-400",
          borderColor: "border-blue-200 dark:border-blue-800",
          titleColor: "text-blue-800 dark:text-blue-300",
          messageColor: "text-blue-700 dark:text-blue-400",
          progressColor: "bg-blue-500"
        };
      default:
        return {
          icon: <Info className="w-4 h-4" />,
          iconBg: "bg-muted",
          iconColor: "text-muted-foreground",
          borderColor: "border-border",
          titleColor: "text-foreground",
          messageColor: "text-muted-foreground",
          progressColor: "bg-primary"
        };
    }
  };

  const { icon, iconBg, iconColor, borderColor, titleColor, messageColor, progressColor } = getIconAndColors();

  if (!isOpen) return null;

  const animationClass = isClosing
    ? 'animate-out slide-out-to-right-full fade-out-0'
    : 'animate-in slide-in-from-right-full fade-in-0';

  const innerStyle: React.CSSProperties | undefined = isStacked
    ? { filter: `saturate(${1 - Math.min(stackIndex * 0.05, 0.4)})` }
    : undefined;

  const modal = (
    <div className={`${isStacked ? '' : 'fixed top-4 right-4 z-[99999]'} pointer-events-auto max-w-sm sm:max-w-md`}>      
      {/* Toast Notification */}
      <div
        className={`bg-card border ${borderColor} rounded-lg shadow-lg w-full transform transition-all duration-300 ease-out ${animationClass} pointer-events-auto ${isStacked ? '' : 'mx-4 sm:mx-0'}`}
        style={innerStyle}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-full ${iconBg} shrink-0`}>
              <div className={iconColor}>
                {customIcon || icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium ${titleColor} mb-1`}>
                {title}
              </h3>
              <p className={`text-xs ${messageColor} leading-relaxed`}>
                {message}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors ml-2 shrink-0"
            aria-label="Close notification"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar for auto-close */}
        {autoClose && showProgressBar && (
          <div className="px-4 pb-3">
            <div className="w-full bg-muted rounded-full h-0.5 overflow-hidden">
              <div 
                className={`h-full transition-all ease-linear ${progressColor}`}
                style={{
                  animation: `shrink ${autoCloseTime}ms linear forwards`
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );

  if (!isStacked && portalElRef.current) {
    return ReactDOM.createPortal(modal, portalElRef.current);
  }

  return modal;
}