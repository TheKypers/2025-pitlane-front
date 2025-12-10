'use client';

import { Card } from '@/components/ui/card';
import { Clock, Users, Trophy, Utensils } from 'lucide-react';
import { CalorieSemaphoreIndicator, type SemaphoreStatus } from '@/components/alerts';

interface ConsumptionItemProps {
  consumption: {
    ConsumptionID: number;
    name: string;
    description?: string;
    consumedAt: string;
    totalKcal?: number;
    source?: 'individual' | 'voting' | 'game';
    calorieStatus?: SemaphoreStatus;
    meal?: {
      MealID: number;
      name: string;
    };
    votingSession?: {
      group: {
        name: string;
      };
    };
    gameSession?: {
      gameType: string;
      group: {
        name: string;
      };
    };
  };
  onClick?: () => void;
}

export function ConsumptionHistoryItem({ consumption, onClick }: ConsumptionItemProps) {
  const getSourceIcon = () => {
    switch (consumption.source) {
      case 'voting':
        return <Users className="w-4 h-4" />;
      case 'game':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (consumption.source) {
      case 'voting':
        return `Voting - ${consumption.votingSession?.group.name || 'Group'}`;
      case 'game':
        return `Game - ${consumption.gameSession?.group.name || 'Group'}`;
      default:
        return 'Individual';
    }
  };

  return (
    <Card
      className={`bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-4">
        {/* Header with semaphore indicator */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            {consumption.calorieStatus && (
              <CalorieSemaphoreIndicator status={consumption.calorieStatus} size="md" />
            )}
            <h3 className="font-semibold text-amber-200 line-clamp-1">
              {consumption.meal?.name || consumption.name}
            </h3>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          {/* Source */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {getSourceIcon()}
            <span>{getSourceLabel()}</span>
          </div>

          {/* Date and Calories */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{new Date(consumption.consumedAt).toLocaleString()}</span>
            </div>
            {consumption.totalKcal !== undefined && (
              <div className={`font-bold px-2 py-0.5 rounded ${
                consumption.calorieStatus === 'green' ? 'bg-green-700/20 text-green-200' :
                consumption.calorieStatus === 'yellow' ? 'bg-yellow-700/20 text-yellow-200' :
                consumption.calorieStatus === 'red' ? 'bg-red-700/20 text-red-200' :
                'bg-amber-700/20 text-amber-200'
              }`}>
                {consumption.totalKcal} kcal
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
