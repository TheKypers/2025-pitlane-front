'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, X } from 'lucide-react';
import { useUserBadges } from '@/lib/hooks/useUserBadges';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';
import { getDefaultBadgeIcon } from './badgeHelpers';

interface BadgeSelectionModalProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function BadgeSelectionModal({ profileId, isOpen, onClose, onSuccess }: BadgeSelectionModalProps) {
  const { badges, loading: badgesLoading } = useUserBadges(profileId);
  const { primaryBadge, setPrimaryBadge, loading: primaryLoading } = usePrimaryBadge(profileId);

  if (!isOpen) return null;

  const handleSelectBadge = async (badgeId: number | null) => {
    try {
      const success = await setPrimaryBadge(badgeId);
      if (success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Error selecting badge:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-neutral-900 border-amber-700/50 max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-200">
            <Crown className="w-5 h-5" />
            Select Primary Badge
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-neutral-400 hover:text-amber-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300">
            Choose which badge will appear next to your name on your profile. You can change it anytime.
          </p>

          {badgesLoading || primaryLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Opción "Sin badge" */}
              <Card className={`cursor-pointer transition-all duration-200 ${
                !primaryBadge 
                  ? 'bg-green-900/20 border-green-600/50' 
                  : 'bg-neutral-800/50 border-neutral-700 hover:border-amber-600/50 hover:bg-neutral-700/50'
              }`}>
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between"
                    onClick={() => handleSelectBadge(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🚫</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-white">No Badge</h3>
                        <p className="text-sm text-gray-400">Don&apos;t display any badge next to your name</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!primaryBadge ? (
                        <Badge className="bg-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Current
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">Click to select</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de badges del usuario */}
              <div className="space-y-3">
                <h4 className="font-medium text-amber-200">Your Available Badges:</h4>
                {badges.length === 0 ? (
                  <Card className="bg-neutral-800/50 border-neutral-700">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">
                        You don&apos;t have any badges yet. Create groups, upload meals, and participate in voting to earn badges!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  badges.map((badge) => {
                    const isSelected = primaryBadge?.BadgeID === badge.BadgeID;
                    const trimmedIconUrl = badge.iconUrl?.trim();
                    const hasCustomIcon = trimmedIconUrl && trimmedIconUrl !== '';

                    return (
                      <Card 
                        key={badge.BadgeID}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-green-900/20 border-green-600/50' 
                            : 'bg-neutral-800/50 border-neutral-700 hover:border-amber-600/50 hover:bg-neutral-700/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div 
                            className="flex items-center justify-between"
                            onClick={() => handleSelectBadge(badge.BadgeID)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 relative">
                                {hasCustomIcon ? (
                                  <Image
                                    src={trimmedIconUrl!}
                                    alt={badge.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full border border-gray-200 bg-white p-1"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `<div class="flex items-center justify-center w-12 h-12 text-2xl bg-gray-100 rounded-full border border-gray-200">${getDefaultBadgeIcon(badge.badgeType)}</div>`;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gray-100 rounded-full border border-gray-200">
                                    {getDefaultBadgeIcon(badge.badgeType)}
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h3 className="font-medium text-white">{badge.name}</h3>
                                <p className="text-sm text-gray-400">{badge.description}</p>
                                {badge.earnedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <Badge className="bg-green-600">
                                  <Check className="w-3 h-3 mr-1" />
                                  Current
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-500">Click to select</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}