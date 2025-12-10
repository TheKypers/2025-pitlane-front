'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, PieChart, X, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { VotingService } from './VotingService';
import { MealModal } from '@/components/modals/meal-modal';
import { useUser } from '@/lib/contexts/UserContext';
import { API_BASE_URL } from '@/lib/config/api';
import { PortionSelectionModal } from './PortionSelectionModal';
import { PrimaryBadgeDisplay } from '../profile/badges/PrimaryBadgeDisplay';
import { UserNameWithBadge } from '@/components/common';

interface Participant {
  userId: string;
  userName: string;
  hasSelectedPortion: boolean;
  defaultedToWhole: boolean;
  portionFraction?: number;
  portionDeadline: string;
  joinedAt: string;
}

interface VotingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number | null;
}

interface SessionDetails {
  sessionId: number;
  createdAt: string;
  status: string;
  winnerMeal?: {
    mealId: number;
    name: string;
    description?: string;
    mealFoods: Array<{
      foodId: number;
      foodName: string;
      quantity: number;
      svgLink?: string;
      kCal: number;
    }>;
    totalCalories: number;
  };
  proposals: Array<{
    proposalId: number;
    mealId: number;
    mealName: string;
    proposedBy: string;
    proposedById?: string;
    voteCount: number;
  }>;
  participants: Participant[];
}

export function VotingDetailsModal({ isOpen, onClose, sessionId }: VotingDetailsModalProps) {
  const { userData } = useUser();
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Portion selection modal
  const [showPortionModal, setShowPortionModal] = useState(false);
  
  // Meal details modal
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{
    MealID: number;
    name: string;
    description?: string;
    preparationTime?: number;
    servings?: number;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    profile: {
      username?: string;
      id: string;
      role: string;
    };
    mealFoods: Array<{
      food: {
        FoodID: number;
        name: string;
        svgLink?: string;
        kCal: number;
      };
      quantity: number;
    }>;
  } | null>(null);

  const userId = userData?.profile?.id;

  const loadSessionDetails = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const details = await VotingService.getVotingSessionDetails(sessionId);
      setSessionDetails(details);
    } catch (err) {
      console.error('Failed to load session details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewWinnerMeal = async () => {
    if (!sessionDetails?.winnerMeal) return;
    
    try {
      // Fetch full meal details from API
      const response = await fetch(`${API_BASE_URL}/meals/${sessionDetails.winnerMeal.mealId}`);
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
    // Reload session details to update participant status
    loadSessionDetails();
  };

  const getCurrentUserParticipant = () => {
    if (!userId || !sessionDetails?.participants) return null;
    return sessionDetails.participants.find(p => p.userId === userId);
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId]);

  const renderProposals = () => {
    if (!sessionDetails?.proposals || sessionDetails.proposals.length === 0) {
      return <p className="text-sm text-neutral-400">No proposals found</p>;
    }

    // Sort proposals by vote count (descending)
    const sortedProposals = [...sessionDetails.proposals].sort(
      (a, b) => b.voteCount - a.voteCount
    );

    const totalVotes = sortedProposals.reduce((sum, p) => sum + p.voteCount, 0);
    const winner = sortedProposals[0];
    const currentParticipant = getCurrentUserParticipant();

    return (
      <div className="space-y-4">
        {/* Winner Section */}
        {winner && sessionDetails.winnerMeal && (
          <Card className="border-yellow-600/50 bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h3 className="font-semibold text-lg text-amber-200">Winner</h3>
                  </div>
                  <p 
                    className="text-base font-medium text-neutral-100 hover:text-amber-200 cursor-pointer transition-colors"
                    onClick={handleViewWinnerMeal}
                  >
                    {winner.mealName}
                  </p>
                  <p className="text-sm text-neutral-400 mt-1">
                    <span>Proposed by {winner.proposedBy}</span>
                    {winner.proposedById && (
                      <PrimaryBadgeDisplay 
                        profileId={winner.proposedById} 
                        size="sm"
                        showName={false}
                        className="ml-1 inline-flex"
                      />
                    )}
                  </p>
                  {sessionDetails.winnerMeal.description && (
                    <p className="text-sm text-neutral-400 mt-2 line-clamp-2">
                      {sessionDetails.winnerMeal.description}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400">
                    {winner.voteCount}
                  </div>
                  <p className="text-xs text-neutral-400">
                    {totalVotes > 0
                      ? `${Math.round((winner.voteCount / totalVotes) * 100)}%`
                      : '0%'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewWinnerMeal}
                  className="flex-1 border-yellow-600 text-yellow-300 hover:bg-yellow-900/30"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Meal Details
                </Button>
                
                {/* Show portion selection if user hasn't selected yet */}
                {userId && sessionDetails.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectPortion}
                    className={`flex-1 ${
                      // If the deadline passed, show disabled/greyed style
                      new Date() > new Date(currentParticipant?.portionDeadline || '')
                        ? 'border-gray-600 text-gray-400 cursor-not-allowed'
                        // If user already selected and deadline not passed, show selected (but editable)
                        : currentParticipant?.hasSelectedPortion
                        ? 'border-green-600 text-green-300'
                        : 'border-amber-600 text-amber-300 hover:bg-amber-900/30'
                    }`}
                    disabled={
                      // Disable only if defaulted to whole OR deadline has passed
                      currentParticipant?.defaultedToWhole ||
                      new Date() > new Date(currentParticipant?.portionDeadline || '')
                    }
                  >
                    <PieChart className="h-4 w-4 mr-2" />
                    {currentParticipant?.hasSelectedPortion
                      ? `Portion: ${Math.round((currentParticipant.portionFraction || 1) * 100)}%`
                      : new Date() > new Date(currentParticipant?.portionDeadline || '')
                      ? 'Deadline Passed'
                      : currentParticipant?.defaultedToWhole
                      ? 'Whole Meal (Default)'
                      : 'Select Your Portion'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Other Proposals */}
        {sortedProposals.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-neutral-400">Other Proposals</h4>
            {sortedProposals.slice(1).map((proposal, index) => (
              <Card key={proposal.proposalId} className="bg-neutral-800/50 border-neutral-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-300">
                          #{index + 2}
                        </Badge>
                        <p className="text-sm font-medium text-neutral-100">{proposal.mealName}</p>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                        <span>by {proposal.proposedBy}</span>
                        {proposal.proposedById && (
                          <PrimaryBadgeDisplay 
                            profileId={proposal.proposedById} 
                            size="sm"
                            showName={false}
                          />
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-neutral-100">{proposal.voteCount}</div>
                      <p className="text-xs text-neutral-400">
                        {totalVotes > 0
                          ? `${Math.round((proposal.voteCount / totalVotes) * 100)}%`
                          : '0%'}
                      </p>
                    </div>
                  </div>

                  {/* Vote percentage bar */}
                  <div className="mt-2 w-full bg-neutral-700 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{
                        width: totalVotes > 0 ? `${(proposal.voteCount / totalVotes) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderParticipants = () => {
    if (!sessionDetails?.participants || sessionDetails.participants.length === 0) {
      return <p className="text-sm text-neutral-400">No participants found</p>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-neutral-400" />
          <h4 className="font-semibold text-sm text-neutral-300">
            Participants ({sessionDetails.participants.length})
          </h4>
        </div>

        <div className="grid gap-2">
          {sessionDetails.participants.map((participant: Participant) => (
            <div
              key={participant.userId}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/50 border border-neutral-700"
            >
              <UserNameWithBadge 
                username={participant.userName}
                profileId={participant.userId}
                badgeSize="sm"
                usernameClassName="text-sm font-medium text-neutral-100"
              />
              <div className="flex items-center gap-2">
                {participant.hasSelectedPortion ? (
                  <>
                    <PieChart className="h-4 w-4 text-green-500" />
                    <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                      {participant.portionFraction
                        ? `${Math.round(participant.portionFraction * 100)}% of meal`
                        : 'Portion selected'}
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl bg-neutral-900 border-amber-700/50 max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-200">
                <Trophy className="h-5 w-5" />
                Voting Session Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-neutral-400 hover:text-amber-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {!loading && !error && sessionDetails && (
                <div className="space-y-6">
                  {/* Session Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {new Date(sessionDetails.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <Badge variant="outline" className="border-amber-700/50 text-amber-200">
                      {sessionDetails.status}
                    </Badge>
                  </div>

                  {/* Proposals Section */}
                  <div>
                    <h3 className="font-semibold mb-3 text-amber-200">Voting Results</h3>
                    {renderProposals()}
                  </div>

                  {/* Participants Section */}
                  <div>
                    <h3 className="font-semibold mb-3 text-amber-200">Meal Portions</h3>
                    {renderParticipants()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portion Selection Modal */}
      {sessionDetails?.winnerMeal && userId && (
        <PortionSelectionModal
          isOpen={showPortionModal}
          onClose={() => setShowPortionModal(false)}
          sessionId={sessionId!}
          winnerMeal={sessionDetails.winnerMeal}
          userId={userId}
          onSuccess={handlePortionSuccess}
        />
      )}

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
