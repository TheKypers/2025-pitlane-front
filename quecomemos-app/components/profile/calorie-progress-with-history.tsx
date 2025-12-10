'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CalorieCircleProgress } from './calorie-circle-progress';

interface ConsumptionItem {
  name: string;
  calories: number;
  time: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface CalorieProgressWithHistoryProps {
  consumed: number;
  goal: number;
  remaining: number;
  percentage: number;
  loading?: boolean;
  consumptionHistory?: ConsumptionItem[];
}

const typeConfig = {
  breakfast: { color: 'bg-orange-100 text-orange-800', icon: '🌅' },
  lunch: { color: 'bg-yellow-100 text-yellow-800', icon: '☀️' },
  dinner: { color: 'bg-purple-100 text-purple-800', icon: '🌙' },
  snack: { color: 'bg-green-100 text-green-800', icon: '🍎' }
};

export function CalorieProgressWithHistory({ 
  consumed, 
  goal, 
  remaining, 
  percentage,
  loading = false,
  consumptionHistory = []
}: CalorieProgressWithHistoryProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
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
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfico Circular de Progreso */}
      <CalorieCircleProgress
        consumed={consumed}
        goal={goal}
        remaining={remaining}
        percentage={percentage}
        loading={false}
      />
      
      {/* Historial de Consumo del Día */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-blue-500" />
            Today&apos;s Consumption History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consumptionHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No consumption recorded today</p>
              <p className="text-xs">Start logging your meals to track your progress!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {consumptionHistory.map((item, index) => {
                const config = typeConfig[item.type];
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{config.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{item.calories} kcal</div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${config.color}`}
                      >
                        {item.type}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              {/* Total Summary */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-sm">Total Consumed:</span>
                  <span className="text-lg text-primary">{consumed.toLocaleString()} kcal</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}