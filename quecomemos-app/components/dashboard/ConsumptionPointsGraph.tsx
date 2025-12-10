'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useHistoryPageContext } from '@/lib/contexts/HistoryPageContext';
import { createClient } from '@/lib/supabase/client';
import { CalorieSemaphoreIndicator, type SemaphoreStatus } from '@/components/alerts/CalorieSemaphore';

interface DayConsumption {
  date: string;
  count: number;
  totalKcal: number;
  consumptions: Array<{
    ConsumptionID: number;
    name: string;
    totalKcal: number;
    consumedAt: string;
    calorieStatus?: SemaphoreStatus;
  }>;
}

interface ConsumptionPointsGraphProps {
  className?: string;
}

type TimeFrame = '7days' | '30days' | '90days' | 'custom';

export function ConsumptionPointsGraph({ className = '' }: ConsumptionPointsGraphProps) {
  const { userData } = useUser();
  const { calorieGoal } = useHistoryPageContext();
  const [data, setData] = useState<DayConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayConsumption | null>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchConsumptions = useCallback(async (startDate: Date, endDate: Date) => {
    if (!userData?.profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/meal-consumptions/user/${userData.profile.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch consumption data');
      }

      const consumptions = await response.json();
      
      // Group by day using local date
      const dayMap = new Map<string, DayConsumption>();
      
      consumptions.forEach((consumption: { ConsumptionID: number; name: string; totalKcal: number; consumedAt: string; calorieStatus?: SemaphoreStatus }) => {
        // Parse as local date to avoid timezone shifts
        const consumedDate = new Date(consumption.consumedAt);
        const year = consumedDate.getFullYear();
        const month = String(consumedDate.getMonth() + 1).padStart(2, '0');
        const day = String(consumedDate.getDate()).padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        
        if (!dayMap.has(date)) {
          dayMap.set(date, {
            date,
            count: 0,
            totalKcal: 0,
            consumptions: []
          });
        }
        
        const dayData = dayMap.get(date)!;
        dayData.count++;
        dayData.totalKcal += consumption.totalKcal || 0;
        dayData.consumptions.push({
          ConsumptionID: consumption.ConsumptionID,
          name: consumption.name,
          totalKcal: consumption.totalKcal || 0,
          consumedAt: consumption.consumedAt,
          calorieStatus: consumption.calorieStatus
        });
      });

      // Fill in missing days with zero values
      const days: DayConsumption[] = [];
      const currentDate = new Date(startDate);
      
      // Use local date comparison to avoid timezone issues
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        if (dayMap.has(dateStr)) {
          days.push(dayMap.get(dateStr)!);
        } else {
          days.push({
            date: dateStr,
            count: 0,
            totalKcal: 0,
            consumptions: []
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setData(days);
    } catch (err) {
      console.error('Error fetching consumption data:', err);
    } finally {
      setLoading(false);
    }
  }, [userData?.profile?.id]);

  useEffect(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);
    // Set end date to end of today
    endDate.setHours(23, 59, 59, 999);

    if (timeFrame === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // For 7 days: show today + 6 previous days
      // For 30 days: show today + 29 previous days
      // For 90 days: show today + 89 previous days
      const daysBack = timeFrame === '7days' ? 6 : timeFrame === '30days' ? 29 : 89;
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysBack);
      startDate.setHours(0, 0, 0, 0);
    }

    fetchConsumptions(startDate, endDate);
  }, [userData?.profile?.id, timeFrame, customStartDate, customEndDate, fetchConsumptions, calorieGoal]);

  const handlePointClick = (data: DayConsumption) => {
    setSelectedDay(data);
  };

  const formatDate = (dateStr: string) => {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomDot = (props: { cx?: number; cy?: number; payload?: DayConsumption }) => {
    const { cx, cy, payload } = props;
    if (!payload) return null;
    const isSelected = selectedDay?.date === payload.date;
    
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={isSelected ? 8 : 5}
        fill={isSelected ? '#fb923c' : '#f97316'}
        stroke={isSelected ? '#fff' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        style={{ cursor: 'pointer' }}
        onClick={() => handlePointClick(payload)}
      />
    );
  };

  if (loading) {
    return (
      <Card className={`bg-card border ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Consumption Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Consumption Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Frame Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Time Period:</span>
          <Button
            variant={timeFrame === '7days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('7days')}
          >
            7 Days
          </Button>
          <Button
            variant={timeFrame === '30days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('30days')}
          >
            30 Days
          </Button>
          <Button
            variant={timeFrame === '90days' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('90days')}
          >
            90 Days
          </Button>
          <Button
            variant={timeFrame === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('custom')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Custom
          </Button>
        </div>

        {/* Custom Date Range */}
        {timeFrame === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                max={customEndDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}

        {/* Graph */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{ value: 'kcal', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'count') return [value, 'Meals'];
                  if (name === 'totalKcal') return [value, 'Total kcal'];
                  return [value, name];
                }}
                labelFormatter={(label) => {
                  // Parse as local date to avoid timezone shifts
                  const [year, month, day] = label.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="totalKcal"
                stroke="#f97316"
                strokeWidth={2}
                dot={<CustomDot />}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                {(() => {
                  // Parse as local date to avoid timezone shifts
                  const [year, month, day] = selectedDay.date.split('-').map(Number);
                  const date = new Date(year, month - 1, day);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                })()}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDay(null)}
              >
                ✕
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-card rounded">
                <div className="text-muted-foreground">Total Meals</div>
                <div className="text-xl font-bold text-orange-500">{selectedDay.count}</div>
              </div>
              <div className="p-2 bg-card rounded">
                <div className="text-muted-foreground">Total Calories</div>
                <div className="text-xl font-bold text-orange-500">{selectedDay.totalKcal} kcal</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Meals:</div>
              {selectedDay.consumptions.length > 0 ? (
                selectedDay.consumptions.map((consumption, index) => (
                  <div 
                    key={`${consumption.ConsumptionID}-${index}`}
                    className="flex items-center gap-2 p-2 bg-card rounded text-sm"
                  >
                    {consumption.calorieStatus && (
                      <CalorieSemaphoreIndicator status={consumption.calorieStatus} size="sm" />
                    )}
                    <span className="flex-1">{consumption.name}</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      consumption.calorieStatus === 'green' ? 'bg-green-700/20 text-green-200' :
                      consumption.calorieStatus === 'yellow' ? 'bg-yellow-700/20 text-yellow-200' :
                      consumption.calorieStatus === 'red' ? 'bg-red-700/20 text-red-200' :
                      'text-muted-foreground'
                    }`}>{consumption.totalKcal} kcal</span>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-card rounded text-sm text-muted-foreground text-center">
                  No meals recorded for this day
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
