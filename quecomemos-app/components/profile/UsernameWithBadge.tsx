'use client';

import React from 'react';
import { PrimaryBadgeDisplay } from './badges/PrimaryBadgeDisplay';

interface UsernameWithBadgeProps {
  username: string;
  profileId: string;
  className?: string;
  usernameClassName?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
  showBadgeName?: boolean;
  clickableBadge?: boolean;
}

/**
 * Reusable component that displays username with primary badge
 * Use this component wherever you need to show both username and badge together
 */
export function UsernameWithBadge({
  username,
  profileId,
  className = '',
  usernameClassName = '',
  badgeSize = 'sm',
  showBadgeName = false,
  clickableBadge = true
}: UsernameWithBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-medium ${usernameClassName}`}>
        {username}
      </span>
      <PrimaryBadgeDisplay
        profileId={profileId}
        size={badgeSize}
        showName={showBadgeName}
        clickable={clickableBadge}
      />
    </div>
  );
}
