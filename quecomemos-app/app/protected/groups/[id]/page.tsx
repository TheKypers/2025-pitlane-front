'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info, ChefHat, Utensils } from 'lucide-react';
import Image from 'next/image';
import { API_BASE_URL } from '@/lib/config/api';
import type { Group } from '@/components/groups';
import { RecentActivity } from '@/components/groups/RecentActivity';

interface Consumption {
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

// Extend the imported Group interface to include mealConsumptions
interface GroupWithConsumptions extends Group {
  mealConsumptions?: Consumption[];
}

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupWithConsumptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Context hooks  

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // Group deleted or doesn't exist
          setNotFound(true);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.debug('Group payload', data);
      setGroup(data);
    } catch (err) {
      console.debug('Error fetching group', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const goInfo = () => router.push(`/protected/groups/${groupId}/info`);
  const goHistory = () => router.push(`/protected/groups/${groupId}/history`);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          <div className="w-8 h-8 bg-muted rounded animate-pulse self-start"></div>
          <div className="flex-1 space-y-2">
            <div className="w-64 h-8 bg-muted rounded animate-pulse"></div>
            <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-40 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-full sm:w-40 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-full sm:w-40 h-10 bg-muted rounded animate-pulse"></div>
            <div className="w-full sm:w-40 h-10 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Recent Activity skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
              <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-48 h-5 bg-muted rounded animate-pulse"></div>
                    <div className="w-32 h-4 bg-muted/70 rounded animate-pulse"></div>
                  </div>
                  <div className="w-20 h-6 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">This is not the group you are looking for</h1>

          <div className="flex justify-center mb-4">
            <Image
              src="https://gifdb.com/images/high/these-are-not-the-droids-you-re-looking-for-page-meme-ygs7tyrw9v1a7k52.gif"
              alt="These aren't the droids you're looking for"
              width={272}
              height={153}
              className="w-90 h-auto rounded shadow-md"
              unoptimized={true}
              style={{ maxWidth: '290px' }}
            />
          </div>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => router.replace('/protected/groups')} className="bg-amber-700 text-white">
              Go to groups
            </Button>
          </div>
        </div>
    );
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
              <Button onClick={fetchGroup}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/protected/groups')} className="p-2 self-start">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <h1 className="text-3xl font-bold">{group?.name}</h1>
          {group?.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={goInfo} className="w-full sm:w-auto">
            <Info className="w-4 h-4 mr-2" /> Group information
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/protected/groups/${groupId}/manual-meal`)} 
            className="w-full sm:w-auto border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
          >
            <Utensils className="w-4 h-4 mr-2" /> Register Meal
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/protected/groups/${groupId}/voting`)} 
            className="w-full sm:w-auto border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Group Voting
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/protected/groups/${groupId}/game`)} 
            className="w-full sm:w-auto border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
          >
            <ChefHat className="w-4 h-4 mr-2" /> Group Game
          </Button>
        </div>
      </div>

        {/* Recent Activity */}
      <RecentActivity
        mealConsumptions={group?.mealConsumptions || []}
        loading={loading}
        maxItems={10}
        onViewMore={goHistory}
        emptyMessage="No recent activity"
        emptyDescription="Group meals will appear here once members start eating together"
      />
    </div>
  );
}