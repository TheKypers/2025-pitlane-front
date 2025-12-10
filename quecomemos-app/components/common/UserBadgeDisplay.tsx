"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useUserDisplayBadges } from '@/lib/hooks/useUserDisplayBadges';
import { BadgeDetailsModal } from '@/components/profile/badges/BadgeDetailsModal';
import { getBadgeIcon, type BadgeType, type BadgeLevel } from '@/lib/config/badgeDefinitions';

interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  earnedAt?: string;
  currentLevel?: 'bronze' | 'silver' | 'gold' | 'diamond';
  progress?: number;
  isCompleted?: boolean;
}

interface UserBadgeDisplayProps {
  username: string;
  profileId?: string; // For fetching badges automatically
  badges?: Badge[]; // Optional: provide badges directly
  maxBadges?: number; // Maximum number of badges to show
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const getDefaultBadgeIcon = (badgeType: string, level?: 'bronze' | 'silver' | 'gold' | 'diamond'): string => {
  // Use the level-specific icon from badge definitions
  return getBadgeIcon(badgeType as BadgeType, level as BadgeLevel);
};

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8'
};

export function UserBadgeDisplay({ 
  username, 
  profileId,
  badges: providedBadges,
  maxBadges = 3, 
  size = 'md',
  showTooltip = true,
  className = '' 
}: UserBadgeDisplayProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  // Fetch badges automatically if profileId is provided and badges are not provided
  const { badges: fetchedBadges } = useUserDisplayBadges(
    providedBadges ? undefined : profileId
  );
  
  // Use provided badges or fetched badges
  const badges = providedBadges || fetchedBadges;
  const displayBadges = badges.slice(0, maxBadges);
  const remainingCount = Math.max(0, badges.length - maxBadges);

  if (badges.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-medium">{username}</span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="font-medium">{username}</span>
        
        {/* Badge icons */}
        <div className="flex items-center gap-1">
          {displayBadges.map((badge) => {
            // Use iconUrl from database if available, otherwise show level-specific emoji
            // Trim iconUrl to remove trailing spaces/newlines that cause Next.js Image errors
            const trimmedIconUrl = badge.iconUrl?.trim();
            const hasCustomIcon = trimmedIconUrl && trimmedIconUrl !== '';
            const levelIcon = getDefaultBadgeIcon(badge.badgeType, badge.currentLevel);
            
            return (
              <div
                key={badge.BadgeID}
                className={`relative ${sizeClasses[size]} flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`}
                title={showTooltip ? `${badge.name} ${badge.currentLevel ? `(${badge.currentLevel.toUpperCase()})` : ''}: ${badge.description}` : undefined}
                onClick={() => setSelectedBadge(badge)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedBadge(badge);
                  }
                }}
              >
              {hasCustomIcon ? (
                <Image
                  src={trimmedIconUrl!}
                  alt={badge.name}
                  width={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
                  height={size === 'sm' ? 16 : size === 'md' ? 24 : 32}
                  className="rounded-full border border-gray-200 bg-white p-0.5"
                  onError={(e) => {
                    // If Supabase image fails, show level-specific emoji fallback
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center ${sizeClasses[size]} text-center">${levelIcon}</div>`;
                    }
                  }}
                />
              ) : (
                <div className={`flex items-center justify-center ${sizeClasses[size]} text-center bg-gray-100 rounded-full border border-gray-200`}>
                  {levelIcon}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Show count if there are more badges */}
        {remainingCount > 0 && (
          <div 
            className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 text-gray-600 rounded-full text-xs font-medium border`}
            title={showTooltip ? `+${remainingCount} more badges` : undefined}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    </div>

    <BadgeDetailsModal 
      badge={selectedBadge}
      isOpen={selectedBadge !== null}
      onClose={() => setSelectedBadge(null)}
    />
  </>
  );
}

export default UserBadgeDisplay;