'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Utensils, Users, Clock, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { RegistrationDetailsModal } from './RegistrationDetailsModal';

interface RegistrationHistoryItem {
  MealConsumptionID: number;
  name: string;
  description?: string;
  mealId: number;
  groupId: number;
  consumedAt: string;
  profileId: string;
  profile: {
    id: string;
    username: string;
  };
  meal: {
    MealID: number;
    name: string;
    description?: string;
  };
  group: {
    GroupID: number;
    name: string;
    members: Array<{
      profile: {
        id: string;
        username: string;
      };
    }>;
  };
}

interface RegistrationHistorySectionProps {
  groupId: number;
  className?: string;
  onRefresh?: () => void;
}

export function RegistrationHistorySection({ groupId, className = '', onRefresh }: RegistrationHistorySectionProps) {
  const [history, setHistory] = useState<RegistrationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsumptionId, setSelectedConsumptionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limit, setLimit] = useState(3);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadHistory(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, limit]);

  const loadHistory = async (currentLimit: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch group meal consumptions (type='group', source='group')
      const response = await fetch(
        `${API_BASE_URL}/meal-consumptions?groupId=${groupId}&source=group&type=group`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort by date (most recent first)
      const sortedData = data.sort((a: RegistrationHistoryItem, b: RegistrationHistoryItem) => 
        new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime()
      );
      
      setHasMore(sortedData.length > currentLimit);
      setHistory(sortedData.slice(0, currentLimit));
      onRefresh?.();
    } catch (err) {
      console.error('Failed to load registration history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load registration history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setLimit(prevLimit => prevLimit + 10);
  };

  const handleViewDetails = (consumptionId: number) => {
    setSelectedConsumptionId(consumptionId);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Utensils className="w-5 h-5 mr-2" /> Registration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Utensils className="w-5 h-5 mr-2" /> Registration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadHistory(limit)}
              className="mt-3 border-red-500/50 text-red-400 hover:bg-red-900/30"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Utensils className="w-5 h-5 mr-2" /> Registration History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {/* Scrollable container */}
              <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {history.map((consumption) => {
                  return (
                    <div
                      key={consumption.MealConsumptionID}
                      className="border border-amber-700/30 rounded-lg p-4 bg-neutral-800/50 hover:bg-neutral-800/70 transition-all cursor-pointer"
                      onClick={() => handleViewDetails(consumption.MealConsumptionID)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Meal name */}
                          <div className="flex items-center gap-2 mb-2">
                            <Utensils className="h-4 w-4 text-amber-400" />
                            <h3 className="font-semibold text-neutral-100">
                              {consumption.meal.name}
                            </h3>
                            <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                              Group Meal
                            </Badge>
                          </div>

                          {/* Registered by */}
                          <div className="text-sm text-neutral-400 mb-2">
                            Registered by <span className="text-neutral-300 font-medium">{consumption.profile.username}</span>
                          </div>

                          {/* Session info */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(consumption.consumedAt)}</span>
                            </div>
                            {consumption.group?.members && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>{consumption.group.members.length} member{consumption.group.members.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* View details button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(consumption.MealConsumptionID);
                          }}
                        >
                          Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more button */}
              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-400 hover:bg-amber-900/30"
                  onClick={handleLoadMore}
                >
                  Load More
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Utensils className="h-12 w-12 mx-auto mb-3 text-amber-600 opacity-50" />
              <p>No group meals registered yet</p>
              <p className="text-sm mt-1">Register a meal to see history here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration details modal */}
      {selectedConsumptionId && (
        <RegistrationDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedConsumptionId(null);
          }}
          consumptionId={selectedConsumptionId}
          onPortionRegistered={() => loadHistory(limit)}
        />
      )}
    </>
  );
}
