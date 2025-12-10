'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { AllMeals } from './all-meals';
import { PreferencesWarning } from '@/components/forms';
import DashboardGroupsSection from '@/components/groups/DashboardGroupsSection';

export function UserProfileSection() {
  const { userData, loading, error } = useUser();
  
  const profile = userData.profile;

  if (loading) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="flex flex-col gap-8">
          {/* Groups section skeleton */}
          <div className="rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted border rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Meals section skeleton */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-32 h-7 bg-muted rounded animate-pulse"></div>
              <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show error when not loading and there's an actual error
  if (!loading && error) {
    return (
      <div className="flex-1 w-full flex flex-col gap-12">
        <div className="text-red-500">
          Error loading profile: {error}
        </div>
      </div>
    );
  }

  // If no profile but no error, just return null (user is signing out)
  if (!profile) {
    return null;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      {/* Show preferences warning if user doesn't have preferences set */}
      {(!userData.preferences || !userData.preferences.hasPreferences) && (
        <PreferencesWarning className="mb-6" />
      )}

      {/* Dashboard with groups and meals */}
      <div className="flex flex-col gap-8">
        {/* Test component for stacking notifications */}

        {/* Groups section - now above meals */}
        <div>
          <DashboardGroupsSection userId={profile.id} />
        </div>
        
        {/* Meals section - now below groups */}
        <div>
          <AllMeals />
        </div>
      </div>
    </div>
  );
}