'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CalorieProgressCardProps {
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
  loading?: boolean;
}

export function CalorieProgressCard({ 
  consumed, 
  goal, 
  remaining, 
  percentage,
  loading = false 
}: CalorieProgressCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    );
  }

  const status = percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'close' : 'on-track';
  const statusConfig = {
    exceeded: {
      variant: 'destructive' as const,
      text: 'Goal exceeded',
      icon: TrendingUp,
      color: 'text-red-500'
    },
    close: {
      variant: 'secondary' as const,
      text: 'Close to goal',
      icon: Target,
      color: 'text-yellow-500'
    },
    'on-track': {
      variant: 'default' as const,
      text: 'In progress',
      icon: TrendingDown,
      color: 'text-green-500'
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Today&apos;s Calorie Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-3xl font-bold">{consumed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Consumed</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="space-y-1 text-right">
            <p className="text-3xl font-bold">{goal.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Goal</p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground text-right">
            {percentage}% of goal
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Badge variant={currentStatus.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {currentStatus.text}
          </Badge>
          <span className={`text-sm font-medium ${remaining > 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
            {remaining > 0 
              ? `${remaining.toLocaleString()} kcal remaining` 
              : `${Math.abs(remaining).toLocaleString()} kcal over`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}