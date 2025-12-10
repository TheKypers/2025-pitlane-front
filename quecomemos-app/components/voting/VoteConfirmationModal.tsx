'use client';

import React from 'react';
import { Vote, Users, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PrimaryBadgeDisplay } from '@/components/profile/badges/PrimaryBadgeDisplay';
import type { MealProposal } from './types';

interface VoteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  proposal: MealProposal;
  hasAlreadyVoted: boolean;
  loading?: boolean;
}

export function VoteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  proposal, 
  hasAlreadyVoted,
  loading = false 
}: VoteConfirmationModalProps) {
  if (!isOpen) return null;

  const totalCalories = proposal.meal.mealFoods?.reduce((total, mealFood) => 
    total + (mealFood.food.kCal * mealFood.quantity), 0
  ) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-neutral-900 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Vote className="w-5 h-5" />
            {hasAlreadyVoted ? 'Change Your Vote?' : 'Confirm Your Vote'}
          </CardTitle>
          <p className="text-gray-300 text-sm">
            {hasAlreadyVoted 
              ? 'You have already voted for this meal. Do you want to change your vote?'
              : 'You are about to vote for this meal. Please confirm your choice.'
            }
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Meal Details */}
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-medium text-white">{proposal.meal.name}</h4>
                {proposal.meal.description && (
                  <p className="text-sm text-gray-300 mt-1">{proposal.meal.description}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {totalCalories} kcal
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
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
            </div>
          </div>

          {/* Current Votes */}
          {(proposal.votes?.length || 0) > 0 && (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-200">
                  Current Votes: {proposal.voteCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(proposal.votes || [])
                  .filter(vote => vote.isActive && vote.voteType === 'up')
                  .slice(0, 5)
                  .map(vote => (
                    <Badge
                      key={vote.VoteID}
                      variant="outline"
                      className="text-xs text-blue-200 border-blue-400/50"
                    >
                      {vote.voter?.username || 'User'}
                    </Badge>
                  ))}
                {(proposal.votes || []).filter(vote => vote.isActive && vote.voteType === 'up').length > 5 && (
                  <Badge variant="outline" className="text-xs text-gray-400">
                    +{(proposal.votes || []).filter(vote => vote.isActive && vote.voteType === 'up').length - 5} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Warning for changing vote */}
          {hasAlreadyVoted && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-3">
              <p className="text-sm text-amber-200">
                <strong>Note:</strong> Changing your vote will remove your previous vote and add it to this meal.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 ${
                hasAlreadyVoted 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {hasAlreadyVoted ? 'Changing...' : 'Voting...'}
                </div>
              ) : (
                hasAlreadyVoted ? 'Change Vote' : 'Confirm Vote'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}