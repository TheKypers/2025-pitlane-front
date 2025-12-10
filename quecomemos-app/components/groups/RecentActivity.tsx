'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ChefHat, Calendar, Search, Filter } from 'lucide-react';

interface MealConsumption {
  MealConsumptionID: number;
  name: string;
  consumedAt: string;
  portionFraction?: number;
  totalKcal?: number;
  source?: 'individual' | 'voting' | 'game' | 'group';
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  profile?: {
    id: string;
    username: string;
  };
  votingSession?: {
    VotingSessionID: number;
  };
  gameSession?: {
    GameSessionID: number;
    gameType: string;
  };
}

interface RecentActivityProps {
  mealConsumptions: MealConsumption[];
  loading?: boolean;
  showFilters?: boolean;
  maxItems?: number;
  onViewMore?: () => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (value: 'asc' | 'desc') => void;
  groupedByDate?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function RecentActivity({
  mealConsumptions,
  loading = false,
  showFilters = false,
  maxItems,
  onViewMore,
  searchTerm = '',
  onSearchChange,
  sortOrder = 'desc',
  onSortChange,
  groupedByDate = false,
  emptyMessage = 'No recent activity',
  emptyDescription = 'Group meals will appear here once members start eating together'
}: RecentActivityProps) {
  
  // Format game type for display
  const formatGameType = (gameType: string) => {
    return gameType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ') + ' Game';
  };

  const formatShortDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    }) : '';

  // Filter and sort consumptions
  const filteredAndSorted = mealConsumptions
    .filter(consumption => {
      if (!searchTerm) return true;
      const displayName = consumption.source === 'game' && consumption.gameSession?.gameType
        ? formatGameType(consumption.gameSession.gameType)
        : consumption.meal?.name || consumption.name;
      return displayName.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const dateA = new Date(a.consumedAt).getTime();
      const dateB = new Date(b.consumedAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  // Limit items if maxItems is specified
  const displayedConsumptions = maxItems ? filteredAndSorted.slice(0, maxItems) : filteredAndSorted;

  // Group by date if requested
  const groupedConsumptions = groupedByDate 
    ? displayedConsumptions.reduce((acc, consumption) => {
        const date = new Date(consumption.consumedAt).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(consumption);
        return acc;
      }, {} as Record<string, MealConsumption[]>)
    : null;

  const renderConsumption = (c: MealConsumption) => {
    const displayName = c.source === 'game' && c.gameSession?.gameType
      ? formatGameType(c.gameSession.gameType)
      : c.meal?.name || c.name;

    const sourceLabel = c.source === 'voting' ? 'Voting' : c.source === 'game' ? 'Game' : c.source === 'group' ? 'Group Meal' : 'Manual';
    const sourceColor = c.source === 'voting' ? 'text-purple-400 bg-purple-900/30 border-purple-700' : 
                      c.source === 'game' ? 'text-blue-400 bg-blue-900/30 border-blue-700' : 
                      c.source === 'group' ? 'text-amber-400 bg-amber-900/30 border-amber-700' :
                      'text-green-400 bg-green-900/30 border-green-700';

    return (
      <div key={c.MealConsumptionID} className="border-l-4 border-amber-700 pl-4 py-3 bg-amber-950/20 rounded-r-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <p className="font-medium text-gray-200">{displayName}</p>
              {c.source && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sourceColor}`}>
                  {sourceLabel}
                </span>
              )}
            </div>
            
            {/* Participants info */}
            {c.profile && (
              <p className="text-sm text-amber-500 ml-6">
                Registered by {c.profile.username}
              </p>
            )}
            
            {/* Date and time */}
            <p className="text-xs text-gray-400 ml-6 mt-1">
              {new Date(c.consumedAt).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Activity className="w-5 h-5 mr-2" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Filters */}
      {showFilters && onSearchChange && onSortChange && (
        <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search meals..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-amber-700/50 rounded-md bg-background/50 text-gray-300 placeholder:text-gray-500"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortOrder}
                  onChange={(e) => onSortChange(e.target.value as 'asc' | 'desc')}
                  className="px-3 py-2 border border-amber-700/50 rounded-md bg-background/50 text-gray-300"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-amber-700/30 flex items-center justify-between text-sm text-gray-400">
              <span>
                {filteredAndSorted.length} of {mealConsumptions.length} activities
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
              {mealConsumptions.length > 0 && (
                <span>
                  From {formatShortDate(mealConsumptions[mealConsumptions.length - 1]?.consumedAt)} to {formatShortDate(mealConsumptions[0]?.consumedAt)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {displayedConsumptions.length > 0 ? (
        groupedByDate && groupedConsumptions ? (
          // Grouped by date view
          <div className="space-y-6">
            {Object.entries(groupedConsumptions).map(([date, dayConsumptions]) => (
              <Card key={date} className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg text-amber-200">
                    <Calendar className="w-5 h-5 mr-2" />
                    {new Date(date).toLocaleDateString('es-ES', { 
                      weekday: 'long',
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                    <span className="ml-auto text-sm font-normal text-gray-400">
                      {dayConsumptions.length} meal{dayConsumptions.length !== 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dayConsumptions.map(renderConsumption)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Simple list view
          <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-amber-200">
                <Activity className="w-5 h-5 mr-2" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Scrollable container for activities */}
                <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                  {displayedConsumptions.map(renderConsumption)}
                </div>
                
                {/* View more button */}
                {(onViewMore || (maxItems && filteredAndSorted.length > maxItems)) && (
                  <div className="pt-4 border-t border-amber-700/30">
                    <div className="flex items-center justify-between">
                      {maxItems && filteredAndSorted.length > maxItems && (
                        <p className="text-sm text-gray-400">
                          Showing {maxItems} of {filteredAndSorted.length} activities
                        </p>
                      )}
                      {onViewMore && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={onViewMore} 
                          className="ml-auto bg-amber-700 hover:bg-amber-600 text-white border-amber-600"
                        >
                          View Complete History
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-200">
              <Activity className="w-5 h-5 mr-2" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Activity className="w-12 h-12 mx-auto text-amber-700 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-300">{emptyMessage}</h3>
              <p className="text-gray-400 mb-4">{emptyDescription}</p>
              {searchTerm && onSearchChange && (
                <Button 
                  variant="outline" 
                  onClick={() => onSearchChange('')} 
                  className="bg-amber-700 hover:bg-amber-600 text-white border-amber-600"
                >
                  Clear Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
