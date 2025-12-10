'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';
import { RecentActivity } from '@/components/groups/RecentActivity';
import { VotingHistorySection } from '@/components/voting/VotingHistorySection';
import { GameHistorySection } from '@/components/games/clicker-game/GameHistorySection';
import { RegistrationHistorySection } from '@/components/registration/RegistrationHistorySection';

interface MealConsumption {
  MealConsumptionID: number;
  name: string;
  consumedAt: string;
  portionFraction?: number;
  totalKcal?: number;
  source?: 'individual' | 'voting' | 'game' | 'group';
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  profile?: {
    id: string;
    username: string;
  };
  votingSession?: {
    VotingSessionID: number;
  };
  gameSession?: {
    GameSessionID: number;
    gameType: string;
  };
}

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  mealConsumptions?: MealConsumption[];
}

function GroupHistorySkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header skeleton */}
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
        <div className="flex-1">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Filters skeleton */}
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>

      {/* History cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 animate-pulse">
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted/70 rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-muted/70 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function GroupHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [mealConsumptions, setMealConsumptions] = useState<MealConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchGroupHistory = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group history', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.debug('Group history payload', data);
      setGroup(data);
      setMealConsumptions(data.mealConsumptions || []);
    } catch (err) {
      console.debug('Error fetching group history', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupHistory();
  }, [fetchGroupHistory]);

  if (loading) {
    return <GroupHistorySkeleton />;
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
              <Button onClick={fetchGroupHistory}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 border border-amber-700/50 rounded-lg bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">Activity History</h1>
          <p className="text-muted-foreground mt-1">
            Complete meal consumption history for {group?.name}
          </p>
        </div>
      </div>
      
      {/* Voting, Game, & Registration History Section */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        {/* Recent Voting Sessions */}
        <VotingHistorySection groupId={parseInt(groupId)} />

        {/* Recent Game Sessions */}
        <GameHistorySection groupId={parseInt(groupId)} />

        {/* Recent Registration Sessions */}
        <RegistrationHistorySection groupId={parseInt(groupId)} />
      </div>

      {/* Meal Consumption History */}
      <RecentActivity
        mealConsumptions={mealConsumptions}
        loading={loading}
        showFilters={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        groupedByDate={true}
        emptyMessage={searchTerm ? 'No matching activities found' : 'No activity history'}
        emptyDescription={searchTerm 
          ? `No activities match "${searchTerm}". Try adjusting your search terms.`
          : 'This group has no recorded meal consumption history yet.'}
      />
    </div>
  );
}