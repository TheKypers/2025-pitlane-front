'use client';

import React from 'react';
import { Trophy, Users, TrendingUp, Clock, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PrimaryBadgeDisplay } from '../profile/badges/PrimaryBadgeDisplay';
import type { VotingSession, MealProposal } from './types';

interface VotingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewMeal: () => void;
  session: VotingSession;
  winnerProposal?: MealProposal;
}

export function VotingResultsModal({ 
  isOpen, 
  onClose, 
  onViewMeal,
  session,
  winnerProposal 
}: VotingResultsModalProps) {
  if (!isOpen || !winnerProposal) {
    return null;
  }

  const sortedProposals = [...(session.proposals || [])].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = sortedProposals.reduce((sum, p) => sum + p.voteCount, 0);
  const maxVotes = Math.max(...sortedProposals.map(p => p.voteCount));

  const totalCalories = winnerProposal.meal.mealFoods?.reduce((total, mealFood) => 
    total + (mealFood.food.kCal * mealFood.quantity), 0
  ) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-neutral-900 border-amber-700/50 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Voting Results
          </CardTitle>
          <p className="text-gray-300 text-sm">
            The group has chosen their meal! Here are the final results.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Winner Section */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-600/50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500 p-2 rounded-full">
                <Trophy className="w-6 h-6 text-yellow-900" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-200">Winner!</h3>
                <p className="text-yellow-300/80 text-sm">This meal will be registered for the group</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white">{winnerProposal.meal.name}</h4>
                  {winnerProposal.meal.description && (
                    <p className="text-gray-300 text-sm mt-1">{winnerProposal.meal.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className="bg-yellow-600 text-yellow-900 mb-2">
                    {winnerProposal.voteCount} votes
                  </Badge>
                  <div className="text-xs text-gray-400">
                    {totalCalories} kcal
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-300">
                  <Users className="w-3 h-3" />
                  <span>Proposed by {winnerProposal.proposedBy?.username || 'Unknown User'}</span>
                  {winnerProposal.proposedById && (
                    <PrimaryBadgeDisplay 
                      profileId={winnerProposal.proposedById} 
                      size="sm"
                      showName={false}
                    />
                  )}
                </span>
                <span className="flex items-center gap-1 text-gray-300">
                  <Clock className="w-3 h-3" />
                  {new Date(winnerProposal.proposedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Voting Statistics */}
          <div className="bg-neutral-800/50 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Voting Summary
            </h4>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-400">{sortedProposals.length}</div>
                <div className="text-xs text-gray-400">Proposals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{totalVotes}</div>
                <div className="text-xs text-gray-400">Total Votes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {session.group?.members?.length || 0}
                </div>
                <div className="text-xs text-gray-400">Members</div>
              </div>
            </div>
          </div>

          {/* All Results */}
          <div className="space-y-3">
            <h4 className="font-medium text-white">All Results</h4>
            
            {sortedProposals.map((proposal, index) => {
              const percentage = maxVotes > 0 ? (proposal.voteCount / maxVotes) * 100 : 0;
              const isWinner = proposal.MealProposalID === winnerProposal.MealProposalID;
              
              return (
                <div 
                  key={proposal.MealProposalID}
                  className={`border rounded-lg p-4 ${
                    isWinner 
                      ? 'border-yellow-600/50 bg-yellow-900/20' 
                      : 'border-gray-600/50 bg-neutral-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Trophy className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={`font-medium ${
                        isWinner ? 'text-yellow-200' : 'text-white'
                      }`}>
                        {proposal.meal.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isWinner ? "default" : "outline"} className={
                        isWinner ? "bg-yellow-600 text-yellow-900" : ""
                      }>
                        {proposal.voteCount} votes
                      </Badge>
                    </div>
                  </div>
                  
                  <Progress 
                    value={percentage} 
                    className={`h-2 mb-2 ${
                      isWinner ? '[&_div]:bg-yellow-500' : '[&_div]:bg-gray-500'
                    }`}
                  />
                  
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <span>Proposed by {proposal.proposedBy?.username || 'Unknown User'}</span>
                    {proposal.proposedById && (
                      <PrimaryBadgeDisplay 
                        profileId={proposal.proposedById} 
                        size="sm"
                        showName={false}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close Results
            </Button>
            <Button
              onClick={onViewMeal}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              <ChefHat className="w-4 h-4 mr-1" />
              View Full Meal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}