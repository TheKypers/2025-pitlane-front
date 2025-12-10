'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';
import { BadgeDetailsModal } from './BadgeDetailsModal';
import { getDefaultBadgeIcon, LEVEL_COLORS } from './badgeHelpers';

interface PrimaryBadgeDisplayProps {
  profileId: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  clickable?: boolean;
}

const sizeConfig = {
  sm: { container: 'w-9 h-9', text: 'text-sm', spacing: 'gap-1.5', imageSize: 36 },
  md: { container: 'w-12 h-12', text: 'text-base', spacing: 'gap-2', imageSize: 48 },
  lg: { container: 'w-16 h-16', text: 'text-xl', spacing: 'gap-3', imageSize: 64 }
};

export function PrimaryBadgeDisplay({ 
  profileId, 
  showName = false, 
  size = 'md',
  className = '',
  clickable = true
}: PrimaryBadgeDisplayProps) {
  const { primaryBadge, loading } = usePrimaryBadge(profileId);
  const [showModal, setShowModal] = useState(false);

  if (loading || !primaryBadge) {
    return null;
  }

  const handleClick = () => {
    if (clickable) {
      setShowModal(true);
    }
  };

  const config = sizeConfig[size];
  const trimmedIconUrl = primaryBadge.iconUrl?.trim();
  const hasCustomIcon = trimmedIconUrl && trimmedIconUrl !== '';
  
  // Get level-specific colors
  const levelColors = primaryBadge.currentLevel 
    ? LEVEL_COLORS[primaryBadge.currentLevel as keyof typeof LEVEL_COLORS]
    : { border: 'border-gray-200' };

  return (
    <>
      <div 
        className={`flex items-center ${config.spacing} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={handleClick}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      >
        <div className={`relative ${config.container}`}>
        {hasCustomIcon ? (
          <Image
            src={trimmedIconUrl!}
            alt={primaryBadge.name}
            width={config.imageSize}
            height={config.imageSize}
            className={`rounded-full ${levelColors.border} border-2 bg-white p-0.5`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                const iconSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
                parent.innerHTML = `<div class="flex items-center justify-center ${config.container} ${iconSize} bg-gray-100 rounded-full ${levelColors.border} border-2">${getDefaultBadgeIcon(primaryBadge.badgeType)}</div>`;
              }
            }}
          />
        ) : (
          <div className={`flex items-center justify-center ${config.container} ${config.text} bg-gray-100 rounded-full ${levelColors.border} border-2`}>
            {getDefaultBadgeIcon(primaryBadge.badgeType)}
          </div>
        )}
      </div>
      
        {showName && (
          <Badge variant="secondary" className={`${config.text} bg-amber-100 text-amber-800 border-amber-300`}>
            {primaryBadge.name}
          </Badge>
        )}
      </div>

      <BadgeDetailsModal 
        badge={primaryBadge}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}