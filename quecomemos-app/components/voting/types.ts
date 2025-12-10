import { Meal } from '@/lib/contexts/MealsContext';
import { Group } from '../groups/index';

export type VotingSessionStatus = 'proposal_phase' | 'voting_phase' | 'completed' | 'cancelled';
export type VoteType = 'up' | 'down';

export interface VotingSession {
  VotingSessionID: number;
  groupId: number;
  initiatorId: string;
  status: VotingSessionStatus;
  title?: string;
  description?: string;
  createdAt: string;
  proposalEndsAt: string;
  votingEndsAt?: string;
  completedAt?: string;
  winnerMealId?: number;
  totalVotes: number;
  group: Pick<Group, 'GroupID' | 'name' | 'description' | 'createdBy'> & {
    members: Array<{
      profile: {
        id: string;
        username: string;
      };
      role?: string;
    }>;
  };
  initiator: {
    id: string;
    username: string;
  };
  winnerMeal?: Meal;
  proposals: MealProposal[];
  votes: Vote[];
  proposalConfirmations?: UserProposalConfirmation[];
  voteConfirmations?: UserVoteConfirmation[];
}

export interface MealProposal {
  MealProposalID: number;
  votingSessionId: number;
  mealId: number;
  proposedById: string;
  proposedAt: string;
  voteCount: number;
  isActive: boolean;
  meal: Meal;
  proposedBy: {
    id: string;
    username: string;
  };
  votes: Vote[];
}

export interface Vote {
  VoteID: number;
  votingSessionId: number;
  mealProposalId: number;
  voterId: string;
  voteType: VoteType;
  votedAt: string;
  isActive: boolean;
  voter: {
    id: string;
    username: string;
  };
}

export interface CreateVotingSessionRequest {
  initiatorId: string;
  groupId: number;
  title?: string;
  description?: string;
}

export interface ProposeMealRequest {
  mealId: number;
  proposedById: string;
}

export interface CastVoteRequest {
  mealProposalId: number;
  voterId: string;
  voteType?: VoteType;
}

export interface CreateConsumptionFromVoteRequest {
  profileId: string;
  consumedAt?: string;
  quantity?: number;
  name?: string;
  description?: string;
}

export interface UserProposalConfirmation {
  UserProposalConfirmationID: number;
  votingSessionId: number;
  userId: string;
  confirmedAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface UserVoteConfirmation {
  UserVoteConfirmationID: number;
  votingSessionId: number;
  userId: string;
  confirmedAt: string;
  user: {
    id: string;
    username: string;
  };
}

export interface ConfirmationStatus {
  totalMembers: number;
  proposalPhase: {
    confirmedCount: number;
    pendingCount: number;
    confirmedUsers: Array<{
      id: string;
      username: string;
    }>;
    pendingUsers: Array<{
      id: string;
      username: string;
    }>;
    allConfirmed: boolean;
  };
  votingPhase: {
    confirmedCount: number;
    pendingCount: number;
    confirmedUsers: Array<{
      id: string;
      username: string;
    }>;
    pendingUsers: Array<{
      id: string;
      username: string;
    }>;
    allConfirmed: boolean;
  };
}

export interface ConfirmReadyForVotingResponse {
  confirmation: UserProposalConfirmation;
  votingStarted: boolean;
  transitionResult?: VotingSession;
}

export interface ConfirmVotesResponse {
  confirmation: UserVoteConfirmation;
  votingCompleted: boolean;
  completionResult?: {
    session: VotingSession;
    winnerProposal: MealProposal;
    totalVotes: number;
  };
}