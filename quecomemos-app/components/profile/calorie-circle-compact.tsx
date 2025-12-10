'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';

interface CalorieCircleCompactProps {
  consumed: number;
  goal: number;
  percentage: number;
  size?: 'small' | 'medium';
}

export function CalorieCircleCompact({ 
  consumed, 
  goal, 
  percentage,
  size = 'medium'
}: CalorieCircleCompactProps) {
  const status = percentage >= 100 ? 'exceeded' : percentage >= 90 ? 'close' : 'on-track';
  const statusConfig = {
    exceeded: {
      variant: 'destructive' as const,
      text: 'Exceeded',
      icon: TrendingUp,
      strokeColor: '#ef4444'
    },
    close: {
      variant: 'secondary' as const,
      text: 'Close',
      icon: Target,
      strokeColor: '#eab308'
    },
    'on-track': {
      variant: 'default' as const,
      text: 'On track',
      icon: TrendingDown,
      strokeColor: '#22c55e'
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;
  
  // Tamaños según la prop
  const dimensions = {
    small: { 
      radius: 40, 
      svg: 100, 
      stroke: 6, 
      textSize: 'text-lg', 
      subtextSize: 'text-xs',
      spacing: 'space-y-2'
    },
    medium: { 
      radius: 50, 
      svg: 120, 
      stroke: 8, 
      textSize: 'text-xl', 
      subtextSize: 'text-xs',
      spacing: 'space-y-3'
    }
  };

  const config = dimensions[size];
  const circlePercentage = Math.min(percentage, 100);
  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (circlePercentage / 100) * circumference;
  
  return (
    <Card className="p-4">
      <CardContent className={`${config.spacing} p-0`}>
        {/* Gráfico Circular */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width={config.svg} height={config.svg} className="transform -rotate-90">
              {/* Círculo de fondo */}
              <circle
                cx={config.svg / 2}
                cy={config.svg / 2}
                r={config.radius}
                stroke="currentColor"
                strokeWidth={config.stroke}
                fill="transparent"
                className="text-muted-foreground/20"
              />
              {/* Círculo de progreso */}
              <circle
                cx={config.svg / 2}
                cy={config.svg / 2}
                r={config.radius}
                stroke={currentStatus.strokeColor}
                strokeWidth={config.stroke}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            
            {/* Contenido central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="space-y-0">
                <div className={`${config.textSize} font-bold`}>{percentage}%</div>
                <div className={`${config.subtextSize} text-muted-foreground`}>of goal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas compactas */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-center">
            <div className="font-semibold">{consumed.toLocaleString()}</div>
            <div className="text-muted-foreground">Consumed</div>
          </div>
          <Badge variant={currentStatus.variant} className="flex items-center gap-1 text-xs">
            <StatusIcon className="h-3 w-3" />
            {currentStatus.text}
          </Badge>
          <div className="text-center">
            <div className="font-semibold">{goal.toLocaleString()}</div>
            <div className="text-muted-foreground">Goal</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}