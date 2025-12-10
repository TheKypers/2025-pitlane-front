'use client';

import { useCalorieProgress } from '@/lib/hooks/useKcalProgress';
import { CalorieProgressWithHistory } from '@/components/profile/calorie-progress-with-history';
import { CalorieGoalSettings } from '@/components/profile/calorie-goal';
import { BadgeProgressDisplay } from '@/components/profile/badges/BadgeProgressDisplay';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function ProfileSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
        <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
      </div>
      
      <div className="space-y-6">
        {/* Calorie Progress skeleton */}
        <Card>
          <CardHeader>
            <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-48 h-48 rounded-full bg-muted animate-pulse"></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 bg-muted/70 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goal Settings skeleton */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <div className="w-40 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>

        {/* Badge Progress skeleton */}
        <Card className="bg-black-900/95 border-grey-900/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-muted/50 animate-pulse rounded"></div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-32 bg-muted/50 animate-pulse rounded"></div>
              <div className="h-2 w-full bg-amber-950/50 rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 rounded-lg border-2 border-amber-900/30">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-muted/50 animate-pulse"></div>
                    <div className="w-full h-4 bg-muted/50 animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { progress, loading, updateCalorieGoal } = useCalorieProgress();

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Configure your preferences and nutritional goals
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Progreso de calorías con historial */}
        {progress && (
          <CalorieProgressWithHistory
            consumed={progress.consumed}
            goal={progress.goal}
            remaining={progress.remaining}
            percentage={progress.percentage}
            loading={loading}
            consumptionHistory={progress.consumptionHistory}
          />
        )}

        {/* Configuración de objetivo */}
        <div className="max-w-md mx-auto">
          {progress && (
            <CalorieGoalSettings
              currentGoal={progress.goal}
              onUpdate={updateCalorieGoal}
            />
          )}
        </div>

        {/* Badges & Achievements */}
        <BadgeProgressDisplay />
      </div>
    </div>
  );
}