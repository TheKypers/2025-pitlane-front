"use client";
import { FoodModal } from "@/components/modals";
import { FoodFormModal } from "./forms/FoodFormModal";
import { EditFoodForm } from "@/components/admin/EditForm";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/contexts/UserContext";
import { useFoods, Food } from "@/lib/contexts/FoodsContext";
import { API_BASE_URL } from "@/lib/config/api";
import {FoodCarousel } from "./carousels";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserOwnFoodsProps {
  refreshTrigger?: number;
}



export function UserOwnFoods({ refreshTrigger = 0 }: UserOwnFoodsProps) {
  const { userData } = useUser();
  const { foods } = useFoods(); // Get global foods context
  const [userFoods, setUserFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch user's own foods
  const fetchUserFoods = useCallback(async () => {
    if (!userData.profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/foods/user/${userData.profile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const foods = await response.json();
        setUserFoods(foods);
      } else {
        throw new Error('Failed to fetch user foods');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user foods:', err);
    } finally {
      setLoading(false);
    }
  }, [userData.profile?.id]);



  // Modal functions
  const openViewModal = (food: Food) => {
    setSelectedFood(food);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedFood(null);
  };

  const openEditModal = (food: Food) => {
    setSelectedFood(food);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedFood(null);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  // Effects
  useEffect(() => {
    fetchUserFoods();
  }, [fetchUserFoods, refreshTrigger]);

  // Sync local userFoods with global context when foods change
  useEffect(() => {
    if (userData.profile?.id) {
      // Filter global foods to show only user-created foods
      const userCreatedFoods = foods.filter(food => food.profileId === userData.profile?.id);
      setUserFoods(userCreatedFoods);
      
      // If we have global foods loaded, we don't need loading state anymore
      if (foods.length >= 0) { // >= 0 to handle empty array case
        setLoading(false);
      }
    }
  }, [foods, userData.profile?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-64 h-80 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
        Error loading your foods: {error}
      </div>
    );
  }

  return (
    <div>
      <FoodCarousel
        title="Your Foods"
        foods={userFoods}
        onCardClick={openViewModal}
        onEditClick={openEditModal}
        onAddClick={openAddModal}
        showAddButton={true}
        variant="editable"
        isOwner={true}
        emptyStateTitle="No foods created yet"
        emptyStateDescription="Start by creating your first custom food!"
        emptyStateButtonText="Create Your First Food"
      />

      {/* View Modal */}
      <FoodModal
        food={selectedFood}
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
      />

      {/* Edit Modal - Using original EditForm with Korven integration */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-neutral-900/95 border-amber-800/30 backdrop-blur-sm max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-amber-100">
              Edit Food
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 pr-6">
            {selectedFood && (
              <EditFoodForm
                food={selectedFood}
                onSuccess={closeEditModal}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Modal - Using new FoodFormModal */}
      <FoodFormModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        mode="create"
      />
    </div>
  );
}