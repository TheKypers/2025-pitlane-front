import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';

interface BadgeData {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

interface BadgeStats {
  totalBadges: number;
  earnedBadges: number;
  completionPercentage: number;
  recentBadges: BadgeData[];
}

export function useUserBadges(profileId?: string) {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBadges = useCallback(async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      // Fetch user badges
      const badgesResponse = await fetch(`${API_BASE_URL}/profile/${profileId}/badges`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!badgesResponse.ok) {
        throw new Error(`Failed to fetch badges: ${badgesResponse.status}`);
      }

      const badgesData = await badgesResponse.json();

      // Fetch badge statistics
      const statsResponse = await fetch(`${API_BASE_URL}/profile/${profileId}/badge-stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch badge stats: ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();

      setBadges(badgesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching user badges:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch badges');
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchUserBadges();
  }, [fetchUserBadges]);

  const refetchBadges = useCallback(() => {
    fetchUserBadges();
  }, [fetchUserBadges]);

  return {
    badges,
    stats,
    loading,
    error,
    refetchBadges
  };
}