'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Utensils, Users, CheckCircle } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { MealSearchBar } from '@/components/meal/MealSearchBar';
import { MealComposition } from '@/components/meal/MealComposition';
import { DietaryAlert, CalorieSemaphore } from '@/components/alerts';
import { useMealWithAlerts } from '@/lib/hooks/useMealWithAlerts';
import { API_BASE_URL } from '@/lib/config/api';
import { RegistrationHistorySection } from '@/components/registration/RegistrationHistorySection';

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  members: Array<{
    GroupMemberID: number;
    profileId: string;
    profile: {
      id: string;
      username: string;
    };
  }>;
}

export default function GroupManualMealPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { userData } = useUser();
  const profile = userData?.profile;
  const { showSuccess, showError } = useGlobalNotification();
  const { allMeals, fetchAllMeals } = useMeals();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get meal with dietary alerts
  const { meal: mealWithAlerts } = useMealWithAlerts(selectedMeal?.MealID || 0);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error('Error fetching group:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    if (profile?.id) {
      fetchAllMeals(profile.id);
    }
  }, [fetchGroup, profile?.id, fetchAllMeals]);

  const handleMealSelect = (meal: Meal | null) => {
    setSelectedMeal(meal);
  };

  const handleRegister = async () => {
    if (!selectedMeal || !profile?.id || !group) return;

    setSubmitting(true);
    try {
      // Register the meal for the group (creates consumption for all members)
      const response = await fetch(`${API_BASE_URL}/meal-consumptions/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Group manual meal: ${selectedMeal.name}`,
          description: `Manual registration for ${group.name} - Members can customize portions`,
          mealId: selectedMeal.MealID,
          profileId: profile.id,
          groupId: parseInt(groupId),
          consumedAt: new Date().toISOString(),
          // Don't include portions - this creates full meal for all members
          // Each member will then customize their own portions
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register meal');
      }

      const result = await response.json();
      console.log('Manual meal registered:', result);

      showSuccess(
        'Meal Registered!',
        `${selectedMeal.name} has been registered as a group meal. Members can select their portions from the history.`
      );

      // Navigate back to group page
      router.push(`/protected/groups/${groupId}`);
    } catch (error) {
      console.error('Error registering manual meal:', error);
      showError(
        'Registration Failed',
        error instanceof Error ? error.message : 'Failed to register meal'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Group not found'}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={fetchGroup}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-orange-400">Register Manual Group Meal</h1>
          <p className="text-muted-foreground mt-1">
            for {group.name}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-orange-900/20 border-orange-700/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Utensils className="w-5 h-5" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold min-w-[1.5rem]">1.</span>
              <span>Select a meal that the group consumed together</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold min-w-[1.5rem]">2.</span>
              <span>The meal will be registered as a group meal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400 font-bold min-w-[1.5rem]">3.</span>
              <span>Each member can select their portion from the <strong className="text-orange-300">History</strong> below</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Meal Search */}
      <Card>
        <CardHeader>
          <CardTitle>Select Meal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MealSearchBar
            allMeals={allMeals}
            onMealSelect={handleMealSelect}
            selectedMeal={selectedMeal}
            placeholder="Search for the meal your group consumed..."
            showAdvancedFilters={false}
          />

          {/* Selected Meal Details */}
          {selectedMeal && (
            <div className="space-y-4 mt-6">
              <div className="border-t border-neutral-700 pt-4">
                <h3 className="text-lg font-semibold text-orange-400 mb-3">
                  Selected Meal
                </h3>
                <MealComposition meal={selectedMeal} />
              </div>

              {/* Dietary and Calorie Alerts */}
              {mealWithAlerts && (
                <div className="space-y-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700">
                  {/* Dietary Alert */}
                  {mealWithAlerts.dietaryFitness && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-medium">Your Dietary Compatibility:</p>
                      <DietaryAlert 
                        isFit={mealWithAlerts.dietaryFitness.isFit}
                        conflicts={mealWithAlerts.dietaryFitness.conflicts}
                        size="md"
                      />
                      <p className="text-xs text-gray-400 italic">
                        Note: Other members may have different dietary restrictions
                      </p>
                    </div>
                  )}
                  
                  {/* Calorie Semaphore */}
                  {mealWithAlerts.totalKcal !== undefined && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400 font-medium">Nutritional Impact (full meal):</p>
                      <CalorieSemaphore 
                        status={mealWithAlerts.calorieStatus || 'green'}
                        calories={mealWithAlerts.totalKcal}
                        size="md"
                        showLabel={true}
                      />
                      <p className="text-xs text-gray-400 italic">
                        Members will be able to select their own portions
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Members */}
      {selectedMeal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              Group Members ({group.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              This meal will be registered for all active members:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {group.members.map(member => (
                <div 
                  key={member.GroupMemberID}
                  className="flex items-center gap-2 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-sm"
                >
                  <CheckCircle className="w-4 h-4 text-orange-400" />
                  <span>{member.profile.username}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleRegister}
          disabled={!selectedMeal || submitting}
          className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Registering...
            </>
          ) : (
            <>
              <Utensils className="w-4 h-4" />
              Register for All Members
            </>
          )}
        </Button>
      </div>

      {/* Registration History */}
      <RegistrationHistorySection groupId={parseInt(groupId)} className="mt-6" />
    </div>
  );
}
