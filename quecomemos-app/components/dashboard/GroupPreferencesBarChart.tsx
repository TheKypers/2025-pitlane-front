'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';

interface Preference {
  PreferenceID: number;
  name: string;
}

interface GroupMember {
  GroupMemberID: number;
  role: string;
  joinedAt: string;
  profile: {
    id: string;
    username: string;
    role: string;
  };
}

interface PreferenceData {
  name: string;
  count: number;
  percentage: number;
}

interface GroupPreferencesBarChartProps {
  groupId: string;
  members: GroupMember[];
}

// Color palette for the bar chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
];

export default function GroupPreferencesBarChart({ groupId, members }: GroupPreferencesBarChartProps) {
  const [preferencesData, setPreferencesData] = useState<PreferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get session for auth
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No authenticated session');
        }

        // Fetch all preferences to get names
        const preferencesResponse = await fetch(`${API_BASE_URL}/preferences`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!preferencesResponse.ok) {
          throw new Error('Failed to fetch preferences');
        }

        const allPreferences: Preference[] = await preferencesResponse.json();
        const preferenceMap = new Map<number, string>();
        allPreferences.forEach(pref => {
          preferenceMap.set(pref.PreferenceID, pref.name);
        });

        // Fetch member preferences
        const memberPreferences = new Map<number, number>(); // preferenceId -> count
        
        for (const member of members) {
          try {
            const memberResponse = await fetch(`${API_BASE_URL}/profile/${member.profile.id}/full`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (memberResponse.ok) {
              const memberData = await memberResponse.json();
              const preferences = memberData.Preference || [];
              
              preferences.forEach((pref: { PreferenceID: number }) => {
                const currentCount = memberPreferences.get(pref.PreferenceID) || 0;
                memberPreferences.set(pref.PreferenceID, currentCount + 1);
              });
            }
          } catch (memberError) {
            console.warn(`Failed to fetch preferences for member ${member.profile.username || 'Anonymous'}:`, memberError);
          }
        }

        // Process data for the pie chart
        const totalMembers = members.length;
        const chartData: PreferenceData[] = [];

        memberPreferences.forEach((count, preferenceId) => {
          const preferenceName = preferenceMap.get(preferenceId);
          if (preferenceName) {
            chartData.push({
              name: preferenceName,
              count,
              percentage: Math.round((count / totalMembers) * 100)
            });
          }
        });

        // Sort by count descending
        chartData.sort((a, b) => b.count - a.count);

        setPreferencesData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group preferences');
      } finally {
        setLoading(false);
      }
    };

    if (members.length > 0) {
      fetchGroupPreferences();
    } else {
      setLoading(false);
    }
  }, [groupId, members]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: PreferenceData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded shadow-lg p-3">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} member{data.count !== 1 ? 's' : ''} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading preferences...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (preferencesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            Group Preferences Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No preferences set by group members yet</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5" />
          Group Preferences Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dietary preferences across {members.length} group member{members.length !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={preferencesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                interval={0}
              />
              <YAxis 
                fontSize={12}
                label={{ value: 'Members', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                radius={[4, 4, 0, 0]}
              >
                {preferencesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">{preferencesData.length}</p>
            <p className="text-muted-foreground">Different preferences</p>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <p className="font-medium">
              {preferencesData.reduce((sum, item) => sum + item.count, 0)}
            </p>
            <p className="text-muted-foreground">Total preferences</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}