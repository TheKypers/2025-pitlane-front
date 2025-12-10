import { API_BASE_URL } from '@/lib/config/api';

export type GameType = 'egg_clicker' | 'roulette';

export type GameStatus = 
  | 'waiting'    // Waiting for players to join
  | 'ready'      // All players ready, waiting for host to start
  | 'countdown'  // Countdown in progress (3,2,1)
  | 'playing'    // Game in progress
  | 'submitting' // Time's up, waiting for all click data
  | 'completed'  // Game finished, winner determined
  | 'cancelled'; // Game was cancelled

export interface GameSession {
  GameSessionID: number;
  groupId: number;
  gameType: GameType;
  status: GameStatus;
  hostId: string;
  duration: number;
  minPlayers: number;
  startTime?: string;
  endTime?: string;
  winnerId?: string;
  winningMealId?: number;
  createdAt: string;
  updatedAt: string;
  host: {
    id: string;
    username: string;
  };
  winner?: {
    id: string;
    username: string;
  };
  winningMeal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  group: {
    GroupID: number;
    name: string;
  };
  participants: GameParticipant[];
  badgeNotifications?: Array<{
    badge: {
      BadgeID: number;
      name: string;
      description: string;
      badgeType: string;
      iconUrl?: string;
    };
    level: string;
    isNewBadge?: boolean;
    isLevelUp?: boolean;
    oldLevel?: string;
    progress?: number;
  }>;
}

export interface GameParticipant {
  GameParticipantID: number;
  gameSessionId: number;
  profileId: string;
  mealId?: number;
  clickCount: number;
  isReady: boolean;
  hasSubmitted: boolean;
  joinedAt: string;
  submittedAt?: string;
  profile: {
    id: string;
    username: string;
  };
  meal?: {
    MealID: number;
    name: string;
    description?: string;
  };
  badgeNotifications?: Array<{
    badge: {
      BadgeID: number;
      name: string;
      description: string;
      badgeType: string;
      iconUrl?: string;
    };
    level: string;
    isNewBadge?: boolean;
    isLevelUp?: boolean;
    oldLevel?: string;
    progress?: number;
  }>;
}

export class GameService {
  /**
   * Create a new game session
   */
  static async createGameSession(
    groupId: number,
    hostId: string,
    gameType: GameType,
    duration: number = 30,
    minPlayers: number = 1
  ): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupId,
        hostId,
        gameType,
        duration,
        minPlayers,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game session');
    }

    return response.json();
  }

  /**
   * Join a game session with a meal proposal
   */
  static async joinGameSession(
    gameSessionId: number,
    profileId: string,
    mealId?: number
  ): Promise<GameParticipant> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
        mealId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game session');
    }

    return response.json();
  }

  /**
   * Mark player as ready
   */
  static async markPlayerReady(
    gameSessionId: number,
    profileId: string,
    isReady: boolean = true
  ): Promise<GameParticipant> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}/ready`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
        isReady,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark ready');
    }

    return response.json();
  }

  /**
   * Start game countdown (host only)
   */
  static async startGameCountdown(
    gameSessionId: number,
    hostId: string
  ): Promise<GameSession> {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameSessionId}/start-countdown`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostId }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start countdown');
    }

    return response.json();
  }

  /**
   * Transition from countdown to playing
   */
  static async startGamePlaying(gameSessionId: number): Promise<GameSession> {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameSessionId}/start-playing`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start playing');
    }

    return response.json();
  }

  /**
   * End game time
   */
  static async endGameTime(gameSessionId: number): Promise<GameSession> {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameSessionId}/end-time`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to end game time');
    }

    return response.json();
  }

  /**
   * Submit click count
   */
  static async submitClickCount(
    gameSessionId: number,
    profileId: string,
    clickCount: number
  ): Promise<GameParticipant & { gameSession?: GameSession }> {
    const response = await fetch(
      `${API_BASE_URL}/games/${gameSessionId}/submit-clicks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          clickCount,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit clicks');
    }

    return response.json();
  }

  /**
   * Get game session details
   */
  static async getGameSession(gameSessionId: number): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get game session');
    }

    return response.json();
  }

  /**
   * Get active game session for a group
   */
  static async getActiveGameSession(groupId: number): Promise<GameSession | null> {
    const response = await fetch(`${API_BASE_URL}/games/group/${groupId}/active`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get active game session');
    }

    return response.json();
  }

  /**
   * Cancel game session (host only)
   */
  static async cancelGameSession(
    gameSessionId: number,
    hostId: string
  ): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel game');
    }

    return response.json();
  }

  /**
   * Force complete game (host only, skip waiting for all submissions)
   */
  static async forceCompleteGame(
    gameSessionId: number,
    hostId: string
  ): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}/force-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to force complete game');
    }

    return response.json();
  }

  /**
   * Determine roulette winner for animation (doesn't complete game)
   */
  static async determineRouletteWinner(
    gameSessionId: number,
    hostId: string
  ): Promise<{
    winnerId: number;
    winnerProfileId: string;
    winnerMealId: number;
    meals: Array<{
      id: number;
      profileId: string;
      username: string;
      mealId: number;
      mealName: string;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}/roulette/determine-winner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to determine winner');
    }

    return response.json();
  }

  /**
   * Spin roulette to randomly select a proposed meal (host only)
   * @param winnerProfileId - Optional predetermined winner profile ID
   */
  static async spinRoulette(
    gameSessionId: number,
    hostId: string,
    winnerProfileId?: string
  ): Promise<GameSession> {
    const response = await fetch(`${API_BASE_URL}/games/${gameSessionId}/roulette/spin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostId, winnerProfileId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to spin roulette');
    }

    return response.json();
  }
}
