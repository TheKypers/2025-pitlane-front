import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';

interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  currentLevel?: 'bronze' | 'silver' | 'gold' | 'diamond';
}

interface PrimaryBadgeResult {
  primaryBadge: Badge | null;
  loading: boolean;
  error: string | null;
  setPrimaryBadge: (badgeId: number | null) => Promise<boolean>;
  refetch: () => Promise<void>;
}

// Global cache for primary badges to sync between components
const primaryBadgeCache = new Map<string, Badge | null>();
const primaryBadgeListeners = new Map<string, Set<(badge: Badge | null) => void>>();

// Helper functions for cache management
function updatePrimaryBadgeCache(profileId: string, badge: Badge | null) {
  primaryBadgeCache.set(profileId, badge);
  const listeners = primaryBadgeListeners.get(profileId);
  if (listeners) {
    listeners.forEach(listener => listener(badge));
  }
}

function subscribeToPrimaryBadge(profileId: string, listener: (badge: Badge | null) => void) {
  if (!primaryBadgeListeners.has(profileId)) {
    primaryBadgeListeners.set(profileId, new Set());
  }
  primaryBadgeListeners.get(profileId)!.add(listener);
  
  return () => {
    const listeners = primaryBadgeListeners.get(profileId);
    if (listeners) {
      listeners.delete(listener);
    }
  };
}

export function usePrimaryBadge(profileId?: string): PrimaryBadgeResult {
  const [primaryBadge, setPrimaryBadgeState] = useState<Badge | null>(() => {
    return profileId ? primaryBadgeCache.get(profileId) ?? null : null;
  });
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

      console.log('Primary badge response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Primary badge error response:', errorText);
        throw new Error(`Failed to fetch primary badge: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const badge = data.primaryBadge || null;
      setPrimaryBadgeState(badge);
      updatePrimaryBadgeCache(profileId, badge);
    } catch (err) {
      console.error('Error fetching primary badge:', err);
      setError(err instanceof Error ? err.message : String(err));
      setPrimaryBadgeState(null);
      updatePrimaryBadgeCache(profileId, null);
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
      console.log('Updating primary badge at:', url);
      console.log('badgeId:', badgeId);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ badgeId })
      });

      console.log('Update primary badge response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Update primary badge error response:', errorText);
        throw new Error(`Failed to update primary badge: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const badge = data.primaryBadge || null;
      setPrimaryBadgeState(badge);
      updatePrimaryBadgeCache(profileId, badge);
      return true;
    } catch (err) {
      console.error('Error updating primary badge:', err);
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  };

  // Subscribe to cache updates for this profileId
  useEffect(() => {
    if (!profileId) return;

    const unsubscribe = subscribeToPrimaryBadge(profileId, (badge) => {
      setPrimaryBadgeState(badge);
    });

    return unsubscribe;
  }, [profileId]);

  useEffect(() => {
    fetchPrimaryBadge();
  }, [profileId, fetchPrimaryBadge]);

  return {
    primaryBadge,
    loading,
    error,
    setPrimaryBadge,
    refetch: fetchPrimaryBadge
  };
}