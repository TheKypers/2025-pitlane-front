'use client';

import React from 'react';
import { Clock, Trophy, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PrimaryBadgeDisplay } from '@/components/profile/badges/PrimaryBadgeDisplay';
import type { VotingSession } from './types';

interface EarlyCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onContinue: () => void;
  session: VotingSession;
  loading?: boolean;
}

export function EarlyCompletionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onContinue, 
  session,
  loading = false 
}: EarlyCompletionModalProps) {
  if (!isOpen) return null;

  const totalMembers = session.group?.members?.length || 0;
  const totalVoters = new Set(
    session.proposals?.flatMap(p => 
      (p.votes || []).filter(v => v.isActive).map(v => v.voterId)
    ) || []
  ).size;

  const majorityThreshold = Math.ceil(totalMembers * 0.6); // 60% majority
  const hasMajority = totalVoters >= majorityThreshold;

  const participationPercentage = totalMembers > 0 ? (totalVoters / totalMembers) * 100 : 0;

  // Find current leading proposal
  const leadingProposal = session.proposals?.reduce((leader, current) => {
    if (!leader) return current;
    return (current.voteCount > leader.voteCount) ? current : leader;
  }, session.proposals[0]) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-neutral-900 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Trophy className="w-5 h-5" />
            Early Voting Completion
          </CardTitle>
          <p className="text-gray-300 text-sm">
            {hasMajority 
              ? 'A majority of group members have voted. You can end the voting early.'
              : 'Enough members have participated. Consider ending the voting phase.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Participation Stats */}
          <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Participation</span>
              <span className="text-sm font-medium text-white">
                {totalVoters} / {totalMembers} members
              </span>
            </div>
            
            <Progress value={participationPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">
                {participationPercentage.toFixed(0)}% participation
              </span>
              <Badge 
                variant={hasMajority ? "default" : "outline"}
                className={hasMajority ? "bg-green-600" : "text-gray-400"}
              >
                {hasMajority ? "Majority Reached" : "Simple Majority"}
              </Badge>
            </div>
          </div>

          {/* Current Leading Proposal */}
          {leadingProposal && (
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-200">Current Leader</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{leadingProposal.meal.name}</h4>
                  <Badge className="bg-amber-600">
                    {leadingProposal.voteCount} votes
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-300 flex items-center gap-1">
                  <span>Proposed by {leadingProposal.proposedBy?.username || 'Unknown User'}</span>
                  {leadingProposal.proposedById && (
                    <PrimaryBadgeDisplay 
                      profileId={leadingProposal.proposedById} 
                      size="sm"
                      showName={false}
                    />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Voting Options */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-200 mb-2">What happens next?</h4>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <Vote className="w-3 h-3 mt-0.5 text-blue-400" />
                <span><strong>End Now:</strong> The current leading meal wins and gets registered for the group</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3 h-3 mt-0.5 text-blue-400" />
                <span><strong>Continue:</strong> Wait for more votes or the timer to finish</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onContinue}
              variant="outline"
              disabled={loading}
              className="flex-1"
            >
              <Clock className="w-4 h-4 mr-1" />
              Continue Voting
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading || !leadingProposal}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ending...
                </div>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-1" />
                  End Voting
                </>
              )}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-white transition-colors"
          >
            Dismiss this notification
          </button>
        </CardContent>
      </Card>
    </div>
  );
}