'use client';

import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { MealModal } from '@/components/modals';
import { EditMealForm } from '@/components/modals';
import { useUser } from '@/lib/contexts/UserContext';
import { useMeals, Meal } from '@/lib/contexts/MealsContext';
import { MealCard } from '@/components/meal';

import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

export function AllMeals() {
    const router = useRouter();
    const { userData } = useUser();
    const {
        meals,
        recommendedMeals,
        loadingMeals,
        loadingRecommended,
        error,
        recommendedError,
        fetchAllMeals,
        fetchRecommendedMeals,
        updateMeal
    } = useMeals();

    const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    const profile = userData?.profile;
    const userPreferences = userData?.preferences;

    useEffect(() => {
        if (profile) {
            fetchAllMeals(profile.id);
            if (userPreferences && userPreferences.hasPreferences) {
                fetchRecommendedMeals(profile.id);
            }
        }
    }, [profile, userPreferences, fetchAllMeals, fetchRecommendedMeals]);

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
    };

    const handleMealUpdated = (updatedMealData: Partial<Meal>) => {
        if (selectedMeal) {
            updateMeal(selectedMeal.MealID, updatedMealData);
        }
    };



    if (loadingMeals) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200 mb-3">Community Meals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-amber-800/30 border border-amber-700/50 rounded-lg p-4">
                            <div className="w-3/4 h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
                            <div className="w-full h-3 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-amber-200">Community Meals</h2>
                <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div >
            {/* Recommended Meals Section */}
            {userPreferences && userPreferences.hasPreferences && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-amber-200 mb-3">Recommended for You</h2>
                        <span className="text-sm text-gray-400">
                            Based on your preferences
                        </span>
                    </div>





                    {loadingRecommended ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-amber-700/30 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : recommendedError ? (
                        <div className="text-center py-8 bg-red-900/20 rounded-lg border border-red-700/50">
                            <div className="text-red-400">
                                <p className="text-sm">{recommendedError}</p>
                            </div>
                        </div>
                    ) : recommendedMeals.length === 0 ? (
                        <div className="text-center py-8 bg-amber-900/20 rounded-lg border border-amber-700/50">
                            <ChefHat className="mx-auto h-8 w-8 text-amber-600 mb-2" />
                            <p className="text-amber-200 text-sm">No recommended meals found</p>
                            <p className="text-gray-400 text-xs mt-1">
                                Try creating meals with your preferred foods!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recommendedMeals.slice(0, 6).map((meal) => (
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
                </div>
            )}

            {/* Community Meals Section */}
            <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-amber-200 mb-3">Community Meals</h2>
                    <span className="text-sm text-gray-400">
                        {meals.length} meal{meals.length !== 1 ? 's' : ''}
                    </span>
                </div>
                                        {/* Search Interface */}
                        <div className="mt-6 p-4 bg-amber-900/20 rounded-lg border border-amber-700/50">
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="flex-1 w-full sm:max-w-md">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search community meals..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    const query = searchQuery.trim();
                                                    if (query) {
                                                        router.push(`/protected/community-meals/search?q=${encodeURIComponent(query)}`);
                                                    } else {
                                                        router.push('/protected/community-meals/search');
                                                    }
                                                }
                                            }}
                                            className="w-full px-4 py-2 pr-10 bg-amber-800/30 border border-amber-700/50 rounded-lg text-amber-100 placeholder-amber-300/70 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                                        />
                                        <svg
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-amber-300/70"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => {
                                        const query = searchQuery.trim();
                                        if (query) {
                                            router.push(`/protected/community-meals/search?q=${encodeURIComponent(query)}`);
                                        } else {
                                            router.push('/protected/community-meals/search');
                                        }
                                    }}
                                    className="bg-amber-700 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg whitespace-nowrap"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Search All Meals
                                    </div>
                                </Button>
                            </div>
                        </div>
                
                <div className="flex items-center justify-between">
                    <h3 className="text-x3 font-semibold text-amber-200 mb-3">Recent Community Meals</h3>
                    <span className="text-sm text-gray-400">
                        {meals.length} meal{meals.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {meals.length === 0 ? (
                    <div className="text-center py-12 bg-amber-900/20 rounded-lg border-2 border-dashed border-amber-700/50">
                        <ChefHat className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                        <h3 className="text-lg font-medium text-amber-200 mb-2">No meals shared by other users</h3>
                        <p className="text-gray-400 mb-4">
                            Check back later to discover meals from the community!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {meals
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .slice(0, 9)
                                .map((meal) => (
                                    <MealCard
                                        key={meal.MealID}
                                        meal={meal}
                                        onClick={handleMealClick}
                                        showExtendedInfo={false}
                                        maxFoodsToShow={3}
                                    />
                                ))
                            }
                        </div>
                    </div>
                )}
            </div>

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