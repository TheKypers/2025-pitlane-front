'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Trophy, Vote, Plus, CheckCircle } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { useVoting } from '@/lib/contexts/VotingContext';
import { useBadges } from '@/lib/contexts/BadgeContext';
import { VotingService } from './VotingService';
import { MealProposalCard } from './MealProposalCard';
import { VotingTimer } from './VotingTimer';
import { ProposeMealModal } from './ProposeMealModal';
import { EarlyCompletionModal } from './EarlyCompletionModal';
import type { VotingSession, MealProposal } from './types';

interface VotingSessionCardProps {
  session: VotingSession;
  onVotingComplete?: () => void;
  className?: string;
}

export function VotingSessionCard({ session: initialSession, onVotingComplete, className = '' }: VotingSessionCardProps) {
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const { activeSession, notifyVotingCompleted } = useVoting();
  const { processBadgeNotifications } = useBadges();
  
  const [loading, setLoading] = useState(false);
  const [showProposeMeal, setShowProposeMeal] = useState(false);
  const [showEarlyCompletion, setShowEarlyCompletion] = useState(false);
  const [earlyCompletionDismissed, setEarlyCompletionDismissed] = useState(false);

  const userId = userData?.profile?.id;

  // IMPORTANT: Use the prop session (which has merged group data with members)
  // but update the status and proposals from activeSession if available
  const updatedSession: VotingSession = activeSession ? {
    ...initialSession,
    status: activeSession.status,
    proposalEndsAt: activeSession.proposalEndsAt,
    votingEndsAt: activeSession.votingEndsAt,
    proposals: activeSession.proposals,
    votes: activeSession.votes,
    // Keep the group from initialSession as it has the full members array
    group: initialSession.group
  } : initialSession;
  
  // Proper ownership and membership checks (same as GroupInfoPage)
  const isGroupOwner = updatedSession.group?.createdBy === userId;
  const isGroupAdmin = updatedSession.group?.members?.some(member => 
    member.profile.id === userId && member.role === 'admin'
  ) || false;
  const isGroupMember = updatedSession.group?.members?.some(member => 
    member.profile.id === userId
  ) || false;
  const canParticipate = isGroupOwner || isGroupAdmin || isGroupMember;
  
  // Check if session is expired
  const isExpired = () => {
    const now = new Date();
    if (updatedSession.status === 'proposal_phase') {
      return now > new Date(updatedSession.proposalEndsAt);
    } else if (updatedSession.status === 'voting_phase' && updatedSession.votingEndsAt) {
      return now > new Date(updatedSession.votingEndsAt);
    }
    return false;
  };
  
  const hasUserVoted = (proposal: MealProposal) => 
    proposal.votes?.some(vote => vote.voterId === userId && vote.isActive) || false;
  const userVoteCount = updatedSession.proposals?.reduce((count, proposal) => 
    count + (hasUserVoted(proposal) ? 1 : 0), 0
  ) || 0;

  // Check if current user has confirmed readiness for voting
  const hasUserConfirmedReady = updatedSession.proposalConfirmations?.some(
    confirmation => confirmation.userId === userId
  ) || false;

  // Check if current user has confirmed their votes
  const hasUserConfirmedVotes = updatedSession.voteConfirmations?.some(
    confirmation => confirmation.userId === userId
  ) || false;

  // Check for early completion opportunity
  const shouldShowEarlyCompletion = useCallback(() => {
    if (updatedSession.status !== 'voting_phase') return false;
    
    const totalMembers = updatedSession.group?.members?.length || 0;
    const totalVoters = new Set(
      updatedSession.proposals?.flatMap(p => 
        (p.votes || []).filter(v => v.isActive).map(v => v.voterId)
      ) || []
    ).size;
    
    // Show early completion if 60% of members have voted
    const majorityThreshold = Math.ceil(totalMembers * 0.6);
    return totalVoters >= majorityThreshold && totalMembers > 1;
  }, [updatedSession.status, updatedSession.group?.members?.length, updatedSession.proposals]);

  // Check if we should show early completion notification
  useEffect(() => {
    if (shouldShowEarlyCompletion() && !showEarlyCompletion && !earlyCompletionDismissed) {
      // Show early completion modal automatically after a short delay
      const timer = setTimeout(() => {
        setShowEarlyCompletion(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [updatedSession.status, updatedSession.proposals, shouldShowEarlyCompletion, showEarlyCompletion, earlyCompletionDismissed]);

  // Handle voting completion (triggered by polling updates via VotingContext)
  useEffect(() => {
    if (updatedSession.status === 'completed' && updatedSession.winnerMealId) {
      const winnerName = updatedSession.winnerMeal?.name || 'Unknown meal';
      const voteCount = updatedSession.totalVotes || 0;
      
      // Only show notification once per session (prevent duplicate notifications on re-renders)
      const notificationKey = `notification-shown-${updatedSession.VotingSessionID}`;
      if (!sessionStorage.getItem(notificationKey)) {
        sessionStorage.setItem(notificationKey, 'true');
        
        showSuccess(
          '🎉 Voting Complete!', 
          `The winning meal is "${winnerName}" with ${voteCount} votes!`
        );
      }

      // Auto-create group consumption (only once per user)
      if (userId && !sessionStorage.getItem(`consumption-created-${updatedSession.VotingSessionID}`)) {
        sessionStorage.setItem(`consumption-created-${updatedSession.VotingSessionID}`, 'true');
        
        VotingService.createConsumptionFromVote(updatedSession.VotingSessionID, {
          profileId: userId,
          name: winnerName,
          description: `Group meal from voting session: ${updatedSession.title || 'Meal Vote'}`,
          quantity: 1
        })
          .then(() => {
            showSuccess(
              '✅ Consumption Registered!',
              `"${winnerName}" has been added to your group's consumption history.`
            );
            // Trigger parent refresh for Recent Activity
            onVotingComplete?.();
            // Notify listeners via VotingContext
            notifyVotingCompleted(updatedSession.VotingSessionID);
          })
          .catch(error => {
            console.error('Error creating consumption:', error);
            // Don't show error if consumption already exists
          });
      } else if (!userId) {
        // Still trigger parent refresh even if no consumption created
        onVotingComplete?.();
        notifyVotingCompleted(updatedSession.VotingSessionID);
      }
    }
  }, [updatedSession.status, updatedSession.VotingSessionID, updatedSession.winnerMealId, updatedSession.winnerMeal?.name, updatedSession.totalVotes, updatedSession.title, userId, onVotingComplete, notifyVotingCompleted, showSuccess]);

  const handleStartVoting = async () => {
    if (!canParticipate || !(isGroupOwner || isGroupAdmin)) {
      showError('Access Denied', 'Only group owners and admins can start voting.');
      return;
    }

    setLoading(true);
    try {
      await VotingService.startVotingPhase(updatedSession.VotingSessionID);
      showSuccess('Voting Started!', 'The voting phase has begun. Members can now vote on proposed meals.');
    } catch (error) {
      showError('Error Starting Voting', error instanceof Error ? error.message : 'Failed to start voting phase');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVoting = async () => {
    if (!canParticipate || !(isGroupOwner || isGroupAdmin)) {
      showError('Access Denied', 'Only group owners and admins can complete voting.');
      return;
    }

    setLoading(true);
    try {
      const result = await VotingService.completeVotingSession(updatedSession.VotingSessionID);
      const winnerName = result.winnerProposal?.meal?.name || 'Unknown meal';
      const voteCount = result.winnerProposal?.voteCount || 0;
      
      showSuccess('Voting Completed!', `The winning meal is "${winnerName}" with ${voteCount} votes!`);
      
      // Auto-create consumption
      if (userId && result.session?.winnerMealId) {
        try {
          await VotingService.createConsumptionFromVote(updatedSession.VotingSessionID, {
            profileId: userId,
            name: winnerName,
            description: `Group meal from voting session: ${updatedSession.title || 'Meal Vote'}`,
            quantity: 1
          });
          showSuccess('✅ Consumption Registered!', `"${winnerName}" has been added to your group's consumption history.`);
          // Trigger parent refresh and notify other listeners
          onVotingComplete?.();
          notifyVotingCompleted(updatedSession.VotingSessionID);
        } catch (consumptionError) {
          console.error('Error creating consumption:', consumptionError);
          const errorMessage = consumptionError instanceof Error ? consumptionError.message : '';
          if (!errorMessage.includes('already') && !errorMessage.includes('duplicate')) {
            showError('Consumption Failed', 'Could not register the meal consumption automatically.');
          }
        }
      }
      
      // Ensure history and activity update
      onVotingComplete?.();
      notifyVotingCompleted(updatedSession.VotingSessionID);
    } catch (error) {
      showError('Error Completing Voting', error instanceof Error ? error.message : 'Failed to complete voting');
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyCompleteVoting = async () => {
    setLoading(true);
    try {
      const result = await VotingService.completeVotingSession(updatedSession.VotingSessionID);
      const winnerName = result.winnerProposal?.meal?.name || 'Unknown meal';
      const voteCount = result.winnerProposal?.voteCount || 0;
      
      showSuccess('Voting Completed Early!', `The winning meal is "${winnerName}" with ${voteCount} votes!`);
      setShowEarlyCompletion(false);
      
      // Auto-create consumption
      if (userId && result.session?.winnerMealId) {
        try {
          await VotingService.createConsumptionFromVote(updatedSession.VotingSessionID, {
            profileId: userId,
            name: winnerName,
            description: `Group meal from voting session: ${updatedSession.title || 'Meal Vote'}`,
            quantity: 1
          });
          showSuccess('✅ Consumption Registered!', `"${winnerName}" has been added to your group's consumption history.`);
          // Trigger parent refresh and notify other listeners
          onVotingComplete?.();
          notifyVotingCompleted(updatedSession.VotingSessionID);
        } catch (consumptionError) {
          console.error('Error creating consumption:', consumptionError);
          const errorMessage = consumptionError instanceof Error ? consumptionError.message : '';
          if (!errorMessage.includes('already') && !errorMessage.includes('duplicate')) {
            showError('Consumption Failed', 'Could not register the meal consumption automatically.');
          }
        }
      }
      
      // Ensure history and activity update
      onVotingComplete?.();
      notifyVotingCompleted(updatedSession.VotingSessionID);
    } catch (error) {
      showError('Error Completing Voting', error instanceof Error ? error.message : 'Failed to complete voting');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number) => {
    if (!userId || !canParticipate) {
      showError('Access Denied', 'You must be a member of this group to vote.');
      return;
    }

    // Check if user already voted for this proposal
    const existingVote = updatedSession.votes?.find(
      v => v.voterId === userId && v.mealProposalId === proposalId && v.isActive
    );

    setLoading(true);
    try {
      if (existingVote) {
        // Remove vote if clicking on already voted proposal
        await VotingService.removeVote(updatedSession.VotingSessionID, existingVote.VoteID);
        showSuccess('Vote Removed', 'Your vote has been removed.');
      } else {
        // Cast new vote
        console.log('[VotingSessionCard] Casting vote...', { sessionId: updatedSession.VotingSessionID, proposalId, voterId: userId });
        
        const voteResponse = await VotingService.castVote(updatedSession.VotingSessionID, {
          mealProposalId: proposalId,
          voterId: userId,
          voteType: 'up'
        });
        
        console.log('[VotingSessionCard] Vote response received:', JSON.stringify(voteResponse, null, 2));
        console.log('[VotingSessionCard] badgeNotifications field:', voteResponse.badgeNotifications);
        
        showSuccess('Vote Cast!', 'Your vote has been recorded.');
        
        // Process badge notifications through BadgeContext modal
        if (voteResponse.badgeNotifications && Array.isArray(voteResponse.badgeNotifications) && voteResponse.badgeNotifications.length > 0) {
          console.log('[VotingSessionCard] Processing badge notifications through context');
          await processBadgeNotifications(voteResponse.badgeNotifications);
        }
      }
    } catch (error) {
      console.error('[VotingSessionCard] Error in vote handler:', error);
      showError('Error Voting', error instanceof Error ? error.message : 'Failed to process vote');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeMeal = async (mealId: number) => {
    if (!userId || !canParticipate) {
      showError('Access Denied', 'You must be a member of this group to propose meals.');
      return;
    }

    try {
      await VotingService.proposeMeal(updatedSession.VotingSessionID, {
        mealId,
        proposedById: userId
      });
      showSuccess('Meal Proposed!', 'Your meal has been added to the voting pool.');
      setShowProposeMeal(false);
    } catch (error) {
      showError('Error Proposing Meal', error instanceof Error ? error.message : 'Failed to propose meal');
    }
  };

  const handleConfirmReadyForVoting = async () => {
    if (!userId || !canParticipate) {
      showError('Access Denied', 'You must be a member of this group to confirm readiness.');
      return;
    }

    setLoading(true);
    try {
      const result = await VotingService.confirmReadyForVoting(updatedSession.VotingSessionID, userId);
      showSuccess('Ready Confirmed!', 'You have confirmed that you are ready for voting.');
      
      // Check if voting started automatically
      if (result.votingStarted) {
        setTimeout(() => {
          showSuccess('🗳️ Voting Started!', 'All members are ready! The voting phase has begun.');
        }, 1000);
      }
      
    } catch (error) {
      showError('Error Confirming Readiness', error instanceof Error ? error.message : 'Failed to confirm readiness');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVotes = async () => {
    if (!userId || !canParticipate) {
      showError('Access Denied', 'You must be a member of this group to confirm votes.');
      return;
    }

    setLoading(true);
    try {
      console.debug('[VotingSessionCard] handleConfirmVotes: confirming votes');
      const result = await VotingService.confirmVotes(updatedSession.VotingSessionID, userId);
      console.debug('[VotingSessionCard] handleConfirmVotes: response', result);
      
      showSuccess('Votes Confirmed!', 'You have confirmed your votes are final.');
      
      // Check if voting completed automatically
      if (result.votingCompleted && result.completionResult) {
        console.debug('[VotingSessionCard] handleConfirmVotes: voting completed automatically');
        const winnerName = result.completionResult.winnerProposal?.meal?.name || 'Unknown meal';
        const voteCount = result.completionResult.winnerProposal?.voteCount || 0;
        
        // Show completion notification
        setTimeout(() => {
          showSuccess(
            '🎉 Voting Complete!', 
            `All votes confirmed! The winning meal is "${winnerName}" with ${voteCount} votes!`
          );
        }, 1000);

        // Auto-create consumption
        setTimeout(async () => {
          if (userId && result.completionResult?.session?.winnerMealId) {
            try {
              await VotingService.createConsumptionFromVote(updatedSession.VotingSessionID, {
                profileId: userId,
                name: winnerName,
                description: `Group meal from voting session: ${updatedSession.title || 'Meal Vote'}`,
                quantity: 1
              });
              showSuccess('✅ Consumption Registered!', `"${winnerName}" has been added to your group's consumption history.`);
            } catch (consumptionError) {
              console.error('Error creating consumption:', consumptionError);
              const errorMessage = consumptionError instanceof Error ? consumptionError.message : '';
              if (!errorMessage.includes('already') && !errorMessage.includes('duplicate')) {
                showError('Consumption Failed', 'Could not register the meal consumption automatically.');
              }
            }
          }
        }, 2000);

        // Notify history/activity after a short delay so they can refresh
        setTimeout(() => {
          onVotingComplete?.();
          notifyVotingCompleted(updatedSession.VotingSessionID);
        }, 3200);
      }
      
    } catch (error) {
      console.error('[VotingSessionCard] handleConfirmVotes: error', error);
      showError('Error Confirming Votes', error instanceof Error ? error.message : 'Failed to confirm votes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (updatedSession.status) {
      case 'proposal_phase':
        return <Badge variant="default" className="bg-blue-600">Proposing Meals</Badge>;
      case 'voting_phase':
        return <Badge variant="default" className="bg-amber-600">Voting</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{updatedSession.status}</Badge>;
    }
  };

  const getPhaseProgress = () => {
    const now = new Date().getTime();
    
    if (updatedSession.status === 'proposal_phase') {
      const start = new Date(updatedSession.createdAt).getTime();
      const end = new Date(updatedSession.proposalEndsAt).getTime();
      const elapsed = now - start;
      const total = end - start;
      return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    
    if (updatedSession.status === 'voting_phase' && updatedSession.votingEndsAt) {
      const start = new Date(updatedSession.proposalEndsAt).getTime();
      const end = new Date(updatedSession.votingEndsAt).getTime();
      const elapsed = now - start;
      const total = end - start;
      return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    
    return 100;
  };

  return (
    <>
      {/* Don't render expired sessions unless completed */}
      {isExpired() && updatedSession.status !== 'completed' ? null : (
        <Card className={`bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-200">
              <Vote className="w-5 h-5" />
              {updatedSession.title || 'Group Meal Vote'}
            </CardTitle>
            <p className="text-gray-300 text-sm mt-1">
              {updatedSession.description || `Started by ${updatedSession.initiator?.username || 'Unknown User'}`}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={getPhaseProgress()} className="h-2" />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {updatedSession.status === 'proposal_phase' && (
                <VotingTimer 
                  endTime={updatedSession.proposalEndsAt} 
                  label="Proposal ends in" 
                />
              )}
              {updatedSession.status === 'voting_phase' && updatedSession.votingEndsAt && (
                <VotingTimer 
                  endTime={updatedSession.votingEndsAt} 
                  label="Voting ends in" 
                />
              )}
              {updatedSession.status === 'completed' && updatedSession.completedAt && (
                <span>Completed {new Date(updatedSession.completedAt).toLocaleString()}</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {updatedSession.group?.members?.length || 0} members
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Phase-specific Actions */}
        {updatedSession.status === 'proposal_phase' && (
          <div className="space-y-2">
            {userId ? (
              canParticipate ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setShowProposeMeal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Propose Meal
                  </Button>
                  
                  {/* Ready for Voting Button */}
                  {!hasUserConfirmedReady && (updatedSession.proposals?.length || 0) > 0 && (
                    <Button
                      onClick={handleConfirmReadyForVoting}
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {loading ? 'Confirming...' : 'Ready for Voting'}
                    </Button>
                  )}

                  {hasUserConfirmedReady && (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Ready
                    </Badge>
                  )}
                  
                  {(updatedSession.proposals?.length || 0) > 0 && (isGroupOwner || isGroupAdmin) && (
                    <Button
                      onClick={handleStartVoting}
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      className="border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white"
                    >
                      Start Voting ({updatedSession.proposals?.length || 0} proposals)
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                  <p className="text-red-200 text-sm">You must be a member of this group to propose meals and participate in voting</p>
                </div>
              )
            ) : (
              <div className="text-center p-4 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                <p className="text-amber-200 text-sm">Please log in to propose meals and participate in voting</p>
              </div>
            )}
          </div>
        )}

        {updatedSession.status === 'voting_phase' && canParticipate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                You have voted for {userVoteCount} of {updatedSession.proposals?.length || 0} meals
              </span>
              
              {/* Vote Confirmation Button */}
              {!hasUserConfirmedVotes && userVoteCount > 0 && (
                <Button
                  onClick={handleConfirmVotes}
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {loading ? 'Confirming...' : 'Confirm My Votes'}
                </Button>
              )}

              {hasUserConfirmedVotes && (
                <Badge variant="default" className="bg-blue-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Votes Confirmed
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {shouldShowEarlyCompletion() && (isGroupOwner || isGroupAdmin) && (
                <Button
                  onClick={() => setShowEarlyCompletion(true)}
                  size="sm"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                >
                  End Voting Early
                </Button>
              )}
              {(isGroupOwner || isGroupAdmin) && (
                <Button
                  onClick={handleCompleteVoting}
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {loading ? 'Ending...' : 'Force End Voting'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Winner Display */}
        {updatedSession.status === 'completed' && updatedSession.winnerMeal && (
          <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-green-200">Winning Meal</span>
            </div>
            <h4 className="font-semibold text-white">{updatedSession.winnerMeal.name}</h4>
            {updatedSession.winnerMeal.description && (
              <p className="text-sm text-gray-300 mt-1">{updatedSession.winnerMeal.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Total votes: {updatedSession.totalVotes}
            </p>
          </div>
        )}

        {/* Meal Proposals */}
        {(updatedSession.proposals?.length || 0) > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-amber-200">
              Proposed Meals ({updatedSession.proposals?.length || 0})
            </h4>
            <div className="space-y-2">
              {updatedSession.proposals?.map((proposal) => (
                <MealProposalCard
                  key={proposal.MealProposalID}
                  proposal={proposal}
                  canVote={updatedSession.status === 'voting_phase' && canParticipate}
                  hasUserVoted={hasUserVoted(proposal)}
                  onVote={() => handleVote(proposal.MealProposalID)}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
        )}

        {(updatedSession.proposals?.length || 0) === 0 && updatedSession.status === 'proposal_phase' && (
          <div className="text-center py-8 text-gray-400">
            <Vote className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No meals proposed yet</p>
            <p className="text-sm">Be the first to suggest a meal for the group!</p>
          </div>
        )}
      </CardContent>

      {/* Propose Meal Modal */}
      <ProposeMealModal
        isOpen={showProposeMeal}
        onClose={() => setShowProposeMeal(false)}
        onPropose={handleProposeMeal}
        groupId={updatedSession.groupId}
      />

      {/* Early Completion Modal */}
      <EarlyCompletionModal
        isOpen={showEarlyCompletion}
        onClose={() => setShowEarlyCompletion(false)}
        onConfirm={handleEarlyCompleteVoting}
        onContinue={() => {
          setShowEarlyCompletion(false);
          setEarlyCompletionDismissed(true);
        }}
        session={updatedSession}
        loading={loading}
      />

      {/* Results Modal is now shown at GroupVotingSystem level to persist independently */}
    </Card>
      )}
    </>
  );
}
