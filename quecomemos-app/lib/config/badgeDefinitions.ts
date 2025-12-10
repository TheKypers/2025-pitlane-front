/**
 * Badge Configuration System
 * Centralized, scalable badge definitions with multi-level support
 * Each badge can progress through: Bronze (1) → Silver (10) → Gold (50) → Diamond (100)
 */

export type BadgeType = 
  | 'group_creation'
  | 'voting_participation'
  | 'voting_winner'
  | 'meal_creation'
  | 'consumption_tracking'
  | 'social_engagement';

export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeLevelThreshold {
  level: BadgeLevel;
  requiredCount: number;
  name: string; // Level name (e.g., "Bronze Group Founder")
  icon: string; // Level-specific icon
  description: string;
}

export interface BadgeDefinition {
  badgeType: BadgeType;
  baseName: string; // Base badge name (e.g., "Group Founder")
  baseDescription: string;
  baseIcon: string; // Base icon that can be used for all levels
  levels: BadgeLevelThreshold[]; // Different levels with their requirements
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * Standard level thresholds used across all badges
 */
export const STANDARD_LEVEL_THRESHOLDS = {
  bronze: 1,
  silver: 10,
  gold: 50,
  diamond: 100
} as const;

/**
 * Level color schemes
 */
export const LEVEL_COLORS = {
  bronze: {
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    gradient: 'from-amber-400 to-amber-600',
    icon: '🥉'
  },
  silver: {
    text: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-400',
    gradient: 'from-gray-300 to-gray-500',
    icon: '🥈'
  },
  gold: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: '🥇'
  },
  diamond: {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    gradient: 'from-blue-400 to-blue-600',
    icon: '💎'
  }
} as const;

/**
 * Centralized badge definitions with multi-level support
 */
export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  group_creation: {
    badgeType: 'group_creation',
    baseName: 'Group Founder',
    baseDescription: 'Create and manage groups',
    baseIcon: '👥',
    rarity: 'common',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Group Founder',
        icon: '🥉👥',
        description: 'Created your first group'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Group Founder',
        icon: '🥈👥',
        description: 'Created 10 groups'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Group Founder',
        icon: '🥇👥',
        description: 'Created 50 groups'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Group Founder',
        icon: '💎👥',
        description: 'Created 100 groups - Ultimate community builder!'
      }
    ]
  },
  voting_participation: {
    badgeType: 'voting_participation',
    baseName: 'Democracy Champion',
    baseDescription: 'Participate in voting sessions',
    baseIcon: '🗳️',
    rarity: 'common',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Democracy Champion',
        icon: '🥉🗳️',
        description: 'Participated in your first voting session'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Democracy Champion',
        icon: '🥈🗳️',
        description: 'Participated in 10 voting sessions'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Democracy Champion',
        icon: '🥇🗳️',
        description: 'Participated in 50 voting sessions'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Democracy Champion',
        icon: '💎🗳️',
        description: 'Participated in 100 voting sessions - True democratic spirit!'
      }
    ]
  },
  voting_winner: {
    badgeType: 'voting_winner',
    baseName: 'Taste Maker',
    baseDescription: 'Win voting sessions',
    baseIcon: '🏆',
    rarity: 'rare',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Taste Maker',
        icon: '🥉🏆',
        description: 'Won your first voting session'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Taste Maker',
        icon: '🥈🏆',
        description: 'Won 10 voting sessions'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Taste Maker',
        icon: '🥇🏆',
        description: 'Won 50 voting sessions'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Taste Maker',
        icon: '💎🏆',
        description: 'Won 100 voting sessions - Culinary influencer!'
      }
    ]
  },
  meal_creation: {
    badgeType: 'meal_creation',
    baseName: 'Chef',
    baseDescription: 'Create and share meals',
    baseIcon: '👨‍🍳',
    rarity: 'common',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Chef',
        icon: '🥉👨‍🍳',
        description: 'Created your first meal'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Chef',
        icon: '🥈👨‍🍳',
        description: 'Created 10 meals'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Chef',
        icon: '🥇👨‍🍳',
        description: 'Created 50 meals'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Chef',
        icon: '💎👨‍🍳',
        description: 'Created 100 meals - Master culinary artist!'
      }
    ]
  },
  consumption_tracking: {
    badgeType: 'consumption_tracking',
    baseName: 'Health Tracker',
    baseDescription: 'Track your nutrition',
    baseIcon: '📊',
    rarity: 'common',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Health Tracker',
        icon: '🥉📊',
        description: 'Tracked your first consumption'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Health Tracker',
        icon: '🥈📊',
        description: 'Tracked 10 consumptions'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Health Tracker',
        icon: '🥇📊',
        description: 'Tracked 50 consumptions'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Health Tracker',
        icon: '💎📊',
        description: 'Tracked 100 consumptions - Nutrition expert!'
      }
    ]
  },
  social_engagement: {
    badgeType: 'social_engagement',
    baseName: 'Social Butterfly',
    baseDescription: 'Engage with the community',
    baseIcon: '🦋',
    rarity: 'uncommon',
    levels: [
      {
        level: 'bronze',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.bronze,
        name: 'Bronze Social Butterfly',
        icon: '🥉🦋',
        description: 'Started your social journey'
      },
      {
        level: 'silver',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.silver,
        name: 'Silver Social Butterfly',
        icon: '🥈🦋',
        description: '10 social interactions'
      },
      {
        level: 'gold',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.gold,
        name: 'Gold Social Butterfly',
        icon: '🥇🦋',
        description: '50 social interactions'
      },
      {
        level: 'diamond',
        requiredCount: STANDARD_LEVEL_THRESHOLDS.diamond,
        name: 'Diamond Social Butterfly',
        icon: '💎🦋',
        description: '100 social interactions - Community legend!'
      }
    ]
  }
};

/**
 * Get badge definition by type
 */
export function getBadgeDefinition(badgeType: BadgeType): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS[badgeType];
}

/**
 * Get specific level information for a badge
 */
export function getBadgeLevelInfo(
  badgeType: BadgeType,
  level: BadgeLevel
): BadgeLevelThreshold | undefined {
  const definition = BADGE_DEFINITIONS[badgeType];
  return definition?.levels.find(l => l.level === level);
}

/**
 * Get next level information for a badge
 */
export function getNextLevel(currentLevel: BadgeLevel): BadgeLevel | null {
  const levelOrder: BadgeLevel[] = ['bronze', 'silver', 'gold', 'diamond'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  if (currentIndex === -1 || currentIndex === levelOrder.length - 1) return null;
  return levelOrder[currentIndex + 1];
}

/**
 * Calculate progress to next level
 */
export function calculateProgressToNextLevel(
  badgeType: BadgeType,
  currentLevel: BadgeLevel,
  currentProgress: number
): { current: number; required: number; percentage: number; nextLevel: BadgeLevel | null } {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) {
    // Already at max level
    const currentLevelInfo = getBadgeLevelInfo(badgeType, currentLevel);
    return {
      current: currentProgress,
      required: currentLevelInfo?.requiredCount || 0,
      percentage: 100,
      nextLevel: null
    };
  }

  const nextLevelInfo = getBadgeLevelInfo(badgeType, nextLevel);
  const currentLevelInfo = getBadgeLevelInfo(badgeType, currentLevel);
  
  if (!nextLevelInfo || !currentLevelInfo) {
    return { current: 0, required: 0, percentage: 0, nextLevel: null };
  }

  const required = nextLevelInfo.requiredCount;
  const percentage = Math.min(100, Math.round((currentProgress / required) * 100));

  return {
    current: currentProgress,
    required,
    percentage,
    nextLevel
  };
}

/**
 * Get level color scheme
 */
export function getLevelColorScheme(level: BadgeLevel) {
  return LEVEL_COLORS[level];
}

/**
 * Get default icon for a badge type
 */
export function getBadgeIcon(badgeType: string, level?: BadgeLevel): string {
  const definition = BADGE_DEFINITIONS[badgeType as BadgeType];
  if (!definition) return '🏅';
  
  if (level) {
    const levelInfo = definition.levels.find(l => l.level === level);
    return levelInfo?.icon || definition.baseIcon;
  }
  
  return definition.baseIcon;
}

/**
 * Get all badge definitions as array
 */
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS);
}

/**
 * Get badge rarity styling
 */
export function getBadgeRarityStyle(rarity?: string): string {
  const rarityStyles: Record<string, string> = {
    common: 'border-gray-300',
    uncommon: 'border-green-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-orange-400 shadow-lg'
  };
  return rarityStyles[rarity || 'common'] || rarityStyles.common;
}