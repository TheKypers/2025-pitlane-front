'use client';

import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';

export interface Preference {
  PreferenceID: number;
  name: string;
}

export interface DietaryRestriction {
  DietaryRestrictionID: number;
  name: string;
}

export async function fetchAllPreferences(): Promise<Preference[]> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/preferences`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return [];
  }
}

export async function fetchAllDietaryRestrictions(): Promise<DietaryRestriction[]> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/dietary-restrictions`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dietary restrictions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dietary restrictions:', error);
    return [];
  }
}