'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Award, Calendar, TrendingUp, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BadgeLevel, 
  getDefaultBadgeIcon, 
  getBadgeTypeLabel, 
  getTierSpecificBadgeName 
} from './badgeHelpers';

interface BadgeDetails {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string | null;
  currentLevel?: BadgeLevel;
  progress?: number;
  earnedAt?: string;
  lastUpgraded?: string;
}

interface BadgeDetailsModalProps {
  badge: BadgeDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

// Level configuration matching BadgeProgressDisplay
const LEVEL_CONFIG = {
  bronze: { 
    name: 'Bronze', 
    color: 'text-amber-400', 
    bg: 'bg-amber-950/40', 
    border: 'border-amber-700/60',
    solidBg: 'bg-amber-600',
    requirement: 1
  },
  silver: { 
    name: 'Silver', 
    color: 'text-gray-300', 
    bg: 'bg-gray-900/40', 
    border: 'border-gray-600/60',
    solidBg: 'bg-gray-500',
    requirement: 10
  },
  gold: { 
    name: 'Gold', 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-950/40', 
    border: 'border-yellow-600/60',
    solidBg: 'bg-yellow-600',
    requirement: 50
  },
  diamond: { 
    name: 'Diamond', 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-950/40', 
    border: 'border-cyan-600/60',
    solidBg: 'bg-cyan-600',
    requirement: 100
  }
};

export function BadgeDetailsModal({ badge, isOpen, onClose }: BadgeDetailsModalProps) {
  if (!isOpen || !badge) return null;

  const trimmedIconUrl = badge.iconUrl?.trim();
  const hasCustomIcon = trimmedIconUrl && trimmedIconUrl !== '';
  const currentLevel = (badge.currentLevel || 'bronze') as 'bronze' | 'silver' | 'gold' | 'diamond';
  const levelConfig = LEVEL_CONFIG[currentLevel];
  
  // Shine animation colors and timings based on level
  const shineColors = {
    bronze: 'rgba(251, 191, 36, 0.6)', // amber
    silver: 'rgba(209, 213, 219, 0.6)', // gray
    gold: 'rgba(250, 204, 21, 0.6)', // yellow
    diamond: 'rgba(34, 211, 238, 0.8)' // cyan - more intense for diamond
  };
  
  const shineColor = shineColors[currentLevel];
  
  // Animation timing based on tier (more frequent for higher tiers)
  const animationTimings = {
    bronze: '10s', // slowest
    silver: '7s',  // medium-slow
    gold: '5s',    // medium-fast
    diamond: '3s'  // fastest and most glamorous
  };
  
  const animationDuration = animationTimings[currentLevel];
  
  // Diamond gets a double-shine effect for extra glamour
  const isDiamond = currentLevel === 'diamond';
  
  // Calculate next level info
  const levelOrder: ('bronze' | 'silver' | 'gold' | 'diamond')[] = ['bronze', 'silver', 'gold', 'diamond'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  const nextLevel = currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : null;
  const nextLevelConfig = nextLevel ? LEVEL_CONFIG[nextLevel] : null;
  const isMaxLevel = currentLevel === 'diamond';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-zinc-900/95 border-amber-900/30 shadow-2xl">
        <CardHeader className="border-b border-amber-900/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <Award className="w-5 h-5 text-amber-500" />
              Badge Details
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Badge Icon and Name */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className={`relative w-24 h-24 rounded-full ${levelConfig.bg} ${levelConfig.border} border-4 shadow-xl flex items-center justify-center overflow-hidden`}>
              {/* Diamond gets heavenly ascension animation */}
              {isDiamond ? (
                <>
                  {/* Glowing aura base */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%)`,
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                  {/* Rising light particles */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        radial-gradient(2px 2px at 20% 30%, white, transparent),
                        radial-gradient(2px 2px at 60% 70%, white, transparent),
                        radial-gradient(2px 2px at 50% 50%, white, transparent),
                        radial-gradient(2px 2px at 80% 10%, white, transparent),
                        radial-gradient(2px 2px at 90% 60%, white, transparent),
                        radial-gradient(1px 1px at 15% 90%, rgba(34, 211, 238, 0.8), transparent),
                        radial-gradient(1px 1px at 40% 40%, rgba(34, 211, 238, 0.8), transparent)
                      `,
                      backgroundSize: '100% 200%',
                      animation: 'ascend 3s linear infinite'
                    }}
                  />
                  {/* Heavenly rays */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `
                        conic-gradient(from 0deg at 50% 50%, 
                          transparent 0deg, 
                          rgba(255, 255, 255, 0.1) 45deg, 
                          transparent 90deg,
                          transparent 90deg,
                          rgba(34, 211, 238, 0.2) 135deg,
                          transparent 180deg,
                          transparent 180deg,
                          rgba(255, 255, 255, 0.15) 225deg,
                          transparent 270deg,
                          transparent 270deg,
                          rgba(34, 211, 238, 0.1) 315deg,
                          transparent 360deg
                        )
                      `,
                      animation: 'rotate 8s linear infinite'
                    }}
                  />
                  {/* Main diamond shine sweep */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)`,
                      animation: `shine ${animationDuration} ease-in-out infinite`,
                      transform: 'translateX(-100%)'
                    }}
                  />
                  {/* Secondary cross-shine */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(-45deg, transparent 0%, rgba(34, 211, 238, 0.4) 50%, transparent 100%)`,
                      animation: `shine ${animationDuration} ease-in-out infinite 0.5s`,
                      transform: 'translateX(-100%)'
                    }}
                  />
                </>
              ) : (
                /* Standard tier shine animation */
                <>
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${shineColor} 50%, transparent 100%)`,
                      animation: `shine ${animationDuration} ease-in-out infinite`,
                      transform: 'translateX(-100%)'
                    }}
                  />
                </>
              )}
              <style jsx>{`
                @keyframes shine {
                  0%, 90% {
                    transform: translateX(-100%);
                    opacity: 0;
                  }
                  92% {
                    opacity: 1;
                  }
                  95% {
                    transform: translateX(100%);
                    opacity: 1;
                  }
                  95.1%, 100% {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                }
                @keyframes ascend {
                  0% {
                    background-position: 0% 0%;
                    opacity: 0;
                  }
                  10% {
                    opacity: 1;
                  }
                  90% {
                    opacity: 1;
                  }
                  100% {
                    background-position: 0% -200%;
                    opacity: 0;
                  }
                }
                @keyframes rotate {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
                @keyframes pulse {
                  0%, 100% {
                    opacity: 0.5;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                  }
                }
              `}</style>
              {hasCustomIcon ? (
                <Image
                  src={trimmedIconUrl!}
                  alt={badge.name}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="flex items-center justify-center w-20 h-20 text-4xl">${getDefaultBadgeIcon(badge.badgeType)}</div>`;
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-20 h-20 text-4xl">
                  {getDefaultBadgeIcon(badge.badgeType)}
                </div>
              )}
            </div>

            <div>
              <h3 className={`text-xl font-bold ${levelConfig.color}`}>
                {getTierSpecificBadgeName(badge.badgeType, currentLevel as 'bronze' | 'silver' | 'gold' | 'diamond', badge.name)}
              </h3>
              <Badge className={`mt-2 ${levelConfig.solidBg} text-white border-0`}>
                {levelConfig.name.toUpperCase()}
              </Badge>
              <p className="text-sm text-amber-300/70 mt-2">{badge.description}</p>
            </div>
          </div>

          {/* Badge Information */}
          <div className="space-y-3 pt-4 border-t border-amber-900/30">
            {/* Badge Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-300/70 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Category
              </span>
              <Badge variant="outline" className="bg-amber-950/30 border-amber-800/50 text-amber-300">
                {getBadgeTypeLabel(badge.badgeType)}
              </Badge>
            </div>

            {/* Current Progress */}
            {badge.progress !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-300/70 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Progress
                </span>
                <span className="text-sm font-semibold text-amber-400">
                  {badge.progress} actions
                </span>
              </div>
            )}

            {/* Current Progress */}
            {badge.progress !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-300/70 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Total Progress
                </span>
                <span className="text-sm font-semibold text-amber-400">
                  {badge.progress} actions
                </span>
              </div>
            )}

            {/* Earned Date */}
            {badge.earnedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-300/70 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Earned On
                </span>
                <span className="text-sm font-medium text-amber-400">
                  {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}

            {/* Last Upgraded */}
            {badge.lastUpgraded && badge.lastUpgraded !== badge.earnedAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-amber-300/70 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Last Upgraded
                </span>
                <span className="text-sm font-medium text-amber-400">
                  {new Date(badge.lastUpgraded).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Level Progression */}
          {!isMaxLevel && nextLevelConfig && badge.progress !== undefined && (
            <div className="pt-4 border-t border-amber-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-300 font-medium">Progress to {nextLevelConfig.name}</span>
                <span className="text-sm font-semibold text-amber-400">
                  {badge.progress} / {nextLevelConfig.requirement}
                </span>
              </div>
              <Progress 
                value={Math.min((badge.progress / nextLevelConfig.requirement) * 100, 100)} 
                className="h-2.5 bg-amber-950/50"
              />
              <p className="text-xs text-amber-400/60 mt-1 text-center">
                {nextLevelConfig.requirement - badge.progress > 0 
                  ? `${nextLevelConfig.requirement - badge.progress} more to reach ${nextLevelConfig.name}`
                  : 'Ready to level up!'}
              </p>
            </div>
          )}

          {/* Level Milestones */}
          <div className="pt-4 border-t border-amber-900/30">
            <h4 className="text-sm text-amber-300 font-medium mb-3">Level Milestones</h4>
            <div className="grid grid-cols-4 gap-2">
              {(['bronze', 'silver', 'gold', 'diamond'] as const).map((level) => {
                const config = LEVEL_CONFIG[level];
                  const isAchieved = levelOrder.indexOf(currentLevel) >= levelOrder.indexOf(level);
                
                return (
                  <div 
                    key={level}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all ${
                      isAchieved 
                        ? `${config.bg} ${config.border} shadow-lg` 
                        : 'bg-zinc-900/40 border-zinc-700/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 overflow-hidden ${
                      isAchieved ? `${config.bg} ${config.border}` : 'bg-zinc-900/40 border-zinc-700/40'
                    }`}>
                      {hasCustomIcon ? (
                        <Image
                          src={trimmedIconUrl!}
                          alt={`${badge.name} - ${level}`}
                          width={28}
                          height={28}
                          className={`w-7 h-7 object-contain ${!isAchieved ? 'opacity-40' : ''}`}
                        />
                      ) : (
                        <span className={`text-xl ${!isAchieved ? 'opacity-40' : ''}`}>
                          {getDefaultBadgeIcon(badge.badgeType)}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      isAchieved ? config.color : 'text-zinc-600'
                    }`}>
                      {config.name.toUpperCase()}
                    </span>
                    <span className={`text-[9px] ${
                      isAchieved ? 'text-amber-400/80' : 'text-zinc-600'
                    }`}>
                      {config.requirement}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievement Message */}
          <div className={`rounded-lg p-3 mt-4 ${
            isMaxLevel 
              ? 'bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-700/60'
              : 'bg-amber-900/20 border border-amber-700/30'
          }`}>
            <p className={`text-sm text-center font-medium ${
              isMaxLevel ? 'text-cyan-300' : 'text-amber-200'
            }`}>
              {isMaxLevel 
                ? '🌟 Maximum Level Achieved! You\'re a legend!'
                : '🎉 Keep going to unlock the next level!'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
