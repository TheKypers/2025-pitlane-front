'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';

interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
}

interface PrimaryBadgeContextType {
  primaryBadge: Badge | null;
  loading: boolean;
  error: string | null;
  setPrimaryBadge: (badgeId: number | null) => Promise<boolean>;
  refetch: () => Promise<void>;
}

const PrimaryBadgeContext = createContext<PrimaryBadgeContextType | undefined>(undefined);

interface PrimaryBadgeProviderProps {
  children: ReactNode;
  profileId: string;
}

export function PrimaryBadgeProvider({ children, profileId }: PrimaryBadgeProviderProps) {
  const [primaryBadge, setPrimaryBadgeState] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrimaryBadge = useCallback(async () => {
    if (!profileId) {
      setPrimaryBadgeState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const url = `${API_BASE_URL}/profile/${profileId}/primary-badge`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch primary badge: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setPrimaryBadgeState(data.primaryBadge || null);
    } catch (err) {
      console.error('Error fetching primary badge:', err);
      setError(err instanceof Error ? err.message : String(err));
      setPrimaryBadgeState(null);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const setPrimaryBadge = async (badgeId: number | null): Promise<boolean> => {
    if (!profileId) return false;

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const url = `${API_BASE_URL}/profile/${profileId}/primary-badge`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ badgeId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update primary badge: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setPrimaryBadgeState(data.primaryBadge || null);
      return true;
    } catch (err) {
      console.error('Error updating primary badge:', err);
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  useEffect(() => {
    fetchPrimaryBadge();
  }, [profileId, fetchPrimaryBadge]);

  const contextValue: PrimaryBadgeContextType = {
    primaryBadge,
    loading,
    error,
    setPrimaryBadge,
    refetch: fetchPrimaryBadge
  };

  return (
    <PrimaryBadgeContext.Provider value={contextValue}>
      {children}
    </PrimaryBadgeContext.Provider>
  );
}

export function usePrimaryBadgeContext() {
  const context = useContext(PrimaryBadgeContext);
  if (context === undefined) {
    throw new Error('usePrimaryBadgeContext must be used within a PrimaryBadgeProvider');
  }
  return context;
}