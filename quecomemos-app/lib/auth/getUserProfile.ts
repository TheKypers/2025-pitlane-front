import { createClient } from '@/lib/supabase/server';
import { API_BASE_URL } from '@/lib/config/api';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  role: string;
  calorie_goal?: number | null;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return null;
  }

  const jwt = await supabase.auth.getSession().then(res => res.data.session?.access_token);

  try {
    const response = await fetch(
      `${API_BASE_URL}/profile/${data.claims.sub}`,
      {
        cache: 'no-store', // Siempre datos frescos en server-side
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}