'use client';

import { Flame } from 'lucide-react';

export type SemaphoreStatus = 'green' | 'yellow' | 'red';

interface CalorieSemaphoreProps {
  status: SemaphoreStatus;
  calories?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CalorieSemaphore({ 
  status, 
  calories,
  showLabel = true,
  size = 'md'
}: CalorieSemaphoreProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-700/20',
      border: 'border-green-600',
      text: 'text-green-200',
      icon: 'text-green-400'
    },
    yellow: {
      bg: 'bg-yellow-700/20',
      border: 'border-yellow-600',
      text: 'text-yellow-200',
      icon: 'text-yellow-400'
    },
    red: {
      bg: 'bg-red-700/20',
      border: 'border-red-600',
      text: 'text-red-200',
      icon: 'text-red-400'
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const labels = {
    green: 'Low cal',
    yellow: 'Moderate',
    red: 'High cal'
  };

  const colors = colorClasses[status];

  return (
    <div className={`inline-flex items-center gap-1.5 ${colors.bg} border ${colors.border} ${colors.text} rounded-full ${sizeClasses[size]}`}>
      <Flame className={`${iconSizes[size]} ${colors.icon}`} />
      {showLabel && <span className="font-medium">{labels[status]}</span>}
      {calories !== undefined && (
        <span className="font-bold">{calories} kcal</span>
      )}
    </div>
  );
}

interface CalorieSemaphoreIndicatorProps {
  status: SemaphoreStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function CalorieSemaphoreIndicator({ 
  status,
  size = 'md'
}: CalorieSemaphoreIndicatorProps) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full`}
      title={`Calorie status: ${status}`}
    />
  );
}
