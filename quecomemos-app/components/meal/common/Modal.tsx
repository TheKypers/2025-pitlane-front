'use client';
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { COMMON_STYLES, Z_INDEX } from "../constants";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl', 
  lg: 'max-w-4xl',
  xl: 'max-w-6xl'
};

export default function Modal({ 
  open, 
  onClose, 
  title, 
  children, 
  className = "",
  size = 'md',
  showCloseButton = true 
}: ModalProps) {
  if (!open) return null;

  const modal = (
    <div 
      className={COMMON_STYLES.MODAL_CONTAINER}
      style={{ zIndex: Z_INDEX.MODAL_CONTAINER }}
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className={COMMON_STYLES.MODAL_BACKDROP}
        onClick={onClose}
        aria-label="Close modal"
      />
      
      {/* Modal Content */}
      <Card 
        className={`relative bg-neutral-900 border-amber-800/30 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden ${className}`}
        style={{ zIndex: Z_INDEX.MODAL_CONTENT }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
          <h4 className={`${COMMON_STYLES.TEXT_AMBER_PRIMARY} font-semibold text-sm md:text-base`}>
            {title}
          </h4>
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className={`p-2 ${COMMON_STYLES.TEXT_AMBER_SECONDARY} hover:text-amber-50 transition-colors`}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 max-h-[85vh] overflow-y-auto">
          {children}
        </div>
      </Card>
    </div>
  );

  return createPortal(modal, document.body);
}