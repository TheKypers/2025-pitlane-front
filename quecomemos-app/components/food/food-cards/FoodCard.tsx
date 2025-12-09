'use client';

import { useState, useRef } from 'react';
import { Utensils, Heart, Eye, SquarePen, Hexagon } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useKorvenCheck } from '@/components/meal/hooks/useKorvenCheck';
import { DietaryBadge } from '@/components/alerts';

interface DietaryAlert {
  hasConflict: boolean;
  isFit?: boolean;
  message?: string;
  conflicts?: Array<{
    id: number;
    name: string;
  }>;
}

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  profileId?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  dietaryAlert?: DietaryAlert;
  [key: string]: unknown;
}

interface FoodCardProps {
  food: Food;
  variant?: 'simple' | 'enhanced' | 'editable';
  onCardClick?: (food: Food) => void;
  onEditClick?: (food: Food) => void;
  isOwner?: boolean;
  showPreferenceBadge?: boolean;
  preferenceNames?: { [key: number]: string };
  restrictionNames?: { [key: number]: string };
  className?: string;
  showAlert?: boolean; // Show dietary alert badge
}

export function FoodCard({ 
  food, 
  variant = 'simple',
  onCardClick, 
  onEditClick,
  isOwner = false,
  showPreferenceBadge = false,
  preferenceNames = {},
  restrictionNames = {},
  className,
  showAlert = false
}: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { isKorvenInspiredFood } = useKorvenCheck();
  const isKorven = isKorvenInspiredFood(food.name);

  // Get preference and restriction names for display
  const getPreferenceNames = () => {
    if (!food.preferences) return [];
    return food.preferences.map(p => {
      const id = typeof p === 'number' ? p : p.PreferenceID;
      return preferenceNames[id!] || (typeof p === 'object' && p.name ? p.name : `Preference ${id}`);
    }).filter(Boolean);
  };

  const getRestrictionNames = () => {
    if (!food.dietaryRestrictions) return [];
    return food.dietaryRestrictions.map(r => {
      const id = typeof r === 'number' ? r : r.DietaryRestrictionID;
      return restrictionNames[id!] || (typeof r === 'object' && r.name ? r.name : `Restriction ${id}`);
    }).filter(Boolean);
  };

  if (variant === 'simple') {
    const preferenceNamesArray = getPreferenceNames();
    const restrictionNamesArray = getRestrictionNames();

    return (
      <>
      <div
        ref={cardRef}
        className={`group bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl overflow-hidden rounded-lg w-[200px] md:w-[220px] h-[280px] flex-shrink-0 touch-manipulation flex flex-col ${className || ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onCardClick?.(food)}
        >
          {/* Image Section */}
          <div className="relative h-24 md:h-28 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
            {food.svgLink ? (
              <Image 
                src={food.svgLink} 
                alt={food.name} 
                width={60}
                height={60}
                className="object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <Utensils className="w-12 h-12 text-amber-200 transition-transform duration-300 group-hover:scale-105" />
            )}
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-amber-900/20 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Eye className="w-6 h-6 text-amber-100" />
            </div>

          </div>

          {/* Content Section */}
          <div className="p-3 space-y-2 flex-1 flex flex-col">
            {/* Title and Korven badge */}
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-amber-200 transition-colors line-clamp-2 leading-tight">
                {food.name}
              </h3>
              <div className="flex flex-wrap gap-1 items-center">
                {isKorven && (
                  <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Hexagon className="w-3 h-3 fill-amber-400/30" />
                    Korven
                  </span>
                )}
                {/* Dietary Alert Badge */}
                {showAlert && food.dietaryAlert && (
                  <DietaryBadge 
                    isFit={food.dietaryAlert.isFit || !food.dietaryAlert.hasConflict} 
                    compact 
                  />
                )}
              </div>
            </div>

            {/* Calories */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-amber-200">Calories:</span>
              <div className="bg-amber-900/30 border border-amber-700 text-amber-100 font-bold text-xs px-1.5 py-0.5 rounded">
                {food.kCal} kCal
              </div>
            </div>

            {/* Preferences */}
            {preferenceNamesArray.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {preferenceNamesArray.slice(0, 1).map((name, index) => (
                    <div key={index} className="bg-amber-700/30 border border-amber-600 text-amber-200 text-xs px-1.5 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {preferenceNamesArray.length > 1 && (
                    <div className="text-xs bg-amber-700/30 border border-amber-600 text-amber-100 px-1.5 py-0.5 rounded">
                      +{preferenceNamesArray.length - 1}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Restrictions */}
            {restrictionNamesArray.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Dietary Info:</p>
                <div className="flex flex-wrap gap-1">
                  {restrictionNamesArray.slice(0, 2).map((name, index) => (
                    <div key={index} className="bg-green-700/20 border border-green-600 text-green-200 text-xs px-1.5 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {restrictionNamesArray.length > 2 && (
                    <div className="bg-muted border border-green-600 text-green-600 text-xs px-1.5 py-0.5 rounded">
                      +{restrictionNamesArray.length - 2}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Click indicator */}
            <div className="flex items-center justify-between pt-1 border-t border-amber-700/30 mt-auto">
              <span className="text-xs text-amber-200"></span>
              <Eye className="w-3 h-3 text-amber-200 transition-colors" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (variant === 'enhanced') {
    const preferenceNamesList = getPreferenceNames();
    const restrictionNamesList = getRestrictionNames();

    return (
      <Card
        ref={cardRef}
        className={`group bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 cursor-pointer transition-all duration-300 overflow-hidden w-[220px] flex-shrink-0 h-[400px] flex flex-col rounded-lg ${className || ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onCardClick?.(food)}
      >
  <CardContent className="p-0 flex flex-col h-full min-h-0">
          {/* Image Section */}
          <div className="relative h-32 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
            {food.svgLink ? (
              <Image 
                src={food.svgLink} 
                alt={food.name} 
                width={80}
                height={80}
                className="object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <Utensils className="w-16 h-16 text-amber-200 transition-transform duration-300 group-hover:scale-105" />
            )}
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-amber-900/20 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Eye className="w-8 h-8 text-amber-100" />
            </div>

            {/* Preference badge: show only when both preferences AND dietary restrictions match */}
            {showPreferenceBadge && preferenceNamesList.length > 0 && restrictionNamesList.length > 0 && (
              <div className="absolute top-2 right-2">
                <div className="bg-amber-700/30 border border-amber-600 text-amber-100 text-xs px-2 py-0.5 rounded">
                  <Heart className="w-3 h-3 mr-1 inline-block text-amber-100" />
                  <span className="align-middle">Match</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
            {/* Title */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-amber-200 transition-colors line-clamp-2">
                {food.name}
              </h3>
              {isKorven && (
                <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Hexagon className="w-3 h-3 fill-amber-400/30" />
                  Korven
                </span>
              )}
            </div>

            {/* Calories */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-200">Calories:</span>
              <div className="text-sm bg-amber-900/30 border border-amber-700 text-amber-100 font-bold px-2 py-0.5 rounded">
                {food.kCal} kCal
              </div>
            </div>

            {/* Preferences */}
            {preferenceNamesList.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {preferenceNamesList.slice(0, 2).map((name, index) => (
                    <div key={index} className="text-xs bg-amber-700/20 border border-amber-600 text-amber-200 px-2 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {preferenceNamesList.length > 2 && (
                    <div className="text-xs bg-amber-700/30 border border-amber-600 text-amber-100 px-2 py-0.5 rounded">
                      +{preferenceNamesList.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Restrictions */}
            {restrictionNamesList.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Dietary Info:</p>
                <div className="flex flex-wrap gap-1">
                  {restrictionNamesList.slice(0, 2).map((name, index) => (
                    <div key={index} className="text-xs bg-green-700/20 border border-green-600 text-green-200 px-2 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {restrictionNamesList.length > 2 && (
                    <div className="text-xs border border-green-600 text-green-600 px-2 py-0.5 rounded">
                      +{restrictionNamesList.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Click to view more indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
              <span className="text-xs text-amber-200">
                Click for details
              </span>
              <Eye className="w-4 h-4 text-amber-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'editable') {
    const preferenceNamesList = getPreferenceNames();
    const restrictionNamesList = getRestrictionNames();

    return (
      <Card
        ref={cardRef}
        className={`group bg-amber-800/30 border-amber-700/50 hover:bg-amber-700/40 cursor-pointer transition-all duration-300 overflow-hidden w-[220px] flex-shrink-0 h-[400px] flex flex-col rounded-lg ${className || ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onCardClick?.(food)}
      >
  <CardContent className="p-0 flex flex-col h-full relative min-h-0">
          {/* Edit button - only show if user owns this food */}
          {isOwner && onEditClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(food);
              }}
              className="absolute top-2 right-2 z-20 bg-amber-600/20 hover:bg-amber-600/40 p-2 rounded-full transition-all"
              title="Edit Food"
            >
              <SquarePen className="w-4 h-4 text-amber-200" />
            </button>
          )}

          {/* Image Section */}
          <div className="relative h-32 flex items-center justify-center bg-gradient-to-b from-amber-700 to-amber-800 overflow-hidden">
            {food.svgLink ? (
              <Image 
                src={food.svgLink} 
                alt={food.name} 
                width={80}
                height={80}
                className="object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <Utensils className="w-16 h-16 text-amber-200 transition-transform duration-300 group-hover:scale-105" />
            )}
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-amber-900/20 flex items-center justify-center transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Eye className="w-8 h-8 text-amber-100" />
            </div>

            {/* Preference badge: show only when both preferences AND dietary restrictions match */}
            {showPreferenceBadge && preferenceNamesList.length > 0 && restrictionNamesList.length > 0 && (
              <div className="absolute top-2 right-2">
                <div className="bg-amber-700/30 border border-amber-600 text-amber-100 text-xs px-2 py-0.5 rounded">
                  <Heart className="w-3 h-3 mr-1 inline-block text-amber-100" />
                  <span className="align-middle">Match</span>
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
            {/* Title */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-amber-200 transition-colors line-clamp-2">
                {food.name}
              </h3>
              {isKorven && (
                <span className="text-xs bg-amber-600/50 text-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Hexagon className="w-3 h-3 fill-amber-400/30" />
                  Korven
                </span>
              )}
            </div>

            {/* Calories */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-200">Calories:</span>
              <div className="text-sm bg-amber-900/30 border border-amber-700 text-amber-100 font-bold px-2 py-0.5 rounded">
                {food.kCal} kCal
              </div>
            </div>

            {/* Preferences */}
            {preferenceNamesList.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Preferences:</p>
                <div className="flex flex-wrap gap-1">
                  {preferenceNamesList.slice(0, 2).map((name, index) => (
                    <div key={index} className="text-xs bg-amber-700/20 border border-amber-600 text-amber-200 px-2 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {preferenceNamesList.length > 2 && (
                    <div className="text-xs bg-amber-700/30 border border-amber-600 text-amber-100 px-2 py-0.5 rounded">
                      +{preferenceNamesList.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dietary Restrictions */}
            {restrictionNamesList.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-amber-200">Dietary Info:</p>
                <div className="flex flex-wrap gap-1">
                  {restrictionNamesList.slice(0, 2).map((name, index) => (
                    <div key={index} className="text-xs bg-green-700/20 border border-green-600 text-green-200 px-2 py-0.5 rounded">
                      {name}
                    </div>
                  ))}
                  {restrictionNamesList.length > 2 && (
                    <div className="text-xs border border-green-600 text-green-600 px-2 py-0.5 rounded">
                      +{restrictionNamesList.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Click to view more indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
              <span className="text-xs text-amber-200">
                Click for details
              </span>
              <Eye className="w-4 h-4 text-amber-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default FoodCard;