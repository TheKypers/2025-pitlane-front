'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import AddMealForm from "@/components/meal";
import { MealModal } from '@/components/modals';
import { EditMealForm } from '@/components/modals';
import { MealCard } from '@/components/meal';

interface UserMealsProps {
  onfoodAdded?: () => void;
}

export function UserMeals({ onfoodAdded }: UserMealsProps = {}) {
  const { userData } = useUser();
  const { 
    userMeals, 
    loadingUserMeals, 
    userMealsError, 
    fetchUserMeals, 
    updateMeal,
    addMeal
  } = useMeals();
  
  const [openCreator, setOpenCreator] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const profile = userData?.profile;

  useEffect(() => {
    if (profile?.id) {
      fetchUserMeals(profile.id);
    }
  }, [profile?.id, fetchUserMeals]);

  const handleMealClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsMealModalOpen(true);
  };

  const closeMealModal = () => {
    setIsMealModalOpen(false);
    setSelectedMeal(null);
  };

  const handleEditMeal = (meal: Meal) => {
    closeMealModal();
    setSelectedMeal(meal);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMeal(null);
  };

  const handleEditSuccess = () => {
    closeEditModal();
    onfoodAdded?.();
  };

  const handleMealUpdated = (updatedMealData: Partial<Meal>) => {
    if (selectedMeal) {
      updateMeal(selectedMeal.MealID, updatedMealData);
    }
  };

  if (loadingUserMeals) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-amber-700/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (userMealsError) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
        <div className="text-center py-12 bg-red-900/20 rounded-lg border border-red-700/50">
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Unable to load meals</p>
            <p className="text-sm text-red-300 mt-1">{userMealsError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-amber-200">Your Meals</h2>
        <span className="text-sm text-gray-400">
          {userMeals.length} meal{userMeals.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Botón SOLO abre el modal, no renderiza el formulario inline */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setOpenCreator(true)}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
        >
          + New meal
        </button>
      </div>

      {/* Modal para crear meal */}
      {openCreator && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 z-[80]"
            onClick={() => setOpenCreator(false)}
          />
          {/* Contenido */}
          <div
            className="relative z-[81] w-full max-w-2xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
              <h3 className="text-amber-100 font-semibold">New Meal</h3>
              <button
                onClick={() => setOpenCreator(false)}
                className="px-2 py-1 text-amber-200 hover:text-amber-50"
                aria-label="Cerrar modal"
              >
                ✖
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <AddMealForm
                onFoodAdded={(newMeal) => {
                  // Add the new meal to context instead of refetching
                  if (profile?.id && newMeal) {
                    // The API returns a complete meal object, so we can cast it safely
                    addMeal(newMeal as Meal);
                  }
                  setOpenCreator(false);
                  onfoodAdded?.();
                }}
                onClose={() => setOpenCreator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {userMeals.length === 0 ? (
        <div className="text-center py-12 bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-700/50">
          <ChefHat className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h3 className="text-lg font-medium text-amber-200 mb-2">No meals created yet</h3>
          <p className="text-gray-400 mb-4">
            Start creating delicious meals with your favorite foods!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMeals.map((meal) => (
            <MealCard
              key={meal.MealID}
              meal={meal}
              onClick={handleMealClick}
              showExtendedInfo={true}
              maxFoodsToShow={3}
            />
          ))}
        </div>
      )}

      {/* Meal Details Modal */}
      <MealModal 
        meal={selectedMeal}
        isOpen={isMealModalOpen}
        onClose={closeMealModal}
        onEdit={handleEditMeal}
      />

      {/* Edit Meal Modal */}
      {isEditModalOpen && selectedMeal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm z-[85]"
            onClick={closeEditModal}
          />
          {/* Content */}
          <div
            className="relative z-[86] w-full max-w-2xl bg-neutral-900 border border-amber-800/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-800/40">
              <h3 className="text-amber-100 font-semibold">Edit Meal</h3>
              <button
                onClick={closeEditModal}
                className="px-2 py-1 text-amber-200 hover:text-amber-50"
                aria-label="Close modal"
              >
                ✖
              </button>
            </div>

            {/* Body */}
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <EditMealForm
                meal={selectedMeal}
                onSuccess={handleEditSuccess}
                onMealUpdated={handleMealUpdated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}