'use client';

import { useUser } from '@/lib/contexts/UserContext';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
  calorie_goal?: number | null;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}
export function useUserProfile(): UseUserProfileReturn {
  const { userData, loading, error } = useUser();

  return {
    profile: userData.profile,
    loading,
    error,
  };
}