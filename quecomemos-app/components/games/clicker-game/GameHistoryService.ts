import { API_BASE_URL } from '@/lib/config/api';

export interface GameHistoryResponse {
  sessions: Array<{
    sessionId: number;
    gameType: string;
    duration: number;
    createdAt: string;
    startTime: string;
    endTime: string;
    status: string;
    winner: {
      id: string;
      username: string;
      clickCount: number;
    };
    winningMeal: {
      mealId: number;
      name: string;
      description: string;
    } | null;
    participantCount: number;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface GameSessionDetails {
  sessionId: number;
  gameType: string;
  duration: number;
  status: string;
  createdAt: string;
  startTime: string;
  endTime: string;
  host: {
    id: string;
    username: string;
  };
  winner: {
    id: string;
    username: string;
    clickCount: number;
  } | null;
  winningMeal: {
    mealId: number;
    name: string;
    description: string;
    foods: Array<{
      foodId: number;
      name: string;
      quantity: number;
      kCal: number; // kCal per unit, not per 100g
    }>;
  } | null;
  participants: Array<{
    participantId: number;
    profile: {
      id: string;
      username: string;
    };
    proposedMeal: {
      mealId: number;
      name: string;
      description: string;
      foods: Array<{
        foodId: number;
        name: string;
        quantity: number;
        kCal: number; // kCal per unit, not per 100g
      }>;
    } | null;
    clickCount: number;
    isReady: boolean;
    hasSubmitted: boolean;
    joinedAt: string;
    submittedAt: string | null;
    hasSelectedPortion?: boolean;
    portionFraction?: number;
    mealPortions: Array<{
      mealId: number;
      mealName: string;
      mealPortionId: number;
      consumedAt: string;
      foodPortions: Array<{
        foodId: number;
        name: string;
        portionFraction: number;
        quantityConsumed: number;
      }>;
    }>;
  }>;
}

export class GameHistoryService {
  /**
   * Get game history for a group
   */
  static async getGroupGameHistory(
    groupId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<GameHistoryResponse> {
    const response = await fetch(
      `${API_BASE_URL}/game-history/group/${groupId}?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch game history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get game history for a specific user within a group (alias)
   * Currently proxies to group game history and does not filter by user.
   */
  static async getGameHistory(profileId: string, groupId: number) {
    // Future: filter sessions by participant when backend supports it
    return this.getGroupGameHistory(groupId, 10, 0);
  }

  /**
   * Get detailed information about a specific game session
   */
  static async getGameSessionDetails(sessionId: number): Promise<GameSessionDetails> {
    const response = await fetch(`${API_BASE_URL}/game-history/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch game session details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Register meal portion consumed by a participant
   */
  static async registerGameMealPortion(
    sessionId: number,
    profileId: string,
    mealId: number,
    mealPortionFraction: number,
    foodPortions: Array<{
      foodId: number;
      portionFraction: number;
    }>
  ): Promise<{ success: boolean; mealPortion: unknown }> {
    const payload = {
      profileId,
      mealId,
      mealPortionFraction,
      foodPortions,
    };
    
    
    const response = await fetch(
      `${API_BASE_URL}/game-history/session/${sessionId}/register-portion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[GameHistoryService] Error response:', errorData);
      throw new Error(errorData.message || errorData.error || 'Failed to register meal portion');
    }

    const result = await response.json();
    return result;
  }
}
