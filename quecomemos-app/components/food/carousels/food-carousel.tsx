"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Utensils, Plus } from 'lucide-react';
import { FoodCard } from '../food-cards';

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  profileId?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface FoodCarouselProps {
  title: string;
  foods: Food[];
  onCardClick: (food: Food) => void;
  onEditClick?: (food: Food) => void;
  onAddClick?: () => void;
  showAddButton?: boolean;
  showHeader?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateButtonText?: string;
  variant?: 'simple' | 'enhanced' | 'editable';
  isOwner?: boolean;
  showPreferenceBadge?: boolean;
  preferenceNames?: { [key: number]: string };
  restrictionNames?: { [key: number]: string };
}

export function FoodCarousel({
  title,
  foods,
  onCardClick,
  onEditClick,
  onAddClick,
  showAddButton = false,
  showHeader = true,
  emptyStateTitle = "No foods found",
  emptyStateDescription = "Start by adding your first food!",
  emptyStateButtonText = "Add Food",
  variant = 'simple',
  isOwner = false,
  showPreferenceBadge = false,
  preferenceNames = {},
  restrictionNames = {}
}: FoodCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll capabilities
  const checkScrollCapabilities = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 150 : 200;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Effects
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScrollCapabilities();
      container.addEventListener('scroll', checkScrollCapabilities);
      
      // Check on resize
      const resizeObserver = new ResizeObserver(checkScrollCapabilities);
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkScrollCapabilities);
        resizeObserver.disconnect();
      };
    }
  }, [foods]);

  // Don't render if no foods and we don't want to show empty state
  if (foods.length === 0 && !showAddButton) {
    return null;
  }

  return (
    <div className="w-full mb-12">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl mb-2">{title}</h2>
            {variant === 'editable' && (
              <p className="text-gray-400">
                {foods.length} food{foods.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Food
            </button>
          )}
        </div>
      )}
      
      {/* Foods carousel */}
      {foods.length > 0 ? (
        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </button>
          )}

          {/* Carousel container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-scroll scrollbar-hide scroll-smooth px-4 md:px-6 py-2 pb-8 touch-pan-x overscroll-x-contain"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x proximity'
            }}
          >
            {foods.map((food) => (
              <div key={food.FoodID} style={{ scrollSnapAlign: 'start' }}>
                <FoodCard 
                  food={food} 
                  variant={variant}
                  onCardClick={onCardClick}
                  onEditClick={onEditClick}
                  isOwner={isOwner}
                  showPreferenceBadge={showPreferenceBadge}
                  preferenceNames={preferenceNames}
                  restrictionNames={restrictionNames}
                />
              </div>
            ))}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 rounded-full p-1.5 md:p-2 shadow-md transition-all duration-200 hover:shadow-lg touch-manipulation"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-lg font-medium mb-2">{emptyStateTitle}</h3>
          <p className="text-sm mb-4">{emptyStateDescription}</p>
          {onAddClick && (
            <button
              onClick={onAddClick}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {emptyStateButtonText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}