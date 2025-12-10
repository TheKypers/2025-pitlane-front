'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, CheckCircle2, TrendingUp, Star } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config/api';
import { 
  BadgeLevel, 
  LEVEL_CONFIG, 
  getBadgeActionSubtitle,
  getBadgeTypeLabel, 
  getTierSpecificBadgeName 
} from './badgeHelpers';

interface BadgeRequirement {
  BadgeRequirementID: number;
  badgeId: number;
  level: BadgeLevel;
  requiredCount: number;
  description: string;
}

interface BadgeData {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  isActive: boolean;
  requirements?: BadgeRequirement[];
}

interface BadgeProgressData {
  badge: BadgeData;
  currentLevel: BadgeLevel | null;
  progress: number;
  isCompleted: boolean;
  earnedAt: string | null;
  lastUpgraded: string | null;
  currentLevelRequirement: BadgeRequirement | null;
  nextLevelRequirement: BadgeRequirement | null;
  hasEarned: boolean;
}

interface BadgeProgressDisplayProps {
  profileId?: string;
}

export function BadgeProgressDisplay({ profileId }: BadgeProgressDisplayProps) {
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [showEarnedBadges, setShowEarnedBadges] = useState(true);

  const fetchBadgeProgress = useCallback(async () => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/badges/user/${profileId}/progress`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch badge progress');
      }

      const data = await response.json();
      console.log('[BadgeProgressDisplay] Fetched data:', data);
      setBadgeProgress(data);
    } catch (error) {
      console.error('[BadgeProgressDisplay] Error fetching badge progress:', error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchBadgeProgress();
  }, [fetchBadgeProgress]);

  if (loading) {
    return (
      <Card className="bg-zinc-900/95 border-amber-900/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-100">
            <Award className="w-5 h-5 text-amber-500" />
            Badge Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedCount = badgeProgress.filter(bp => bp.hasEarned).length;
  const totalBadges = badgeProgress.length;
  const displayBadges = showAll 
    ? badgeProgress 
    : badgeProgress.filter(bp => bp.hasEarned);

  return (
    <Card className="bg-black-900/95 border-grey-900/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-100">
            <Award className="w-5 h-5 text-amber-500" />
            Badge Progress
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="border-amber-800/50 hover:bg-amber-950/50 text-amber-300 hover:text-amber-200"
          >
            {showAll ? 'Show Earned' : 'Show All'}
          </Button>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-amber-300/70">
            {earnedCount} of {totalBadges} badges unlocked
          </span>
          <span className="text-sm font-semibold text-amber-400">
            {Math.round((earnedCount / totalBadges) * 100)}%
          </span>
        </div>
        <Progress value={(earnedCount / totalBadges) * 100} className="mt-2 bg-amber-950/50" />
      </CardHeader>
      
      <CardContent>
        {/* Earned Badges Display */}
        {earnedCount > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Your Badges
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEarnedBadges(!showEarnedBadges)}
                className="h-7 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/30"
              >
                {showEarnedBadges ? 'Hide' : 'Show'}
              </Button>
            </div>
            
            {showEarnedBadges && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {badgeProgress
                  .filter(bp => bp.hasEarned)
                  .map((badgeData) => {
                    const badge = badgeData.badge;
                    const currentLevel = badgeData.currentLevel;
                    const levelConfig = currentLevel ? LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG] : null;
                    
                    return (
                      <div
                        key={badge.BadgeID}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          levelConfig 
                            ? `${levelConfig.bg} ${levelConfig.border}`
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          {/* Badge Icon with Level Color */}
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden ${
                            levelConfig ? `${levelConfig.bg} ${currentLevel === 'diamond' ? levelConfig.glow : ''}` : 'bg-zinc-800'
                          } border-2 ${levelConfig ? levelConfig.border : 'border-zinc-700'} shadow-lg`}>
                            {badge.iconUrl && badge.iconUrl.trim() !== '' ? (
                              <Image
                                src={badge.iconUrl.trim()}
                                alt={badge.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <Award className={`w-8 h-8 ${levelConfig ? levelConfig.iconColor : 'text-zinc-500'}`} />
                            )}
                          </div>
                          
                          {/* Badge Name */}
                          <div className="w-full">
                            <h4 className={`font-semibold text-xs truncate ${
                              levelConfig ? levelConfig.color : 'text-amber-500'
                            }`}>
                              {currentLevel ? getTierSpecificBadgeName(badge.badgeType, currentLevel, badge.name) : badge.name}
                            </h4>
                            {levelConfig && (
                              <Badge 
                                variant="outline" 
                                className={`mt-1 text-[10px] h-5 px-1.5 ${levelConfig.color} ${levelConfig.border} bg-transparent`}
                              >
                                {levelConfig.name}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Progress indicator */}
                          <div className="text-[10px] text-amber-400/60">
                            {badgeData.progress} {getBadgeActionSubtitle(badge.badgeType)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
            
            <div className="border-t border-amber-900/30 mt-4"></div>
          </div>
        )}

        {/* Progress Tracking Section */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress to Next Level
          </h3>
        </div>

        {displayBadges.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto text-amber-600/40 mb-4" />
            <h3 className="text-lg font-medium mb-2 text-amber-200">No badges to show</h3>
            <p className="text-amber-300/60 text-sm">
              {showAll 
                ? 'Complete actions to start earning badges!'
                : 'You haven\'t earned any badges yet. Toggle "Show All" to see available badges.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayBadges.map((badgeData) => {
              const badge = badgeData.badge;
              const hasEarned = badgeData.hasEarned;
              const currentLevel = badgeData.currentLevel;
              const totalProgress = badgeData.progress;
              const currentLevelReq = badgeData.currentLevelRequirement;
              const nextLevelReq = badgeData.nextLevelRequirement;
              
              console.log(`[BadgeProgressDisplay] Rendering ${badge.name}:`, {
                hasEarned,
                currentLevel,
                totalProgress,
                currentLevelReq: currentLevelReq?.requiredCount,
                nextLevelReq: nextLevelReq?.requiredCount
              });

              // Determine what to display
              const progressCurrent = totalProgress;
              let progressRequired = 1;
              let progressLabel = '';
              let isMaxed = false;

              if (!hasEarned && currentLevelReq) {
                // Not earned yet - show progress to bronze
                progressRequired = currentLevelReq.requiredCount;
                progressLabel = `${progressCurrent}/${progressRequired} to unlock Bronze`;
              } else if (hasEarned && nextLevelReq) {
                // Earned but can level up - show progress to next level
                progressRequired = nextLevelReq.requiredCount;
                const nextLevelConfig = LEVEL_CONFIG[nextLevelReq.level as keyof typeof LEVEL_CONFIG];
                progressLabel = `${progressCurrent}/${progressRequired} to ${nextLevelConfig.name}`;
              } else if (hasEarned && currentLevel === 'diamond') {
                // Max level reached
                isMaxed = true;
                progressLabel = 'Max level reached!';
              } else if (hasEarned) {
                // Shouldn't happen but handle it
                progressLabel = `${progressCurrent} total`;
              }

              const progressPercentage = Math.min(100, Math.round((progressCurrent / progressRequired) * 100));
              const levelConfig = currentLevel ? LEVEL_CONFIG[currentLevel as keyof typeof LEVEL_CONFIG] : null;

              return (
                <div
                  key={badge.BadgeID}
                  className={`relative p-4 rounded-lg border-2 transition-all shadow-lg ${
                    !hasEarned 
                      ? 'bg-zinc-900/60 border-zinc-700/50 opacity-70'
                      : levelConfig 
                        ? `${levelConfig.bg} ${levelConfig.border} ${currentLevel === 'diamond' ? levelConfig.glow : ''}`
                        : 'bg-zinc-900/60 border-zinc-700/50'
                  }`}
                >
                  {/* Header with badge name and current level */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Badge Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg overflow-hidden ${
                        hasEarned && levelConfig ? `${levelConfig.bg} ${currentLevel === 'diamond' ? levelConfig.glow : ''}` : 'bg-zinc-800'
                      } border-2 ${hasEarned && levelConfig ? levelConfig.border : 'border-zinc-700'} relative`}>
                        {!hasEarned && (
                          <div className="absolute inset-0 bg-zinc-950/70 rounded-full flex items-center justify-center backdrop-blur-sm z-10">
                            <Lock className="w-5 h-5 text-amber-500/60" />
                          </div>
                        )}
                        {badge.iconUrl && badge.iconUrl.trim() !== '' ? (
                          <Image
                            src={badge.iconUrl.trim()}
                            alt={badge.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Award className={`w-7 h-7 ${hasEarned && levelConfig ? levelConfig.iconColor : 'text-zinc-600'}`} />
                        )}
                      </div>
                      
                      {/* Badge Info */}
                      <div>
                        <h3 className={`font-bold text-base ${levelConfig ? levelConfig.color : 'text-amber-500'}`}>
                          {currentLevel ? getTierSpecificBadgeName(badge.badgeType, currentLevel, badge.name) : badge.name}
                        </h3>
                        <p className="text-xs text-amber-400/60">
                          {getBadgeTypeLabel(badge.badgeType)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Current Level Badge */}
                    {hasEarned && levelConfig && (
                      <Badge variant="outline" className={`${levelConfig.color} ${levelConfig.border} font-semibold bg-transparent`}>
                        {levelConfig.name.toUpperCase()}
                      </Badge>
                    )}
                    
                    {isMaxed && (
                      <div className="flex items-center gap-1 text-cyan-400">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-amber-300/70 mb-3">
                    {badge.description}
                  </p>

                  {/* Progress Section */}
                  {!isMaxed && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-amber-400/80">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {progressLabel}
                        </span>
                        <span className="font-semibold text-amber-400">{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2.5 bg-amber-950/50" />
                    </div>
                  )}

                  {isMaxed && (
                    <div className="bg-gradient-to-r from-cyan-950/50 to-blue-950/50 border border-cyan-700/60 rounded-lg p-3 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      <span className="font-semibold text-cyan-300">Maximum Level Achieved!</span>
                    </div>
                  )}

                  {/* Level Milestones */}
                  <div className="mt-4 pt-3 border-t border-amber-900/30">
                    <div className="flex items-center justify-between text-xs">
                      {(['bronze', 'silver', 'gold', 'diamond'] as const).map((level) => {
                        const config = LEVEL_CONFIG[level];
                        const requirement = badge.requirements?.find(r => r.level === level);
                        const isAchieved = hasEarned && currentLevel && 
                          ['bronze', 'silver', 'gold', 'diamond'].indexOf(currentLevel) >= 
                          ['bronze', 'silver', 'gold', 'diamond'].indexOf(level);
                        
                        return (
                          <div 
                            key={level}
                            className={`flex flex-col items-center gap-1 transition-all`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border overflow-hidden ${
                              isAchieved 
                                ? `${config.bg} ${config.border} ${level === 'diamond' ? config.glow : ''}` 
                                : 'bg-zinc-900/40 border-zinc-700/40'
                            }`}>
                              {badge.iconUrl && badge.iconUrl.trim() !== '' ? (
                                <Image
                                  src={badge.iconUrl.trim()}
                                  alt={`${badge.name} - ${level}`}
                                  width={20}
                                  height={20}
                                  className={`w-5 h-5 object-contain ${!isAchieved ? 'opacity-40' : ''}`}
                                />
                              ) : (
                                <Award className={`w-4 h-4 ${
                                  isAchieved ? config.iconColor : 'text-zinc-600'
                                }`} />
                              )}
                            </div>
                            <span className={`font-medium ${
                              isAchieved ? config.color : 'text-zinc-600'
                            }`}>{requirement?.requiredCount || '?'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
