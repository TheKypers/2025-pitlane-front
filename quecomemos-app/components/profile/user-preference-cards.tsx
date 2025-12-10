'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Utensils, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PreferenceWithName {
  PreferenceID: number;
  name: string;
}

export function UserPreferenceCards() {
  const { userData, loading } = useUser();
  const [preferences, setPreferences] = useState<PreferenceWithName[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const userPreferences = userData.preferences;

  useEffect(() => {
    const fetchPreferencesWithNames = async () => {
      if (!userPreferences || !userPreferences.hasPreferences || userPreferences.preferences.length === 0) {
        setLoadingPreferences(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        // Fetch all preferences first
        const allPreferencesResponse = await fetch(`${API_BASE_URL}/preferences`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (allPreferencesResponse.ok) {
          const allPreferences: PreferenceWithName[] = await allPreferencesResponse.json();
          
          // Filter to only include user's preferences
          const userPreferenceDetails = allPreferences.filter(pref => 
            userPreferences.preferences.includes(pref.PreferenceID)
          );
          
          setPreferences(userPreferenceDetails);
        }
      } catch (error) {
        console.error('Error fetching preferences with names:', error);
      } finally {
        setLoadingPreferences(false);
      }
    };

    if (!loading) {
      fetchPreferencesWithNames();
    }
  }, [userPreferences, loading, supabase]);

  const handlePreferenceClick = (preferenceId: number) => {
    router.push(`/protected/foods/${preferenceId}`);
  };

  if (loading || loadingPreferences) {
    return (
      <div className="w-full mb-8">
        <h2 className="font-bold text-xl mb-4 text-amber-200">Your Food Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!userPreferences || !userPreferences.hasPreferences || preferences.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8">
      <div className="mb-6">
        <h2 className="font-bold text-xl text-amber-200 mb-2">Your Food Preferences</h2>
        <p className="text-sm text-gray-400">Click on any preference to explore foods that match it</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {preferences.map((preference) => (
          <Card
            key={preference.PreferenceID}
            className="bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors cursor-pointer group hover:scale-105 hover:shadow-lg rounded-lg"
            onClick={() => handlePreferenceClick(preference.PreferenceID)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-700/20 rounded-full transition-colors">
                  <Utensils className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-200 text-lg">{preference.name}</h3>
                  <p className="text-sm text-amber-100">Explore matching foods</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-200 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}