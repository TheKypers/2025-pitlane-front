"use client";
import { FoodModal } from "@/components/modals";
import { useState } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { FoodCarousel } from "./carousels";

interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  [key: string]: unknown;
}

interface UserFoodsProps {
  foods: Food[];
  mockUserData?: {
    profile: { role: string };
    preferences: {
      preferences: number[];
      dietaryRestrictions: number[];
      hasPreferences: boolean;
    };
  };
}

export function UserFoods({ foods, mockUserData }: UserFoodsProps) {
  const { userData } = useUser();

  // Use mock data if provided (for admin preview), otherwise use real user data
  const userPreferences = mockUserData?.preferences || userData.preferences;
  const userProfile = mockUserData?.profile || userData.profile;

  // Estados para el modal
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para abrir el modal
  const openModal = (food: Food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  // Filter foods based on user preferences and dietary restrictions
  const filterFoods = () => {
    // Admin users see all foods without any filtering
    if (userProfile?.role === "admin") {
      return { preferredFoods: [], otherFoods: foods };
    }

    // If user has no preferences set, show all foods
    if (!userPreferences || !userPreferences.hasPreferences) {
      return { preferredFoods: [], otherFoods: foods };
    }

    // If user has no dietary restrictions, they can see all foods (no restriction filtering)
    const userRestrictionsIds = userPreferences.dietaryRestrictions || [];
    if (userRestrictionsIds.length === 0) {
      // No restrictions = can eat anything, just organize by preferences
      const userPrefIds = userPreferences.preferences || [];
      const preferredFoods: Food[] = [];
      const otherFoods: Food[] = [];

      foods.forEach(food => {
        const foodPrefIds = food.preferences?.map(p => typeof p === 'number' ? p : p.PreferenceID ?? -1) || [];
        const hasMatchingPreference = foodPrefIds.some(prefId => userPrefIds.includes(prefId));

        if (hasMatchingPreference) {
          preferredFoods.push(food);
        } else {
          otherFoods.push(food);
        }
      });

      return { preferredFoods, otherFoods };
    }

    // User has dietary restrictions - can only eat foods that match their restrictions OR "For Everyone" foods
    const userPrefIds = userPreferences.preferences || [];
    const preferredFoods: Food[] = [];
    const otherFoods: Food[] = [];

    foods.forEach(food => {
      const foodPrefIds = food.preferences?.map(p => typeof p === 'number' ? p : p.PreferenceID ?? -1) || [];
      const foodRestrictionsIds = food.dietaryRestrictions?.map(r => typeof r === 'number' ? r : r.DietaryRestrictionID ?? -1) || [];

      // Check if food matches user preferences
      const hasMatchingPreference = foodPrefIds.some(prefId => userPrefIds.includes(prefId));

      // Check if food is compatible with user's dietary restrictions:
      // 1. Food has "For Everyone" restriction (id = 0)
      // 2. Food has at least one restriction that matches user's restrictions
      const isForEveryone = foodRestrictionsIds.includes(0);
      const hasMatchingRestriction = foodRestrictionsIds.some(restrictionId =>
        userRestrictionsIds.includes(restrictionId)
      );
      const isCompatible = isForEveryone || hasMatchingRestriction;

      // Only show foods that are compatible with user's dietary restrictions
      if (isCompatible) {
        if (hasMatchingPreference) {
          preferredFoods.push(food);
        } else {
          otherFoods.push(food);
        }
      }
      // Foods that don't match user's dietary restrictions are filtered out
    });

    return { preferredFoods, otherFoods };
  };

  const { preferredFoods, otherFoods } = filterFoods();

  return (
    <div className="w-full">

      <FoodCarousel
        title="Recommended Foods"
        foods={preferredFoods}
        onCardClick={openModal}
        variant="simple"
        showPreferenceBadge={true}
      />

      <FoodCarousel
        title="Other Foods"
        foods={otherFoods}
        onCardClick={openModal}
        variant="simple"
        showPreferenceBadge={true}
      />


      {/* Modal */}
      <FoodModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}