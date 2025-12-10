import { API_BASE_URL } from '@/lib/config/api';
import type {
  VotingSession,
  CreateVotingSessionRequest,
  ProposeMealRequest,
  CastVoteRequest,
  CreateConsumptionFromVoteRequest,
  ConfirmReadyForVotingResponse,
  ConfirmVotesResponse
} from './types';

const VOTING_BASE_URL = `${API_BASE_URL}/voting`;

export class VotingService {
  /**
   * Start a new voting session for a group
   */
  static async startVotingSession(data: CreateVotingSessionRequest): Promise<VotingSession> {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start voting session');
    }

    return response.json();
  }

  /**
   * Get voting session details
   */
  static async getVotingSession(sessionId: number): Promise<VotingSession> {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get voting session');
    }

    return response.json();
  }

  /**
   * Get active voting sessions for a group (initial load only)
   * After this, use REST polling for updates
   */
  static async getInitialActiveSession(groupId: number): Promise<VotingSession[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(`${VOTING_BASE_URL}/groups/${groupId}/initial`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        console.error('[VotingService] getInitialActiveSession: API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorData.error,
          url: `${VOTING_BASE_URL}/groups/${groupId}/initial`
        });
        
        throw new Error(errorData.error || `Failed to get initial session (${response.status})`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('[VotingService] getInitialActiveSession: catch block', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while fetching initial session');
    }
  }

  /**
   * @deprecated Use getInitialActiveSession instead. This method is kept for backwards compatibility.
   */
  static async getActiveVotingSessions(groupId: number): Promise<VotingSession[]> {
    return this.getInitialActiveSession(groupId);
  }

  /**
   * Propose a meal for voting
   */
  static async proposeMeal(sessionId: number, data: ProposeMealRequest) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/propose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to propose meal');
    }

    return response.json();
  }

  /**
   * Start voting phase (transition from proposal to voting)
   */
  static async startVotingPhase(sessionId: number): Promise<VotingSession> {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/start-voting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start voting phase');
    }

    return response.json();
  }

  /**
   * Cast a vote for a meal proposal
   */
  static async castVote(sessionId: number, data: CastVoteRequest) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cast vote');
    }

    return response.json();
  }

  /**
   * Remove a vote
   */
  static async removeVote(sessionId: number, voteId: number) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/vote/${voteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove vote');
    }

    return response.json();
  }

  /**
   * Complete voting session and determine winner
   */
  static async completeVotingSession(sessionId: number) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to complete voting session');
    }

    return response.json();
  }

  /**
   * Create group consumption from completed voting session
   */
  static async createConsumptionFromVote(
    sessionId: number,
    data: CreateConsumptionFromVoteRequest
  ) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/create-consumption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create consumption from vote');
    }

    return response.json();
  }

  /**
   * Mark user as ready for voting (proposal phase confirmation)
   */
  static async confirmReadyForVoting(sessionId: number, userId: string): Promise<ConfirmReadyForVotingResponse> {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/confirm-ready`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to confirm ready for voting');
    }

    return response.json();
  }

  /**
   * Confirm user's votes (voting phase confirmation)
   */
  static async confirmVotes(sessionId: number, userId: string): Promise<ConfirmVotesResponse> {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/confirm-votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to confirm votes');
    }

    return response.json();
  }

  /**
   * Get confirmation status for a voting session
   */
  static async getConfirmationStatus(sessionId: number) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/confirmation-status`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get confirmation status');
    }

    return response.json();
  }

  /**
   * Clean up temporary voting data after session completion
   */
  static async cleanupVotingSession(sessionId: number) {
    const response = await fetch(`${VOTING_BASE_URL}/sessions/${sessionId}/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to cleanup voting session');
    }

    return response.json();
  }

  /**
   * Check for auto-transitions (could be called periodically)
   */
  static async checkTransitions() {
    const response = await fetch(`${VOTING_BASE_URL}/check-transitions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check transitions');
    }

    return response.json();
  }

  /**
   * Calculate time remaining for a phase
   */
  static getTimeRemaining(endTime: string): {
    total: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const total = new Date(endTime).getTime() - new Date().getTime();

    if (total <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { total, days, hours, minutes, seconds };
  }

  /**
   * Format time remaining as a readable string
   */
  static formatTimeRemaining(endTime: string): string {
    const { total, days, hours, minutes, seconds } = this.getTimeRemaining(endTime);

    if (total <= 0) return 'Time expired';

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get voting history for a group
   */
  static async getGroupVotingHistory(groupId: number, limit = 10, offset = 0) {
    try {
      const response = await fetch(
        `${VOTING_BASE_URL}/history/groups/${groupId}?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        let errorMessage = 'Failed to get voting history';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing error response fails, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[VotingService] Error fetching voting history:', error);
      throw error;
    }
  }

  /**
   * Get detailed voting session info including all proposals and participant portions
   */
  static async getVotingSessionDetails(sessionId: number) {
    try {
      const response = await fetch(`${VOTING_BASE_URL}/history/sessions/${sessionId}`);

      if (!response.ok) {
        let errorMessage = 'Failed to get session details';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If parsing error response fails, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[VotingService] Error fetching session details:', error);
      throw error;
    }
  }

  /**
   * Select meal portion for current user
   */
  static async selectMealPortion(
    sessionId: number,
    userId: string,
    mealPortionFraction: number,
    foodPortions: Array<{ foodId: number; portionFraction: number }>
  ) {
    const response = await fetch(`${VOTING_BASE_URL}/history/sessions/${sessionId}/portions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        mealPortionFraction,
        foodPortions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to select portion');
    }

    return response.json();
  }

  /**
   * Get participant status and portion selection info
   */
  static async getParticipantStatus(sessionId: number, userId: string) {
    const response = await fetch(
      `${VOTING_BASE_URL}/history/sessions/${sessionId}/participants/${userId}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get participant status');
    }

    return response.json();
  }

  /**
   * Get voting history for a specific user within a group (alias)
   * Currently proxies to group voting history and does not filter by user.
   */
  static async getVotingHistory(profileId: string, groupId: number) {
    // Future: filter sessions by participant when backend supports it
    return this.getGroupVotingHistory(groupId, 10, 0);
  }
}