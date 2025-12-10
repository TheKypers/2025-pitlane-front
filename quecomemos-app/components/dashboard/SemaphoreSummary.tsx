'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';
import { CalorieSemaphoreIndicator } from '@/components/alerts';
import { useUser } from '@/lib/contexts/UserContext';
import { useHistoryPageContext } from '@/lib/contexts/HistoryPageContext';
import { createClient } from '@/lib/supabase/client';

interface SemaphoreStats {
  day: { green: number; yellow: number; red: number; total: number };
  week: { green: number; yellow: number; red: number; total: number };
  month: { green: number; yellow: number; red: number; total: number };
}

interface SemaphoreSummaryProps {
  className?: string;
}

export function SemaphoreSummary({ className = '' }: SemaphoreSummaryProps) {
  const { userData } = useUser();
  const { calorieGoal } = useHistoryPageContext();
  const [stats, setStats] = useState<SemaphoreStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData?.profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/meal-consumptions/semaphore-stats/${userData.profile.id}`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch semaphore stats');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching semaphore stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData?.profile?.id, calorieGoal]);

  if (loading) {
    return (
      <Card className={`bg-card border ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            Consumption Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return null;
  }

  const renderPeriodStats = (
    label: string,
    title: string,
    periodStats: { green: number; yellow: number; red: number; total: number }
  ) => {
    if (periodStats.total === 0) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-amber-200">{title}</span>
          </div>
          <div className="text-center py-2 text-gray-400 text-sm">
            No meals recorded
          </div>
        </div>
      );
    }

    const greenPercent = (periodStats.green / periodStats.total) * 100;
    const yellowPercent = (periodStats.yellow / periodStats.total) * 100;
    const redPercent = (periodStats.red / periodStats.total) * 100;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-amber-200">{title}</span>
          <span className="text-gray-400">{periodStats.total} meals</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-6 bg-gray-700/30 rounded-full overflow-hidden flex">
          {periodStats.green > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center"
              style={{ width: `${greenPercent}%` }}
              title={`${periodStats.green} green meals`}
            >
              {greenPercent > 15 && (
                <span className="text-xs font-bold text-white">{periodStats.green}</span>
              )}
            </div>
          )}
          {periodStats.yellow > 0 && (
            <div
              className="bg-yellow-500 flex items-center justify-center"
              style={{ width: `${yellowPercent}%` }}
              title={`${periodStats.yellow} yellow meals`}
            >
              {yellowPercent > 15 && (
                <span className="text-xs font-bold text-white">{periodStats.yellow}</span>
              )}
            </div>
          )}
          {periodStats.red > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center"
              style={{ width: `${redPercent}%` }}
              title={`${periodStats.red} red meals`}
            >
              {redPercent > 15 && (
                <span className="text-xs font-bold text-white">{periodStats.red}</span>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <CalorieSemaphoreIndicator status="green" size="sm" />
              <span>{periodStats.green}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalorieSemaphoreIndicator status="yellow" size="sm" />
              <span>{periodStats.yellow}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalorieSemaphoreIndicator status="red" size="sm" />
              <span>{periodStats.red}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`bg-card border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Meal Consumption Quality Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderPeriodStats('Today', '1 Day', stats.day)}
        {renderPeriodStats('Last 7 Days', '1 Week', stats.week)}
        {renderPeriodStats('Last 30 Days', '1 Month', stats.month)}
      </CardContent>
    </Card>
  );
}
