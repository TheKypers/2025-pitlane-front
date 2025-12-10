'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, ChefHat, Users, Clock } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useVoting } from '@/lib/contexts/VotingContext';
import { 
  VotingSessionCard, 
  StartVotingButton,
} from '@/components/voting';
import type { Group } from '@/components/groups/index';
import type { VotingSession } from '@/components/voting/types';

interface GroupVotingSystemProps {
  group: Group;
  onVotingComplete?: () => void;
  className?: string;
}

export function GroupVotingSystem({ group, onVotingComplete, className = '' }: GroupVotingSystemProps) {
  const { userData } = useUser();
  const { 
    activeSession, 
    loading
  } = useVoting();

  const userId = userData?.profile?.id;
  const isGroupMember = group.members?.some(member => member.profile.id === userId) || false;

  if (loading) {
    return (
      <Card className={`bg-gradient-to-br from-blue-800/30 to-blue-900/30 border-blue-700/50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-blue-200">Loading voting system...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If there's an active voting session that's NOT completed, show the voting interface
  // Allow starting a new session if current session is completed or null
  if (activeSession && activeSession.status !== 'completed') {
    // IMPORTANT: Merge the full group data into the session to ensure membership checks work
    const sessionWithGroupData: VotingSession = {
      ...activeSession,
      group: {
        GroupID: group.GroupID,
        name: group.name,
        description: group.description,
        createdBy: group.createdBy || activeSession.group?.createdBy,
        members: group.members || []
      }
    };
    
    return (
      <div className={`space-y-4 ${className}`}>
        <VotingSessionCard
          session={sessionWithGroupData}
          onVotingComplete={onVotingComplete}
          className="border-blue-700/50"
        />
      </div>
    );
  }

  // No active session OR session is completed - show the start voting interface
  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-gradient-to-br from-amber-800/30 to-amber-900/30 border-amber-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-200">
            <Vote className="w-5 h-5 mr-2" />
            Group Meal Voting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="bg-amber-600/20 p-4 rounded-full">
                <Vote className="w-12 h-12 text-amber-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-200">
              Ready to Decide What to Eat?
            </h3>
            
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Start a group voting session to let everyone propose and vote on meals. 
              The most popular choice wins!
            </p>

            <div className="space-y-4">
              {isGroupMember ? (
                <StartVotingButton
                  group={group}
                  className="px-8 py-3 text-lg"
                />
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <Users className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-400">You must be a member of this group to start voting sessions.</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>5 min proposals</span>
                </div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Democratic voting</span>
                </div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <ChefHat className="w-4 h-4" />
                  <span>Automatic registration</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}