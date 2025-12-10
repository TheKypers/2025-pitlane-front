import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';

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
  lastUpgraded?: string;
}

interface UseUserBadgesResult {
  badges: Badge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserDisplayBadges(profileId?: string): UseUserBadgesResult {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBadges = useCallback(async () => {
    if (!profileId) {
      setBadges([]);
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

      const response = await fetch(`${API_BASE_URL}/profile/${profileId}/badges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.status}`);
      }

      const data = await response.json();
      // The API returns an array directly, not wrapped in an object
      setBadges(Array.isArray(data) ? data : (data.badges || []));
    } catch (err) {
      console.error('Error fetching user badges:', err);
      setError(err instanceof Error ? err.message : String(err));
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchBadges();
  }, [profileId, fetchBadges]);

  return {
    badges,
    loading,
    error,
    refetch: fetchBadges
  };
}