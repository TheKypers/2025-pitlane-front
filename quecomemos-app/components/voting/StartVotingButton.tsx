'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Vote } from 'lucide-react';
import { useUser } from '@/lib/contexts/UserContext';
import { useGlobalNotification } from '@/lib/contexts/NotificationContext';
import { VotingService } from './VotingService';
import type { Group } from '../groups/index';

interface StartVotingButtonProps {
  group: Group;
  onVotingStarted?: () => void;
  disabled?: boolean;
  className?: string;
}

export function StartVotingButton({ group, onVotingStarted, disabled = false, className = '' }: StartVotingButtonProps) {
  const { userData } = useUser();
  const { showSuccess, showError } = useGlobalNotification();
  const [loading, setLoading] = useState(false);

  const userId = userData?.profile?.id;
  const isGroupMember = group.members?.some(member => member.profile.id === userId) || false;

  const handleStartVoting = async () => {
    if (!userId || !isGroupMember) {
      showError('Access Denied', 'You must be a member of this group to start a voting session.');
      return;
    }

    setLoading(true);
    try {
      await VotingService.startVotingSession({
        initiatorId: userId,
        groupId: group.GroupID,
        title: `Meal Vote - ${new Date().toLocaleDateString()}`,
        description: `Group meal voting session for ${group.name}`
      });

      showSuccess(
        'Voting Session Started!',
        'Members can now propose meals for the next 5 minutes.'
      );

      onVotingStarted?.();
    } catch (error) {
      showError(
        'Failed to Start Voting',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isGroupMember) {
    return null;
  }

  return (
    <Button
      onClick={handleStartVoting}
      disabled={disabled || loading}
      className={`bg-amber-600 hover:bg-amber-700 text-white ${className}`}
    >
      <Vote className="w-4 h-4 mr-2" />
      {loading ? 'Starting...' : 'Start Group Vote'}
    </Button>
  );
}