'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, X, Eye, PieChart, Gamepad2, Egg } from 'lucide-react';
import { useState, useEffect } from 'react';
import { VotingService } from '../voting/VotingService';
import { GameHistoryService, GameSessionDetails } from '../games/clicker-game/GameHistoryService';
import { MealModal } from '@/components/modals/meal-modal';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { PortionSelectionModal } from '../voting/PortionSelectionModal';
import { UserNameWithBadge } from '@/components/common';

type SessionType = 'voting' | 'game';

interface BaseParticipant {
  userId: string;
  userName: string;
}

interface VotingParticipant extends BaseParticipant {
  hasSelectedPortion: boolean;
  defaultedToWhole: boolean;
  portionFraction?: number;
  portionDeadline: string;
  joinedAt: string;
}

interface GameParticipant {
  participantId: number;
  profile: {
    id: string;
    username: string;
  };
  proposedMeal: {
    mealId: number;
    name: string;
    description: string;
    foods: Array<{
      foodId: number;
      name: string;
      quantity: number;
      unit: string;
      kcalsPer100g: number;
    }>;
  } | null;
  clickCount: number;
  isReady: boolean;
  hasSubmitted: boolean;
  joinedAt: string;
  submittedAt: string | null;
  hasSelectedPortion?: boolean;
  portionFraction?: number;
}

interface VotingProposal {
  proposalId: number;
  mealId: number;
  mealName: string;
  proposedBy: string;
  proposedById?: string;
  voteCount: number;
}

interface WinningMeal {
  mealId: number;
  name: string;
  description?: string;
  mealFoods?: Array<{
    foodId: number;
    foodName: string;
    quantity: number;
    svgLink?: string;
    kCal: number;
  }>;
  foods?: Array<{
    foodId: number;
    name: string;
    quantity: number;
    unit: string;
    kcalsPer100g: number;
  }>;
  totalCalories?: number;
}

interface VotingSessionDetails {
  sessionId: number;
  createdAt: string;
  status: string;
  winnerMeal?: WinningMeal;
  proposals: VotingProposal[];
  participants: VotingParticipant[];
}

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
  sessionType: SessionType;
  onPortionRegistered?: () => void;
}

export function SessionDetailsModal({ 
  isOpen, 
  onClose, 
  sessionId,
  sessionType,
  onPortionRegistered 
}: SessionDetailsModalProps) {
  const { userData } = useUser();
  const [loading, setLoading] = useState(true);
  const [votingDetails, setVotingDetails] = useState<VotingSessionDetails | null>(null);
  const [gameDetails, setGameDetails] = useState<GameSessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Portion selection modal
  const [showPortionModal, setShowPortionModal] = useState(false);
  
  // Meal details modal
  const [showMealModal, setShowMealModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMeal, setSelectedMeal] = useState<any | null>(null);

  const userId = userData?.profile?.id;

  const loadSessionDetails = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      
      if (sessionType === 'voting') {
        const details = await VotingService.getVotingSessionDetails(sessionId);
        setVotingDetails(details);
        setGameDetails(null);
      } else {
        const details = await GameHistoryService.getGameSessionDetails(sessionId);
        setGameDetails(details);
        setVotingDetails(null);
      }
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWinningMeal = async () => {
    const mealId = sessionType === 'voting' 
      ? votingDetails?.winnerMeal?.mealId 
      : gameDetails?.winningMeal?.mealId;
      
    if (!mealId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/meals/${mealId}`);
      if (!response.ok) throw new Error('Failed to fetch meal details');
      
      const mealData = await response.json();
      setSelectedMeal(mealData);
      setShowMealModal(true);
    } catch (err) {
      console.error('Error loading meal details:', err);
    }
  };

  const handleSelectPortion = () => {
    setShowPortionModal(true);
  };

  const handlePortionSuccess = () => {
    loadSessionDetails();
    onPortionRegistered?.();
  };

  const getCurrentUserParticipant = () => {
    if (!userId) return null;
    
    if (sessionType === 'voting' && votingDetails) {
      return votingDetails.participants.find(p => p.userId === userId);
    } else if (sessionType === 'game' && gameDetails) {
      return gameDetails.participants.find(p => p.profile.id === userId);
    }
    
    return null;
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId, sessionType]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSessionIcon = () => {
    if (sessionType === 'voting') {
      return <Trophy className="h-5 w-5 text-amber-400" />;
    }
    
    const gameType = gameDetails?.gameType || '';
    return gameType === 'egg_clicker' 
      ? <Egg className="h-5 w-5 text-amber-400" />
      : <Gamepad2 className="h-5 w-5 text-amber-400" />;
  };

  const getSessionTitle = () => {
    if (sessionType === 'voting') {
      return 'Voting Session Details';
    }
    
    const gameType = gameDetails?.gameType || '';
    return gameType === 'egg_clicker' ? 'Egg Clicker Session' : 'Game Session Details';
  };

  const renderVotingProposals = () => {
    if (!votingDetails?.proposals) return null;

    return (
      <div className="space-y-2">
        {votingDetails.proposals
          .sort((a, b) => b.voteCount - a.voteCount)
          .map((proposal, index) => (
            <div 
              key={proposal.proposalId} 
              className={`p-3 rounded-lg border ${
                index === 0 
                  ? 'border-amber-500/50 bg-amber-950/30' 
                  : 'border-neutral-700 bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {index === 0 && <Trophy className="h-5 w-5 text-amber-400 flex-shrink-0" />}
                  <div>
                    <p className="font-medium">{proposal.mealName}</p>
                    <UserNameWithBadge 
                      profileId={proposal.proposedById || ''} 
                      username={proposal.proposedBy}
                      className="text-sm text-neutral-400"
                    />
                  </div>
                </div>
                <Badge variant="outline" className="border-amber-700/50 text-amber-200">
                  {proposal.voteCount} {proposal.voteCount === 1 ? 'vote' : 'votes'}
                </Badge>
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderGameParticipants = () => {
    if (!gameDetails?.participants) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <h4 className="font-semibold text-sm text-neutral-300">
            Participants ({gameDetails.participants.length})
          </h4>
        </div>

        <div className="grid gap-2">
          {gameDetails.participants
            .sort((a, b) => b.clickCount - a.clickCount)
            .map((participant) => {
              const isWinner = gameDetails.winner?.id === participant.profile.id;
              const hasSelectedPortion = participant.hasSelectedPortion || false;
              const portionFraction = participant.portionFraction;
              
              return (
                <div 
                  key={participant.participantId} 
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isWinner 
                      ? 'border-amber-500/50 bg-amber-950/30' 
                      : 'border-neutral-700 bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isWinner && <Trophy className="h-4 w-4 text-amber-400 flex-shrink-0" />}
                    <UserNameWithBadge 
                      profileId={participant.profile.id} 
                      username={participant.profile.username}
                      badgeSize="sm"
                      usernameClassName="text-sm font-medium text-neutral-100"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300">
                      {participant.clickCount} clicks
                    </Badge>
                    {hasSelectedPortion && portionFraction !== undefined ? (
                      <>
                        <PieChart className="h-4 w-4 text-green-500" />
                        <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                          {Math.round(portionFraction * 100)}% of meal
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                        Pending selection
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderVotingParticipants = () => {
    if (!votingDetails?.participants) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <h4 className="font-semibold text-sm text-neutral-300">
            Participants ({votingDetails.participants.length})
          </h4>
        </div>

        <div className="grid gap-2">
          {votingDetails.participants.map((participant) => (
            <div 
              key={participant.userId} 
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 border border-neutral-700"
            >
              <UserNameWithBadge 
                profileId={participant.userId} 
                username={participant.userName}
                badgeSize="sm"
                usernameClassName="text-sm font-medium text-neutral-100"
              />
              <div className="flex items-center gap-2">
                {participant.hasSelectedPortion && participant.portionFraction !== undefined ? (
                  <>
                    <PieChart className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                      {Math.round(participant.portionFraction * 100)}% of meal
                    </Badge>
                  </>
                ) : participant.defaultedToWhole ? (
                  <Badge variant="secondary" className="text-xs bg-neutral-700 text-neutral-300">
                    Whole meal (default)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs border-amber-600 text-amber-400">
                    Pending selection
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getWinnerMealForPortionModal = () => {
    if (sessionType === 'voting' && votingDetails?.winnerMeal) {
      return votingDetails.winnerMeal;
    }
    
    if (sessionType === 'game' && gameDetails?.winningMeal) {
      const mealFoods = gameDetails.winningMeal.foods?.map(f => ({
        foodId: f.foodId,
        foodName: f.name,
        quantity: f.quantity,
        kCal: f.kCal // Already kCal per unit from backend
      })) || [];
      
      console.log('[SessionDetailsModal] Game winning meal foods:', mealFoods);
      
      const totalCalories = mealFoods.reduce((sum, f) => sum + (f.kCal * f.quantity), 0);
      
      console.log('[SessionDetailsModal] Total calories:', totalCalories);
      
      return {
        mealId: gameDetails.winningMeal.mealId,
        name: gameDetails.winningMeal.name,
        description: gameDetails.winningMeal.description,
        mealFoods,
        totalCalories
      };
    }
    
    return undefined;
  };

  if (!isOpen) return null;

  const currentParticipant = getCurrentUserParticipant();
  const hasSelectedPortion = sessionType === 'voting' 
    ? (currentParticipant as VotingParticipant)?.hasSelectedPortion 
    : (currentParticipant as GameParticipant)?.hasSelectedPortion;
  
  const winningMeal = sessionType === 'voting' 
    ? votingDetails?.winnerMeal 
    : gameDetails?.winningMeal;
  
  const sessionDetails = sessionType === 'voting' ? votingDetails : gameDetails;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-700">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white z-10"
            >
              <X className="h-5 w-5" />
            </Button>

            <CardHeader>
              <div className="flex items-center gap-3">
                {getSessionIcon()}
                <CardTitle className="text-2xl">{getSessionTitle()}</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              {loading && (
                <div className="text-center py-8 text-neutral-400">Loading session details...</div>
              )}

              {error && (
                <div className="text-center py-8 text-red-400">{error}</div>
              )}

              {!loading && !error && sessionDetails && (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(sessionDetails.createdAt)}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-700/50 text-amber-200">
                      {sessionDetails.status}
                    </Badge>
                  </div>

                  {/* Winning Meal Section */}
                  {winningMeal && (
                    <div className="p-4 rounded-lg border border-amber-500/50 bg-amber-950/30">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className="h-5 w-5 text-amber-400" />
                            <h3 className="font-semibold text-amber-200">
                              {sessionType === 'voting' ? 'Winner Meal' : 'Winning Meal'}
                            </h3>
                          </div>
                          <p className="text-lg font-medium">{winningMeal.name}</p>
                          {winningMeal.description && (
                            <p className="text-sm text-neutral-400 mt-1">{winningMeal.description}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewWinningMeal}
                          className="border-amber-700/50 text-amber-200 hover:bg-amber-950/50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>

                      {currentParticipant && (
                        <Button
                          onClick={handleSelectPortion}
                          disabled={hasSelectedPortion}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                        >
                          <PieChart className="h-4 w-4 mr-2" />
                          {hasSelectedPortion ? 'Portion Already Selected' : 'Select Your Portion'}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Voting Results (voting only) */}
                  {sessionType === 'voting' && votingDetails && (
                    <div>
                      <h3 className="font-semibold mb-3 text-amber-200">Voting Results</h3>
                      {renderVotingProposals()}
                    </div>
                  )}

                  {/* Participants Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-amber-400" />
                      <h3 className="font-semibold text-amber-200">
                        {sessionType === 'voting' ? 'Meal Portions' : 'Participants'}
                      </h3>
                    </div>
                    {sessionType === 'voting' ? renderVotingParticipants() : renderGameParticipants()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portion Selection Modal */}
      {showPortionModal && winningMeal && userId && sessionId && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const winnerMealData = getWinnerMealForPortionModal() as any;
        return (
          <PortionSelectionModal
            isOpen={showPortionModal}
            onClose={() => setShowPortionModal(false)}
            sessionId={sessionId}
            mealId={winningMeal.mealId}
            mealName={winningMeal.name}
            winnerMeal={winnerMealData}
            userId={userId}
            isGameSession={sessionType === 'game'}
            onSuccess={handlePortionSuccess}
          />
        );
      })()}

      {/* Meal Details Modal */}
      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          isOpen={showMealModal}
          onClose={() => {
            setShowMealModal(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </>
  );
}
