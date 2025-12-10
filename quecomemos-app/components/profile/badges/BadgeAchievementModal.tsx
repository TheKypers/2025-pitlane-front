'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, TrendingUp, Crown } from 'lucide-react';
import { usePrimaryBadge } from '@/lib/hooks/usePrimaryBadge';
import { useUser } from '@/lib/contexts/UserContext';
import { 
  Badge, 
  BadgeLevel, 
  LEVEL_CONFIG, 
  getDefaultBadgeIcon, 
  getTierSpecificBadgeName 
} from './badgeHelpers';

interface BadgeAchievementModalProps {
  badge: Badge | null;
  level: BadgeLevel;
  isNewBadge: boolean;
  isLevelUp: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeAchievementModal({ 
  badge, 
  level, 
  isNewBadge, 
  isLevelUp, 
  isOpen, 
  onClose 
}: BadgeAchievementModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const { userData } = useUser();
  const { setPrimaryBadge } = usePrimaryBadge(userData?.profile?.id || '');

  const handleEquipBadge = async () => {
    if (!badge || !userData?.profile?.id) return;
    
    setIsEquipping(true);
    try {
      const success = await setPrimaryBadge(badge.BadgeID);
      if (success) {
        // Close modal after successful equip
        setTimeout(() => handleClose(), 500);
      }
    } catch (error) {
      console.error('Error equipping badge:', error);
    } finally {
      setIsEquipping(false);
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setShowContent(false);
    setTimeout(() => onClose(), 300);
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Show content after badge animation starts
      setTimeout(() => setShowContent(true), 300);
      
      // Auto-close after 8 seconds (doubled from 4)
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setShowContent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !badge) return null;

  const levelConfig = LEVEL_CONFIG[level];
  const trimmedIconUrl = badge.iconUrl?.trim();
  const hasCustomIcon = trimmedIconUrl && trimmedIconUrl !== '';
  const tierName = getTierSpecificBadgeName(badge.badgeType, level, badge.name);
  const isDiamond = level === 'diamond';

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className={`relative transition-all duration-500 ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Particle effects container */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                backgroundColor: levelConfig.particle,
                left: `${50 + Math.cos((i * Math.PI * 2) / 20) * 40}%`,
                top: `${50 + Math.sin((i * Math.PI * 2) / 20) * 40}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>

        {/* Main modal content */}
        <div className="relative bg-zinc-900/95 rounded-2xl border-2 border-amber-900/30 p-8 min-w-[400px] max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${levelConfig.bg} ${levelConfig.border} border-2 mb-4`}>
              {isNewBadge ? (
                <>
                  <Sparkles className={`w-5 h-5 ${levelConfig.color}`} />
                  <span className={`font-bold ${levelConfig.color}`}>BADGE UNLOCKED!</span>
                  <Sparkles className={`w-5 h-5 ${levelConfig.color}`} />
                </>
              ) : (
                <>
                  <TrendingUp className={`w-5 h-5 ${levelConfig.color}`} />
                  <span className={`font-bold ${levelConfig.color}`}>LEVEL UP!</span>
                  <TrendingUp className={`w-5 h-5 ${levelConfig.color}`} />
                </>
              )}
            </div>
          </div>

          {/* Badge Icon with animations */}
          <div className="flex justify-center mb-6">
            <div 
              className={`relative transition-all duration-700 ${
                isAnimating ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}
            >
              <div className={`relative w-32 h-32 rounded-full ${levelConfig.bg} ${levelConfig.border} border-4 shadow-2xl ${levelConfig.glow} flex items-center justify-center overflow-hidden`}>
                {/* Diamond heavenly animation */}
                {isDiamond && (
                  <>
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%)`,
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    />
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `
                          radial-gradient(2px 2px at 20% 30%, white, transparent),
                          radial-gradient(2px 2px at 60% 70%, white, transparent),
                          radial-gradient(2px 2px at 50% 50%, white, transparent),
                          radial-gradient(2px 2px at 80% 10%, white, transparent),
                          radial-gradient(1px 1px at 15% 90%, rgba(34, 211, 238, 0.8), transparent)
                        `,
                        backgroundSize: '100% 200%',
                        animation: 'ascend 3s linear infinite'
                      }}
                    />
                  </>
                )}
                
                {/* Standard shine for other tiers */}
                {!isDiamond && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, ${levelConfig.particle} 50%, transparent 100%)`,
                      animation: 'shine 2s ease-in-out infinite',
                      transform: 'translateX(-100%)'
                    }}
                  />
                )}

                {hasCustomIcon ? (
                  <Image
                    src={trimmedIconUrl!}
                    alt={badge.name}
                    width={100}
                    height={100}
                    className="w-24 h-24 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="flex items-center justify-center w-24 h-24 text-5xl">${getDefaultBadgeIcon(badge.badgeType)}</div>`;
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-24 h-24 text-5xl">
                    {getDefaultBadgeIcon(badge.badgeType)}
                  </div>
                )}
              </div>

              {/* Pulsing ring effect */}
              <div 
                className={`absolute inset-0 rounded-full ${levelConfig.border} border-2 animate-ping opacity-75`}
                style={{ animationDuration: '1.5s' }}
              />
            </div>
          </div>

          {/* Badge info with fade-in */}
          <div 
            className={`text-center transition-all duration-500 delay-300 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h2 className={`text-2xl font-bold mb-2 ${levelConfig.color}`}>
              {tierName}
            </h2>
            <div className={`inline-block px-3 py-1 rounded-full ${levelConfig.bg} ${levelConfig.border} border mb-3`}>
              <span className={`text-sm font-semibold ${levelConfig.color}`}>
                {levelConfig.name.toUpperCase()}
              </span>
            </div>
            <p className="text-amber-300/80 text-sm mb-4">
              {badge.description}
            </p>
            {isLevelUp && (
              <p className="text-amber-500 text-xs font-medium">
                Keep going to reach the next tier!
              </p>
            )}
          </div>

          {/* Equip Badge Button */}
          <div className="text-center mt-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEquipBadge();
              }}
              disabled={isEquipping}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                levelConfig.bg
              } ${levelConfig.border} border-2 ${levelConfig.color} hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Crown className="w-5 h-5" />
              {isEquipping ? 'Equipping...' : 'Equip This Badge'}
            </button>
          </div>

          {/* Tap to close hint */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">Tap anywhere to close</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translate(var(--tx, 0), var(--ty, -100px)) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--tx, 0) * 1.5), calc(var(--ty, -100px) * 2)) scale(0);
            opacity: 0;
          }
        }
        @keyframes shine {
          0%, 90% {
            transform: translateX(-100%);
            opacity: 0;
          }
          92% {
            opacity: 0.8;
          }
          95% {
            transform: translateX(100%);
            opacity: 0.8;
          }
          100% {
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
      `}</style>
    </div>
  );
}
