'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CalorieCircleProgressProps {
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
  loading?: boolean;
}

export function CalorieCircleProgress({ 
  consumed, 
  goal, 
  remaining, 
  percentage,
  loading = false 
}: CalorieCircleProgressProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
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
      color: 'text-red-500',
      strokeColor: '#ef4444'
    },
    close: {
      variant: 'secondary' as const,
      text: 'Close to goal',
      icon: Target,
      color: 'text-yellow-500',
      strokeColor: '#eab308'
    },
    'on-track': {
      variant: 'default' as const,
      text: 'In progress',
      icon: TrendingDown,
      color: 'text-green-500',
      strokeColor: '#22c55e'
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  
  // Calcula el progreso para el círculo (máximo 100%)
  const circlePercentage = Math.min(percentage, 100);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circlePercentage / 100) * circumference;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Today&apos;s Calorie Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Gráfico Circular */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width="160" height="160" className="transform -rotate-90">
              {/* Círculo de fondo */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted-foreground/20"
              />
              {/* Círculo de progreso */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={currentStatus.strokeColor}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            
            {/* Contenido central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold">{percentage}%</div>
                <div className="text-xs text-muted-foreground">of goal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{consumed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Consumed</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{goal.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Goal</p>
          </div>
        </div>

        {/* Estado y calorías restantes */}
        <div className="flex items-center justify-between pt-2 border-t">
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