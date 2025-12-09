'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Egg, Trophy, Users, Clock, ChevronRight, CircleDot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GameHistoryService } from './GameHistoryService';
import { SessionDetailsModal } from '@/components/session/SessionDetailsModal';

interface GameHistoryItem {
  sessionId: number;
  gameType: string;
  duration: number;
  createdAt: string;
  startTime: string;
  endTime: string;
  status: string;
  winner: {
    id: string;
    username: string;
    clickCount: number;
  };
  winningMeal: {
    mealId: number;
    name: string;
    description: string;
  } | null;
  participantCount: number;
}

interface GameHistorySectionProps {
  groupId: number;
  className?: string;
  onRefresh?: () => void;
}

export function GameHistorySection({ groupId, className = '', onRefresh }: GameHistorySectionProps) {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
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
      // Fetch one extra to check if there are more
      const data = await GameHistoryService.getGroupGameHistory(groupId, currentLimit + 1, 0);
      const sessions = data.sessions || [];
      setHasMore(sessions.length > currentLimit);
      setHistory(sessions.slice(0, currentLimit));
      onRefresh?.();
    } catch (err) {
      console.error('Failed to load game history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setLimit(prevLimit => prevLimit + 10);
  };

  const handleViewDetails = (sessionId: number) => {
    setSelectedSessionId(sessionId);
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
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
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
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
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
            <Gamepad2 className="w-5 h-5 mr-2" /> Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {/* Scrollable container for game history */}
              <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {history.map((session) => {
                  const isRoulette = session.gameType === 'roulette';
                  const isClicker = session.gameType === 'egg_clicker';
                  const GameIcon = isClicker ? Egg : isRoulette ? CircleDot : Gamepad2;
                  
                  return (
                    <div
                      key={session.sessionId}
                      className="border border-amber-700/30 rounded-lg p-4 bg-neutral-800/50 hover:bg-neutral-800/70 transition-all cursor-pointer"
                      onClick={() => handleViewDetails(session.sessionId)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Game type indicator with icon */}
                          <div className="flex items-center gap-2 mb-2">
                            <GameIcon className={`h-4 w-4 ${isClicker ? 'text-amber-400' : isRoulette ? 'text-purple-400' : 'text-blue-400'}`} />
                            <span className="text-xs font-medium text-neutral-400 uppercase">
                              {isClicker ? 'Egg Clicker' : isRoulette ? 'Roulette' : session.gameType}
                            </span>
                          </div>

                          {/* Winner meal */}
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            <h3 className="font-semibold text-neutral-100">
                              {session.winningMeal?.name || 'No winning meal'}
                            </h3>
                            <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                              Winner
                            </Badge>
                          </div>

                          {/* Session info */}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(session.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}</span>
                            </div>
                            {isClicker && (
                              <div className="flex items-center gap-1">
                                <Egg className="h-3 w-3" />
                                <span className="text-amber-400 font-medium">
                                  {session.winner.clickCount} clicks by {session.winner.username}
                                </span>
                              </div>
                            )}
                            {isRoulette && (
                              <div className="flex items-center gap-1">
                                <CircleDot className="h-3 w-3" />
                                <span className="text-purple-400 font-medium">
                                  Won by {session.winner.username}
                                </span>
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
                            handleViewDetails(session.sessionId);
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

              {/* Load more button (if needed) */}
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
              <Gamepad2 className="h-12 w-12 mx-auto mb-3 text-amber-600 opacity-50" />
              <p>No games played yet</p>
              <p className="text-sm mt-1">Start a game to see history here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Game session details modal */}
      {selectedSessionId && (
        <SessionDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSessionId(null);
          }}
          sessionId={selectedSessionId}
          sessionType="game"
          onPortionRegistered={() => loadHistory(limit)}
        />
      )}
    </>
  );
}

