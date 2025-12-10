/**
 * Badge Components - Centralized Exports
 * All badge-related components and utilities
 */

export { BadgeAchievementModal } from './BadgeAchievementModal';
export { BadgeDetailsModal } from './BadgeDetailsModal';
export { BadgeProgressDisplay } from './BadgeProgressDisplay';
export { BadgeSelectionModal } from './BadgeSelectionModal';
export { PrimaryBadgeDisplay } from './PrimaryBadgeDisplay';

export type {
  Badge,
  BadgeLevel,
  LevelConfig
} from './badgeHelpers';

export {
  LEVEL_CONFIG,
  LEVEL_COLORS,
  BADGE_TYPE_LABELS,
  getDefaultBadgeIcon,
  getTierSpecificBadgeName,
  getBadgeTypeLabel
} from './badgeHelpers';
