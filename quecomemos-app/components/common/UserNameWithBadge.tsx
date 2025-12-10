'use client';

import React, { useState, useEffect } from 'react';
import { PrimaryBadgeDisplay } from '@/components/profile/badges/PrimaryBadgeDisplay';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';

interface UserNameWithBadgeProps {
  username: string;
  profileId: string;
  className?: string;
  badgeSize?: 'sm' | 'md' | 'lg';
  usernameClassName?: string;
}

/**
 * Reusable component that displays a username with their primary badge
 * Use this consistently throughout the app wherever user names are displayed
 */
export function UserNameWithBadge({ 
  username, 
  profileId, 
  className = '',
  badgeSize = 'sm',
  usernameClassName = ''
}: UserNameWithBadgeProps) {
  const { primaryBadge, loading } = usePrimaryBadge(profileId);
  const [isMounted, setIsMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Preload badge image to ensure it's ready before displaying
  useEffect(() => {
    if (!loading && primaryBadge) {
      const iconUrl = primaryBadge.iconUrl?.trim();
      
      if (iconUrl && iconUrl !== '') {
        // Preload the image
        const img = new Image();
        img.onload = () => {
          // Wait additional time after image loads to ensure borders render
          setTimeout(() => {
            setImageLoaded(true);
            setIsMounted(true);
          }, 100);
        };
        img.onerror = () => {
          // If image fails, still mount after delay
          setTimeout(() => {
            setImageLoaded(true);
            setIsMounted(true);
          }, 100);
        };
        img.src = iconUrl;
      } else {
        // No image to load, mount with delay
        setTimeout(() => {
          setImageLoaded(true);
          setIsMounted(true);
        }, 100);
      }
    } else if (!loading && !primaryBadge) {
      // If no badge, mount immediately
      setIsMounted(true);
      setImageLoaded(true);
    }
  }, [loading, primaryBadge]);
  
  // Show loading skeleton while badge is loading, image loading, or not yet mounted
  if (loading || !isMounted || !imageLoaded) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`h-5 bg-zinc-800/50 rounded animate-pulse ${usernameClassName ? 'w-28' : 'w-24'}`} />
        <div className={`${
          badgeSize === 'sm' ? 'w-9 h-9' : badgeSize === 'md' ? 'w-12 h-12' : 'w-16 h-16'
        } bg-zinc-800/50 rounded-full animate-pulse`} />
      </div>
    );
  }
  
  // Only show username and badge together once badge is loaded
  if (!primaryBadge) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={usernameClassName || 'font-medium'}>{username}</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={usernameClassName || 'font-medium'}>{username}</span>
      <PrimaryBadgeDisplay 
        profileId={profileId} 
        size={badgeSize}
        showName={false}
      />
    </div>
  );
}

export default UserNameWithBadge;
