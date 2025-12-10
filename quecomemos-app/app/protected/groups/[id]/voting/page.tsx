'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Vote } from 'lucide-react';
import { VotingProvider } from '@/lib/contexts/VotingContext';
import { GroupVotingSystem, VotingHistorySection } from '@/components/voting';
import { API_BASE_URL } from '@/lib/config/api';
import type { Group } from '@/components/groups';

export default function GroupVotingPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      setLoading(true);
      console.debug('Fetching group for voting', `${API_BASE_URL}/groups/${groupId}`);
      const res = await fetch(`${API_BASE_URL}/groups/${groupId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.debug('Error fetching group for voting', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleVotingComplete = useCallback(() => {
    // Refresh group data after voting completes
    fetchGroup();
  }, [fetchGroup]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded flex-1" />
          </div>
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Group Not Found</h1>
          <p className="text-muted-foreground mb-6">The group you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
            <Button onClick={() => router.push('/protected/groups')} className="bg-amber-700 text-white">
              Go to Groups
            </Button>
          </div>
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
          <h1 className="text-2xl font-bold">Error Loading Voting Page</h1>
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
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center">
            <Vote className="w-8 h-8 mr-3 text-amber-600" />
            Group Voting
          </h1>
          <p className="text-muted-foreground mt-1">
            Voting for <span className="font-medium text-amber-600">{group?.name}</span>
          </p>
        </div>
      </div>

      {group && (
        <VotingProvider groupId={group.GroupID}>
          {/* Voting System at top */}
          <GroupVotingSystem 
            group={group} 
            onVotingComplete={handleVotingComplete}
            className="w-full"
          />

          {/* Instructions Card in middle */}
          <Card className="bg-gradient-to-br from-blue-800/20 to-blue-900/20 border-blue-700/30">
            <CardHeader>
              <CardTitle className="text-blue-200">How to Use Group Voting</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-100">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</div>
                  <p>Any group member can start a voting session by clicking &quot;Start Voting Session&quot;</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</div>
                  <p>During the proposal phase, members can suggest meals they&apos;d like to eat</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">3</div>
                  <p>Once voting begins, all members vote on their preferred meal options</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">4</div>
                  <p>The meal with the most votes wins and gets automatically registered!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting History at bottom */}
          <VotingHistorySection 
            groupId={group.GroupID}
            className="w-full"
          />
        </VotingProvider>
      )}
    </div>
  );
}