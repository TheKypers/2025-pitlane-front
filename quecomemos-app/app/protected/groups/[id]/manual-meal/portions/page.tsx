'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Utensils, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { MealPortionSelector, type PortionData } from '@/components/meal';
import { API_BASE_URL } from '@/lib/config/api';
import { UserNameWithBadge } from '@/components/common';

interface MealConsumption {
  MealConsumptionID: number;
  name: string;
  description?: string;
  profileId: string;
  mealId: number;
  groupId: number;
  type: string;
  source: string;
  consumedAt: string;
  portionFraction: number;
  totalKcal?: number;
  meal: {
    MealID: number;
    name: string;
    description?: string;
    mealFoods: Array<{
      MealFoodID: number;
      mealId: number;
      foodId: number;
      quantity: number;
      food: {
        FoodID: number;
        name: string;
        svgLink?: string;
        kCal: number;
      };
    }>;
  };
  profile: {
    id: string;
    username: string;
  };
  group?: {
    GroupID: number;
    name: string;
    members: Array<{
      profile: {
        id: string;
        username: string;
      };
    }>;
  };
  foodPortions?: Array<{
    FoodPortionID: number;
    portionFraction: number;
    quantityConsumed: number;
  }>;
}

export default function GroupManualMealPortionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = params.id as string;
  const consumptionId = searchParams.get('consumptionId');
  const { userData } = useUser();
  const profile = userData?.profile;
  const { showSuccess, showError } = useGlobalNotification();

  const [groupConsumption, setGroupConsumption] = useState<MealConsumption | null>(null);
  const [userIndividualConsumption, setUserIndividualConsumption] = useState<MealConsumption | null>(null);
  const [membersWithPortions, setMembersWithPortions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupConsumption = useCallback(async () => {
    if (!consumptionId) {
      setError('No consumption ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch the group consumption (reference meal)
      const res = await fetch(`${API_BASE_URL}/meal-consumptions/${consumptionId}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const groupCons: MealConsumption = await res.json();
      
      if (groupCons.type !== 'group' || groupCons.source !== 'group') {
        throw new Error('Invalid consumption type');
      }
      
      setGroupConsumption(groupCons);

      // Check if user already has an individual consumption for this group meal
      const userConsRes = await fetch(
        `${API_BASE_URL}/meal-consumptions?profileId=${profile?.id}&mealId=${groupCons.mealId}&groupId=${groupId}&source=group&type=individual`
      );
      
      if (userConsRes.ok) {
        const userConsData = await userConsRes.json();
        if (userConsData.length > 0) {
          // Find consumption matching this group meal (within time range)
          const matchingCons = userConsData.find((c: MealConsumption) => 
            Math.abs(new Date(c.consumedAt).getTime() - new Date(groupCons.consumedAt).getTime()) < 60000 // Within 1 minute
          );
          setUserIndividualConsumption(matchingCons || null);
        }
      }

      // Fetch all individual consumptions for this group meal to see who selected portions
      const allConsRes = await fetch(
        `${API_BASE_URL}/meal-consumptions?mealId=${groupCons.mealId}&groupId=${groupId}&source=group&type=individual`
      );
      
      if (allConsRes.ok) {
        const allConsData = await allConsRes.json();
        const profileIds = allConsData
          .filter((c: MealConsumption) => 
            Math.abs(new Date(c.consumedAt).getTime() - new Date(groupCons.consumedAt).getTime()) < 60000
          )
          .map((c: MealConsumption) => c.profileId);
        setMembersWithPortions(profileIds);
      }
    } catch (err) {
      console.error('Error fetching consumption:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [consumptionId, groupId, profile?.id]);

  useEffect(() => {
    if (profile?.id && consumptionId) {
      fetchGroupConsumption();
    }
  }, [fetchGroupConsumption, profile?.id, consumptionId]);

  const handlePortionSelect = async (portionData: PortionData) => {
    if (!groupConsumption || !profile?.id) return;

    setSubmitting(true);
    try {
      // Create individual consumption for this user (or update if exists)
      const response = await fetch(
        `${API_BASE_URL}/meal-consumptions/group/${groupConsumption.MealConsumptionID}/portions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profileId: profile.id,
            portionFraction: portionData.portionFraction,
            foodPortions: portionData.foodPortions
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to select portion');
      }

      showSuccess(
        'Portion Selected!',
        userIndividualConsumption 
          ? 'Your portion has been updated successfully'
          : 'Your portion has been recorded successfully'
      );

      // Navigate back to group page
      router.push(`/protected/groups/${groupId}`);
    } catch (error) {
      console.error('Error selecting portion:', error);
      showError(
        'Selection Failed',
        error instanceof Error ? error.message : 'Failed to select portion'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push(`/protected/groups/${groupId}`);
  };

  // Check if user has already customized their portion
  const hasCustomizedPortion = userIndividualConsumption !== null;

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

  if (error || !groupConsumption) {
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
            <p className="text-destructive">{error || 'No meal found to customize'}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/protected/groups/${groupId}`)}>
                Back to Group
              </Button>
              <Button onClick={fetchGroupConsumption}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert meal data to the format expected by MealPortionSelector
  // Use existing individual consumption if available, otherwise use group consumption
  const consumptionToDisplay = userIndividualConsumption || groupConsumption;
  const mealForSelector = {
    mealId: consumptionToDisplay.meal.MealID,
    name: consumptionToDisplay.meal.name,
    description: consumptionToDisplay.meal.description,
    mealFoods: consumptionToDisplay.meal.mealFoods.map((mf) => ({
      foodId: mf.food.FoodID,
      foodName: mf.food.name,
      quantity: mf.quantity,
      svgLink: mf.food.svgLink,
      kCal: mf.food.kCal
    })),
    totalCalories: consumptionToDisplay.meal.mealFoods.reduce(
      (sum: number, mf) => sum + mf.food.kCal * mf.quantity,
      0
    )
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/protected/groups/${groupId}`)} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-purple-200">Customize Your Portion</h1>
          <p className="text-muted-foreground mt-1">
            Group meal portion selection
          </p>
        </div>
      </div>

      {/* Status Card */}
      {hasCustomizedPortion && (
        <Card className="bg-blue-900/20 border-blue-700/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400" />
              <p className="text-sm text-blue-200">
                You&apos;ve already selected your portion. You can update it again if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-purple-600" />
            {consumptionToDisplay.meal.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consumptionToDisplay.meal.description && (
            <p className="text-muted-foreground">{consumptionToDisplay.meal.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>
              Registered {new Date(groupConsumption.consumedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          {/* Members who have selected portions */}
          {groupConsumption.group && groupConsumption.group.members.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="font-medium">
                  Group Members ({groupConsumption.group.members.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {groupConsumption.group.members.map((member) => (
                  <div 
                    key={member.profile.id}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      membersWithPortions.includes(member.profile.id)
                        ? 'bg-green-600/20 border border-green-600/30'
                        : 'bg-gray-600/20 border border-gray-600/30'
                    }`}
                  >
                    {membersWithPortions.includes(member.profile.id) ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-gray-400" />
                    )}
                    <UserNameWithBadge 
                      profileId={member.profile.id}
                      username={member.profile.username}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portion Selector */}
      <Card>
        <CardHeader>
          <CardTitle>
            {hasCustomizedPortion ? 'Update Your Portion' : 'Select Your Portion'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {hasCustomizedPortion 
              ? 'Modify how much of each food you consumed.'
              : 'Select how much of each food you consumed. The default is 100% of the meal.'
            }
          </p>
        </CardHeader>
        <CardContent>
          <MealPortionSelector
            meal={mealForSelector}
            onConfirm={handlePortionSelect}
            onCancel={handleSkip}
            loading={submitting}
          />
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Card className="bg-neutral-800/30 border-neutral-700/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            💡 {hasCustomizedPortion 
              ? 'Your portion is saved to your personal consumption history.'
              : 'Skip to use the default full portion, or customize exactly how much you ate of each food.'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
