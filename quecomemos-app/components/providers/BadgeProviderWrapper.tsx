'use client';

import { ReactNode } from 'react';
import { BadgeProvider } from '@/lib/contexts/BadgeContext';
import { useUser } from '@/lib/contexts/UserContext';

interface BadgeProviderWrapperProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides BadgeContext with profileId from UserContext
 * This allows BadgeProvider to access the current user's profile ID
 */
export function BadgeProviderWrapper({ children }: BadgeProviderWrapperProps) {
  const { profile } = useUser() as { profile?: { id?: string } };

  return (
    <BadgeProvider profileId={profile?.id}>
      {children}
    </BadgeProvider>
  );
}
