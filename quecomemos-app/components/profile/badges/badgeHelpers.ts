/**
 * Badge Helper Functions and Constants
 * Centralized utilities for badge display and management
 */

export interface Badge {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface LevelConfig {
  name: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  particle: string;
  solidBg?: string;
  iconColor?: string;
}

export const LEVEL_CONFIG: Record<BadgeLevel, LevelConfig> = {
  bronze: {
    name: 'Bronze',
    color: 'text-amber-400',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500',
    glow: '',
    particle: '#f59e0b',
    solidBg: 'bg-amber-600',
    iconColor: 'text-amber-500'
  },
  silver: {
    name: 'Silver',
    color: 'text-gray-300',
    bg: 'bg-gray-900/40',
    border: 'border-gray-400',
    glow: '',
    particle: '#9ca3af',
    solidBg: 'bg-gray-500',
    iconColor: 'text-gray-400'
  },
  gold: {
    name: 'Gold',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-500',
    glow: '',
    particle: '#eab308',
    solidBg: 'bg-yellow-600',
    iconColor: 'text-yellow-500'
  },
  diamond: {
    name: 'Diamond',
    color: 'text-cyan-400',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-400',
    glow: 'shadow-cyan-400/50',
    particle: '#22d3ee',
    solidBg: 'bg-cyan-600',
    iconColor: 'text-cyan-400'
  }
};

export const LEVEL_COLORS: Record<BadgeLevel, { border: string }> = {
  bronze: { border: 'border-amber-500' },
  silver: { border: 'border-gray-400' },
  gold: { border: 'border-yellow-500' },
  diamond: { border: 'border-cyan-400' }
};

export const getDefaultBadgeIcon = (badgeType: string): string => {
  const typeIconMap: Record<string, string> = {
    'group_creation': '👥',
    'voting_participation': '🗳️',
    'voting_winner': '🏆',
    'meal_creation': '👨‍🍳'
  };
  return typeIconMap[badgeType] || '🏅';
};

export const getTierSpecificBadgeName = (
  badgeType: string,
  level: BadgeLevel,
  baseName: string
): string => {
  const tierNames: Record<string, Record<BadgeLevel, string>> = {
    'meal_creation': {
      'bronze': 'Apprentice Chef',
      'silver': 'Skilled Chef',
      'gold': 'Master Chef',
      'diamond': 'Culinary Visionary'
    },
    'group_creation': {
      'bronze': 'Community Builder',
      'silver': 'Group Organizer',
      'gold': 'Social Architect',
      'diamond': 'Unity Catalyst'
    },
    'voting_participation': {
      'bronze': 'Civic Participant',
      'silver': 'Active Voter',
      'gold': 'Democracy Champion',
      'diamond': 'Voice of the People'
    },
    'voting_winner': {
      'bronze': 'Taste Explorer',
      'silver': 'Flavor Curator',
      'gold': 'Culinary Influencer',
      'diamond': 'Legendary Taste Maker'
    },
    'game_clicker_winner': {
      'bronze': 'Thumb Wiggler',
      'silver': 'Casual Click Commander',
      'gold': 'Turbo Tap Titan',
      'diamond': 'Grandmaster of Infinite Clicking'
    },
    'game_roulette_winner': {
      'bronze': 'Low Roller',
      'silver': 'Lucky Spinner',
      'gold': 'Hot Streaker',
      'diamond': 'Wheel Whisperer'
    }

  };

  return tierNames[badgeType]?.[level] || baseName;
};

/**
 * Get elegant category label for badge type
 * Transforms database-stored snake_case to user-friendly display text
 */
export const getBadgeTypeLabel = (badgeType: string): string => {
  const typeLabels: Record<string, string> = {
    'group_creation': 'Group Creator',
    'voting_participation': 'Democracy Enthusiast',
    'voting_winner': 'Taste Maker',
    'meal_creation': 'Chef',
  };
  // Fallback: convert snake_case to Title Case
  return typeLabels[badgeType] || badgeType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get action subtitle for progress display
 * Provides context-appropriate units for different badge types
 */
export const getBadgeActionSubtitle = (badgeType: string): string => {
  const actionLabels: Record<string, string> = {
    'group_creation': 'groups created',
    'voting_participation': 'votes cast',
    'meal_creation': 'meals created',
    'voting_winner': 'voting wins',
    'game_clicker_winner': 'games won'
  };
  // Fallback: generic "actions" for unknown types
  return actionLabels[badgeType] || 'actions';
};

/**
 * Legacy label map (kept for backward compatibility)
 */
export const BADGE_TYPE_LABELS: Record<string, string> = {
  'group_creation': 'Group Creator',
  'voting_participation': 'Voter',
  'meal_creation': 'Chef',
  'voting_winner': 'Winner',
};
