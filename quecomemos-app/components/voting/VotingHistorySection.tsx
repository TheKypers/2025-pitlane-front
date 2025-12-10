'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, ChevronRight, Vote } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { VotingService } from './VotingService';
import { SessionDetailsModal } from '@/components/session/SessionDetailsModal';
import { VotingContext } from '@/lib/contexts/VotingContext';

interface VotingHistoryItem {
  sessionId: number;
  createdAt: string;
  completedAt: string;
  status: string;
  winnerMeal: {
    mealId: number;
    name: string;
    voteCount: number;
  };
  totalVotes: number;
  participantCount: number;
}

interface VotingHistorySectionProps {
  groupId: number;
  className?: string;
}

export function VotingHistorySection({ groupId, className = '' }: VotingHistorySectionProps) {
  const [history, setHistory] = useState<VotingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [limit, setLimit] = useState(3);
  const [hasMore, setHasMore] = useState(false);
  
  // Optional voting context - only used if component is within VotingProvider
  const votingContext = useContext(VotingContext);

  useEffect(() => {
    loadHistory(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, limit]);

  // Listen for voting completion events from VotingContext (if available)
  useEffect(() => {
    if (!votingContext?.onVotingCompleted) return;
    
    const unsubscribe = votingContext.onVotingCompleted(() => {
      loadHistory(limit);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, limit]);

  const loadHistory = async (currentLimit: number) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch one extra to check if there are more
      const data = await VotingService.getGroupVotingHistory(groupId, currentLimit + 1, 0);
      const sessions = data.sessions || [];
      setHasMore(sessions.length > currentLimit);
      setHistory(sessions.slice(0, currentLimit));
    } catch (err) {
      console.error('Failed to load voting history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voting history');
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
            <Vote className="w-5 h-5 mr-2" /> Voting History
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
            <Vote className="w-5 h-5 mr-2" /> Voting History
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
            <Vote className="w-5 h-5 mr-2" /> Voting History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {/* Scrollable container for voting history */}
              <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                {history.map((session) => (
                  <div
                    key={session.sessionId}
                    className="border border-amber-700/30 rounded-lg p-4 bg-neutral-800/50 hover:bg-neutral-800/70 transition-all cursor-pointer"
                    onClick={() => handleViewDetails(session.sessionId)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Winner meal */}
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <h3 className="font-semibold text-neutral-100">
                            {session.winnerMeal.name}
                          </h3>
                          <Badge variant="outline" className="text-xs border-yellow-600 text-yellow-400">
                            Winner
                          </Badge>
                        </div>

                        {/* Session info */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(session.completedAt || session.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{session.participantCount} participant{session.participantCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Vote className="h-3 w-3" />
                            <span>{session.totalVotes} total vote{session.totalVotes !== 1 ? 's' : ''}</span>
                          </div>
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
                ))}
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
            <div className="text-center py-8">
              <Vote className="w-12 h-12 mx-auto text-amber-700 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-300">No voting history</h3>
              <p className="text-gray-400">Completed voting sessions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <SessionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessionId={selectedSessionId}
        sessionType="voting"
      />
    </>
  );
}
