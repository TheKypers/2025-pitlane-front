import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar } from 'lucide-react';

interface BadgeData {
  BadgeID: number;
  name: string;
  description: string;
  badgeType: string;
  iconUrl?: string;
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

interface UserBadgesProps {
  badges: BadgeData[];
  loading?: boolean;
}

export function UserBadges({ badges, loading = false }: UserBadgesProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No badges yet</h3>
            <p className="text-muted-foreground">
              Start creating groups, voting, and sharing meals to earn your first badges!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'group_creation':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'voting_participation':
        return 'bg-green-500/10 text-green-700 border-green-300';
      case 'voting_winner':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-300';
      case 'meal_creation':
        return 'bg-orange-500/10 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-300';
    }
  };

  const formatBadgeType = (badgeType: string) => {
    switch (badgeType) {
      case 'group_creation':
        return 'Group Creator';
      case 'voting_participation':
        return 'Voter';
      case 'voting_winner':
        return 'Winner';
      case 'meal_creation':
        return 'Chef';
      default:
        return badgeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getDefaultBadgeEmoji = (badgeType: string) => {
    switch (badgeType) {
      case 'group_creation':
        return '👥';
      case 'voting_participation':
        return '🗳️';
      case 'voting_winner':
        return '🏆';
      case 'meal_creation':
        return '👨‍🍳';
      default:
        return '🏅';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.BadgeID}
              className={`p-4 rounded-lg border-2 ${getBadgeColor(badge.badgeType)}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex-shrink-0">
                  {badge.iconUrl && badge.iconUrl.trim() !== '' ? (
                    <Image
                      src={badge.iconUrl.trim()}
                      alt={badge.name}
                      width={32}
                      height={32}
                      className="w-full h-full rounded-full border border-gray-200 bg-white p-0.5"
                      onError={(e) => {
                        // Fallback to emoji if image fails
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="text-2xl flex items-center justify-center">${getDefaultBadgeEmoji(badge.badgeType)}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="text-2xl flex items-center justify-center">
                      {getDefaultBadgeEmoji(badge.badgeType)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-1 truncate">
                    {badge.name}
                  </h3>
                  <p className="text-xs opacity-80 mb-2 line-clamp-2">
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {formatBadgeType(badge.badgeType)}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs opacity-60">
                      <Calendar className="w-3 h-3" />
                      {new Date(badge.earnedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}