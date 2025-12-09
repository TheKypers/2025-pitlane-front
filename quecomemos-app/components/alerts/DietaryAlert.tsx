'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';

interface DietaryAlertProps {
  isFit: boolean;
  conflicts?: Array<{
    foodName: string;
    conflicts: Array<{
      id: number;
      name: string;
    }>;
  }>;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function DietaryAlert({ 
  isFit, 
  conflicts = [], 
  size = 'md',
  showIcon = true 
}: DietaryAlertProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  if (isFit) {
    return (
      <div className={`flex items-center gap-1.5 bg-green-700/20 border border-green-600 text-green-200 rounded ${sizeClasses[size]}`}>
        {showIcon && <CheckCircle className={iconSizes[size]} />}
        <span className="font-medium">Fit for you</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-1.5 bg-red-700/20 border border-red-600 text-red-200 rounded ${sizeClasses[size]}`}>
        {showIcon && <AlertTriangle className={iconSizes[size]} />}
        <span className="font-medium">Dietary conflict detected</span>
      </div>
      {conflicts.length > 0 && (
        <div className="space-y-1 text-xs">
          <p className="text-red-300 font-medium">Conflicting ingredients:</p>
          <ul className="space-y-1 pl-4">
            {conflicts.map((conflict, idx) => (
              <li key={idx} className="text-red-200/90">
                <span className="font-semibold">{conflict.foodName}</span>
                {conflict.conflicts && conflict.conflicts.length > 0 && (
                  <span className="text-red-300/70">
                    {' '}- does not contain restrictions: {conflict.conflicts.map(c => c.name).join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface DietaryBadgeProps {
  isFit: boolean;
  compact?: boolean;
}

export function DietaryBadge({ isFit, compact = false }: DietaryBadgeProps) {
  if (isFit) {
    return (
      <span className={`inline-flex items-center gap-1 bg-green-700/20 border border-green-600 text-green-200 rounded-full ${compact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
        <CheckCircle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
        {!compact && <span>Fit for you</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 bg-red-700/20 border border-red-600 text-red-200 rounded-full ${compact ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
      <AlertTriangle className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      {!compact && <span>Warning</span>}
    </span>
  );
}
