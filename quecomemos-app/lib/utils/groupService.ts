'use client';

import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';
import { Meal } from '@/lib/contexts/MealsContext';

export interface GroupDietaryInfo {
  groupId: number;
  groupName: string;
  memberCount: number;
  preferences: Array<{
    PreferenceID: number;
    name: string;
  }>;
  dietaryRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
}

export interface GroupFilteredMeals {
  groupId: number;
  groupName: string;
  memberCount: number;
  appliedRestrictions: Array<{
    DietaryRestrictionID: number;
    name: string;
  }>;
  availableMeals: Meal[];
}

export async function fetchGroupDietaryInfo(groupId: string): Promise<GroupDietaryInfo | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/dietary-info`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch group dietary info');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching group dietary info:', error);
    return null;
  }
}

export async function fetchGroupFilteredMeals(groupId: string): Promise<GroupFilteredMeals | null> {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE_URL}/meal-consumptions/groups/${groupId}/filtered-meals`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch group filtered meals');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching group filtered meals:', error);
    return null;
  }
}