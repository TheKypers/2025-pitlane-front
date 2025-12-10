'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GroupCard from './GroupCard';
import { API_BASE_URL } from '@/lib/config/api';

interface Group {
  GroupID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    profile: {
      id: string;
      username: string;
    };
  }>;
  _count: {
    members: number;
    mealConsumptions: number;
  };
}

interface DashboardGroupsSectionProps {
  userId: string;
}

export function DashboardGroupsSection({ userId }: DashboardGroupsSectionProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchDashboardGroups = useCallback(async () => {
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/groups/dashboard/${userId}`;
      console.log('[DEBUG] DashboardGroupsSection - fetching dashboard groups', { url, userId });
      const response = await fetch(url);
      
      if (!response.ok) {
        const text = await response.text().catch(() => null);
        console.error('[DEBUG] DashboardGroupsSection - fetch failed', { status: response.status, statusText: response.statusText, body: text });
        throw new Error('Error loading groups');
      }
      
      const data = await response.json();
      console.log('[DEBUG] DashboardGroupsSection - received groups', { count: Array.isArray(data) ? data.length : undefined, data });
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardGroups();
  }, [fetchDashboardGroups]);

  const handleViewAllGroups = () => {
    router.push(`/protected/groups`);
  };

  const handleCreateGroup = () => {
    router.push(`/protected/groups/create`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              My Groups
            </CardTitle>
            <div className="flex space-x-2">
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-muted/50 animate-pulse rounded" />
                    <div className="h-6 w-12 bg-muted/50 animate-pulse rounded" />
                  </div>
                  <div className="h-4 w-48 bg-muted/50 animate-pulse rounded mt-2" />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-muted/50 animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted/50 animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            My Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardGroups}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-700/50 bg-gradient-to-br from-amber-800/10 to-amber-900/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            My Groups
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCreateGroup}
            >
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAllGroups}
            >
              View all
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">You don&apos;t have any groups yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first group to start managing meals as a team
            </p>
            <Button onClick={handleCreateGroup}>
              <Plus className="w-4 h-4 mr-2" />
              Create my first group
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <GroupCard key={group.GroupID} group={group} showActivity={true} />
            ))}
            {groups.length >= 5 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleViewAllGroups}
              >
                View all groups ({groups.length})
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardGroupsSection;