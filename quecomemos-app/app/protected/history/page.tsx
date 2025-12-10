'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, ChefHat, Calendar, Search, Filter, History, Target, Flame, Plus, Trophy } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { useCalorieProgress } from '@/lib/hooks/useKcalProgress';
import { CalorieGoalSettings } from '@/components/profile/calorie-goal';
import { CalorieProgressDisplay } from '@/components/profile/CalorieProgressDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegisterMealModal } from '@/components/modals';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useMeals } from '@/lib/contexts/MealsContext';
import { useCalorieProgressContext } from '@/lib/contexts/CalorieProgressContext';
import { MealService, type RegisterMealData } from '@/lib/services/MealService';
import { BadgeProgressDisplay } from '@/components/profile/badges/BadgeProgressDisplay';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { PrimaryBadgeDisplay } from '@/components/profile/badges/PrimaryBadgeDisplay';
import { BadgeSelectionModal } from '@/components/profile/badges/BadgeSelectionModal';
import { SemaphoreSummary } from '@/components/dashboard/SemaphoreSummary';
import { ConsumptionPointsGraph } from '@/components/dashboard/ConsumptionPointsGraph';
import { HistoryPageProvider, useHistoryPageContext } from '@/lib/contexts/HistoryPageContext';

import { createClient } from '@/lib/supabase/client';

interface Consumption {
  ConsumptionID: number;
  name: string;
  description?: string;
  consumedAt: string;
  profileId?: string;
  totalKcal?: number;
  source?: 'individual' | 'voting' | 'game';
  votingSession?: {
    VotingSessionID: number;
    completedAt: string;
    group: {
      GroupID: number;
      name: string;
    };
  };
  gameSession?: {
    GameSessionID: number;
    endTime: string;
    gameType: string;
    group: {
      GroupID: number;
      name: string;
    };
  };
  consumptionMeals?: Array<{
    ConsumptionMealID: number;
    mealId: number;
    quantity: number;
    meal: {
      MealID: number;
      name: string;
      description?: string;
    };
    mealPortion?: {
      MealPortionID: number;
      portionFraction: number;
      foodPortions: Array<{
        FoodPortionID: number;
        foodId: number;
        portionFraction: number;
        quantityConsumed: number;
        food: {
          FoodID: number;
          name: string;
          kCal: number;
        };
      }>;
    };
  }>;
}

function HistorySkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
          <div className="w-48 h-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
      </div>

      {/* Controls skeleton */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
          <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          <div className="w-24 h-10 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      {/* History cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
              <div className="w-3/4 h-6 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="w-full h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="w-2/3 h-4 bg-muted/70 rounded animate-pulse"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UserHistoryPageContent() {
  const router = useRouter();
  const [consumptions, setConsumptions] = useState<Consumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('history');
  const [isRegisterMealModalOpen, setIsRegisterMealModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  // Context hooks
  const { userData } = useUser();
  const profile = userData.profile;
  const { setCalorieGoal } = useHistoryPageContext();
  const { progress, loading: loadingProgress, updateCalorieGoal: updateCalorieGoalFromHook } = useCalorieProgress();
  const { allMeals, fetchAllMeals } = useMeals();
  const { showNotification, showSuccess } = useGlobalNotification();
  const { triggerRefresh } = useCalorieProgressContext();
  const { stats } = useUserBadges(profile?.id);

  // Sync calorie goal with context
  useEffect(() => {
    if (progress?.goal) {
      setCalorieGoal(progress.goal);
    }
  }, [progress?.goal, setCalorieGoal]);

  // Format game type for display
  const formatGameType = (gameType: string) => {
    return gameType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') + ' Game';
  };

  const fetchUserHistory = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      console.debug('Fetching user meal consumptions', `${API_BASE_URL}/meal-consumptions/user/${profile.id}`);
      const res = await fetch(`${API_BASE_URL}/meal-consumptions/user/${profile.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('User meal consumptions payload', data);
      
      // Transform meal consumptions to consumption format for display
      const consumptionsFromMealConsumptions = data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((mc: any) => mc && mc.meal) // Filter out invalid entries
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((mc: any) => ({
          ConsumptionID: mc.MealConsumptionID,
          name: mc.name || mc.meal?.name || 'Unknown Meal',
          description: mc.description || mc.meal?.description || '',
          consumedAt: mc.consumedAt,
          profileId: mc.profileId,
          totalKcal: mc.totalKcal,
          source: mc.source,
          votingSession: mc.votingSession,
          gameSession: mc.gameSession,
          consumptionMeals: [{
            ConsumptionMealID: mc.MealConsumptionID,
            mealId: mc.mealId,
            quantity: mc.quantity || 1,
            meal: mc.meal,
            mealPortion: {
              MealPortionID: mc.MealConsumptionID,
              portionFraction: mc.portionFraction || 1.0,
              foodPortions: mc.foodPortions || []
            }
          }]
        }));
      
      setConsumptions(consumptionsFromMealConsumptions);
    } catch (err) {
      console.debug('Error fetching user history', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchUserHistory();
  }, [fetchUserHistory]);

  // Fetch meals for the register meal functionality
  useEffect(() => {
    if (profile?.id) {
      fetchAllMeals(profile.id);
    }
  }, [profile?.id, fetchAllMeals]);



  const formatShortDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    }) : '';

  // Filter and sort consumptions
  const filteredAndSortedConsumptions = consumptions
    .filter((consumption) => 
      consumption.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (consumption.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (consumption.consumptionMeals?.[0]?.meal?.name && consumption.consumptionMeals[0].meal.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const dateA = new Date(a.consumedAt).getTime();
      const dateB = new Date(b.consumedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Group consumptions by date
  const groupedConsumptions = filteredAndSortedConsumptions.reduce((acc, consumption) => {
    const date = new Date(consumption.consumedAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(consumption);
    return acc;
  }, {} as Record<string, Consumption[]>);

  if (loading) {
    return <HistorySkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Button onClick={fetchUserHistory}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateCalorieGoal = async (newGoal: number): Promise<boolean> => {
    if (!profile?.id) {
      console.error('No profile ID available');
      return false;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${API_BASE_URL}/profile/${profile.id}/calorie-goal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ calorieGoal: newGoal }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update calorie goal: ${response.status}`);
      }

      // Update the hook's state by calling the hook's update function
      await updateCalorieGoalFromHook(newGoal);
      
      // Update context with new goal value
      setCalorieGoal(newGoal);
      
      return true;
    } catch (error) {
      console.error('Error updating calorie goal:', error);
      return false;
    }
  };

  const openRegisterMealModal = () => {
    setIsRegisterMealModalOpen(true);
  };

  const closeRegisterMealModal = () => {
    setIsRegisterMealModalOpen(false);
  };

  const handleRegisterMeal = async (mealData: { mealId: number; date: string; portions?: { portionFraction: number; foodPortions: Array<{ foodId: number; portionFraction: number; absoluteQuantity?: number; }>; } }) => {
    const meal = allMeals.find(m => m.MealID === mealData.mealId);
    if (!meal) {
      console.error('Meal not found in allMeals array:', mealData.mealId);
      showNotification('error', 'Meal not found', 'Please try refreshing the page.');
      return;
    }

    if (!profile?.id) {
      showNotification('error', 'Profile not found', 'User profile is required to register meals.');
      return;
    }

    const registerMealData: RegisterMealData = {
      mealId: mealData.mealId,
      date: mealData.date,
      portions: mealData.portions
    };

    const result = await MealService.registerIndividualMeal(
      registerMealData,
      profile.id,
      meal.name,
      triggerRefresh // This will trigger calorie progress refresh
    );

    if (result.success) {
      showNotification('success', 'Meal registered successfully', `${meal.name} has been added to your consumption history.`);
      
      // Refresh the history to show the new consumption
      await fetchUserHistory();
      
      closeRegisterMealModal();
    } else {
      showNotification(
        'error',
        'Failed to register meal',
        result.error || 'An unexpected error occurred.'
      );
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">My Personal Consumption History</h1>
            {profile?.id && (
              <div className="flex items-center gap-2">
                <PrimaryBadgeDisplay 
                  profileId={profile.id} 
                  size="lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBadgeModalOpen(true)}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-200 dark:hover:bg-amber-950/30"
                  title="Customize your primary badge"
                >
                  <Trophy className="w-4 h-4" />
                  Customize Badge
                </Button>
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Record of your individual meal consumption activity
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Register Meal Button */}
          <Button 
            onClick={openRegisterMealModal}
            disabled={allMeals.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-500 disabled:cursor-not-allowed"
            title={allMeals.length === 0 ? "Loading meals..." : "Register a meal"}
          >
            <Plus className="w-4 h-4" />
            Register Meal
            {allMeals.length === 0 && <span className="text-xs ml-1">(Loading...)</span>}
          </Button>

          {/* User Info
          {profile && (
            <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border">
              <div className="w-10 h-10 bg-amber-800/30 border border-amber-700/50 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="font-medium text-sm">
                  {profile.username || 'User'}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {profile.role}
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>

      {/* Tabs for Profile Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Consumption History
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Calorie Goals
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Badges {stats && `(${stats.earnedBadges}/${stats.totalBadges})`}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Consumption History */}
        <TabsContent value="history" className="mt-6">
          {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search meals or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
              />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-input rounded-md bg-background"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredAndSortedConsumptions.length} of {consumptions.length} meals
              {searchTerm && ` matching "${searchTerm}"`}
            </span>
            {consumptions.length > 0 && (
              <span>
                From {formatShortDate(consumptions[consumptions.length - 1]?.consumedAt)} to {formatShortDate(consumptions[0]?.consumedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Content */}
      {filteredAndSortedConsumptions.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedConsumptions).map(([date, dayConsumptions]) => (
            <Card key={date}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  {new Date(date).toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    {dayConsumptions.length} meal{dayConsumptions.length !== 1 ? 's' : ''}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayConsumptions.map((consumption, idx) => {
                    const consumptionMeal = consumption.consumptionMeals?.[0];
                    const mealPortion = consumptionMeal?.mealPortion;
                    const hasFoodPortions = mealPortion && mealPortion.foodPortions && mealPortion.foodPortions.length > 0;
                    const groupInfo = consumption.votingSession?.group || consumption.gameSession?.group;
                    const sourceLabel = consumption.source === 'voting' ? 'Voting' : consumption.source === 'game' ? 'Game' : 'Manual';
                    const sourceColor = consumption.source === 'voting' ? 'text-purple-600 bg-purple-100 border-purple-300' : 
                                      consumption.source === 'game' ? 'text-blue-600 bg-blue-100 border-blue-300' : 
                                      'text-green-600 bg-green-100 border-green-300';
                    const uniqueKey = `${consumption.ConsumptionID}-${idx}`;
                    
                    // Format display name for game sessions
                    const displayName = consumption.source === 'game' && consumption.gameSession?.gameType
                      ? formatGameType(consumption.gameSession.gameType)
                      : consumption.name;
                    
                    return (
                      <div 
                        key={uniqueKey}
                        className="border-l-4 border-primary pl-4 py-3 bg-muted/30 rounded-r-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <ChefHat className="w-4 h-4 text-primary" />
                              <p className="font-medium">{displayName}</p>
                              {mealPortion && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300">
                                  {(mealPortion.portionFraction * 100).toFixed(0)}% of meal
                                </span>
                              )}
                              {consumption.source && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sourceColor}`}>
                                  {sourceLabel}
                                </span>
                              )}
                            </div>
                            {groupInfo && (
                              <p className="text-sm text-amber-600 mt-1 ml-6">
                                From group: {groupInfo.name}
                              </p>
                            )}
                            {consumption.description && (
                              <p className="text-sm text-muted-foreground mt-1 ml-6">
                                {consumption.description}
                              </p>
                            )}
                            {consumptionMeal && consumptionMeal.meal.name !== displayName && (
                              <p className="text-sm text-amber-600 mt-1 ml-6">
                                From meal: {consumptionMeal.meal.name}
                              </p>
                            )}
                            {hasFoodPortions && (
                              <div className="mt-2 ml-6 p-2 bg-muted/50 rounded border border-muted">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Food Portions Consumed:</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {mealPortion.foodPortions.map((fp) => (
                                    <div key={fp.FoodPortionID} className="text-xs flex items-center gap-1">
                                      <span className="text-amber-600 font-medium">
                                        {fp.quantityConsumed.toFixed(2)}u
                                      </span>
                                      <span className="text-muted-foreground">{fp.food.name}</span>
                                      <span className="text-muted-foreground/70">
                                        ({(fp.portionFraction * 100).toFixed(0)}%)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {consumption.totalKcal !== undefined && (
                              <div className="flex items-center gap-2 mt-1 ml-6">
                                <p className="text-xs text-muted-foreground">
                                  {consumption.totalKcal} kcal
                                </p>
                                {(() => {
                                  const dailyGoal = progress?.goal || 2000;
                                  const mealThreshold = dailyGoal / 3;
                                  const redThreshold = (dailyGoal * 4) / 3;
                                  let status: 'green' | 'yellow' | 'red' = 'yellow';
                                  
                                  if (consumption.totalKcal <= mealThreshold) status = 'green';
                                  else if (consumption.totalKcal > redThreshold) status = 'red';
                                  
                                  return (
                                    <div className={`w-2 h-2 rounded-full ${
                                      status === 'green' ? 'bg-green-500' :
                                      status === 'yellow' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`} title={`Calorie level: ${status}`} />
                                  );
                                })()}
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
                              <span>
                                {new Date(consumption.consumedAt).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Activity className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'No matching meals found' : 'No individual consumption history'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No meals match "${searchTerm}". Try adjusting your search terms.`
                  : 'You haven\'t recorded any individual meal consumption yet. Start by registering some meals!'
                }
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
        

        </TabsContent>

        {/* Tab: Calorie Goals */}
        <TabsContent value="goals" className="space-y-6 mt-6">
          {/* Calorie Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Total Calories Consumed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {loadingProgress ? '...' : (progress?.consumed || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total kcal consumed
                  </div>
                </div>
                <div className="text-center p-4 bg-green-500/5 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {loadingProgress ? '...' : (progress?.goal || 2000).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Daily goal
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {loadingProgress ? '...' : Math.round((progress?.consumed || 0) / (progress?.goal || 2000) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Of daily goal
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <CalorieProgressDisplay
              consumed={progress?.consumed || 0}
              goal={progress?.goal || 2000}
              loading={loadingProgress}
            />
            <CalorieGoalSettings
              currentGoal={progress?.goal || 2000}
              onUpdate={updateCalorieGoal}
            />
          </div>

          
          {/* Consumption Points Graph */}
          <ConsumptionPointsGraph />
        </TabsContent>

        {/* Tab: Badges */}
        <TabsContent value="badges" className="space-y-6 mt-6">
          {/* Badge Statistics */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Achievement Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-yellow-500/5 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">
                      {stats.earnedBadges}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Badges earned
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.totalBadges}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total available
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-500/5 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.completionPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Completion rate
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{stats.earnedBadges} of {stats.totalBadges} badges</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${stats.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Badges - Now showing progress tracking */}
          <BadgeProgressDisplay profileId={profile?.id} />
        </TabsContent>
      </Tabs>

      {/* Register Meal Modal */}
      <RegisterMealModal
        isOpen={isRegisterMealModalOpen}
        onClose={closeRegisterMealModal}
        onSubmit={handleRegisterMeal}
      />

      {/* Badge Selection Modal */}
      {profile?.id && (
        <BadgeSelectionModal
          profileId={profile.id}
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          onSuccess={() => {
            showSuccess(
              'Badge Updated!',
              'Your primary badge has been successfully updated and will now appear on your profile.',
              <Trophy className="w-8 h-8" />
            );
          }}
        />
      )}
    </div>
  );
}

export default function UserHistoryPage() {
  return (
    <HistoryPageProvider>
      <UserHistoryPageContent />
    </HistoryPageProvider>
  );
}