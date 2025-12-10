'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChefHat, ThumbsUp, Clock, User } from 'lucide-react';
import { MealComposition } from '../meal/MealComposition';
import { VoteConfirmationModal } from './VoteConfirmationModal';
import { PrimaryBadgeDisplay } from '../profile/badges/PrimaryBadgeDisplay';
import type { MealProposal } from './types';

interface MealProposalCardProps {
  proposal: MealProposal;
  canVote: boolean;
  hasUserVoted: boolean;
  onVote: () => void;
  disabled?: boolean;
  showComposition?: boolean;
}

export function MealProposalCard({ 
  proposal, 
  canVote, 
  hasUserVoted, 
  onVote, 
  disabled = false,
  showComposition = false 
}: MealProposalCardProps) {
  
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  
  const totalCalories = proposal.meal.mealFoods?.reduce((total, mealFood) => 
    total + (mealFood.food.kCal * mealFood.quantity), 0
  ) || 0;

  const handleVoteClick = () => {
    setShowVoteConfirmation(true);
  };

  const handleConfirmVote = async () => {
    setVotingLoading(true);
    try {
      await onVote();
      setShowVoteConfirmation(false);
    } finally {
      setVotingLoading(false);
    }
  };

  return (
    <>
    <Card className="bg-neutral-800/50 border-gray-600/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="w-4 h-4 text-amber-500" />
              <h4 className="font-medium text-white">{proposal.meal.name}</h4>
              {hasUserVoted && (
                <Badge variant="default" className="bg-green-600 text-xs">
                  Voted
                </Badge>
              )}
            </div>

            {proposal.meal.description && (
              <p className="text-sm text-gray-300 mb-2">{proposal.meal.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Proposed by {proposal.proposedBy?.username || 'Unknown User'}</span>
                {proposal.proposedById && (
                  <PrimaryBadgeDisplay 
                    profileId={proposal.proposedById} 
                    size="sm"
                    showName={false}
                  />
                )}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(proposal.proposedAt).toLocaleString()}
              </span>
              <span>{totalCalories} kcal</span>
            </div>

            {/* Meal Composition */}
            {showComposition && proposal.meal && (
              <div className="mb-3">
                <MealComposition meal={proposal.meal} />
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-400">{proposal.voteCount}</span>
              <ThumbsUp className="w-4 h-4 text-amber-400" />
            </div>

            {canVote && (
              <Button
                onClick={handleVoteClick}
                size="sm"
                disabled={disabled}
                className={`min-w-[80px] ${
                  hasUserVoted
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {hasUserVoted ? 'Change Vote' : 'Vote'}
              </Button>
            )}
          </div>
        </div>

        {/* Voter List (if there are votes) */}
        {(proposal.votes?.length || 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600/30">
            <p className="text-xs text-gray-400 mb-1">Voted by:</p>
            <div className="flex flex-wrap gap-1">
              {(proposal.votes || [])
                .filter(vote => vote.isActive && vote.voteType === 'up')
                .map(vote => (
                  <div key={vote.VoteID} className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-xs border-amber-600/50 text-amber-400"
                    >
                      {vote.voter?.username || 'Unknown User'}
                    </Badge>
                    {vote.voterId && (
                      <PrimaryBadgeDisplay 
                        profileId={vote.voterId} 
                        size="sm"
                        showName={false}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Vote Confirmation Modal */}
    <VoteConfirmationModal
      isOpen={showVoteConfirmation}
      onClose={() => setShowVoteConfirmation(false)}
      onConfirm={handleConfirmVote}
      proposal={proposal}
      hasAlreadyVoted={hasUserVoted}
      loading={votingLoading}
    />
    </>
  );
}