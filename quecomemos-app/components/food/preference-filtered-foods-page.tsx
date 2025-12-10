'use client';

import { useUser } from '@/lib/contexts/UserContext';
import { useFoods } from '@/lib/contexts/FoodsContext';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/config/api';
import { createClient } from '@/lib/supabase/client';
import { FoodCard } from './food-cards';
import { FoodModal } from '@/components/modals';
import { ArrowLeft, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface Food {
    FoodID: number;
    name: string;
    kCal: number;
    svgLink?: string;
    dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
    preferences?: { name?: string; PreferenceID?: number }[] | number[];
    [key: string]: unknown;
}

interface PreferenceWithName {
    PreferenceID: number;
    name: string;
}

interface DietaryRestrictionWithName {
    DietaryRestrictionID: number;
    name: string;
}

interface PreferenceFilteredFoodsPageProps {
    preferenceId: string;
}

export function PreferenceFilteredFoodsPage({ preferenceId }: PreferenceFilteredFoodsPageProps) {
    const { userData, loading: userLoading } = useUser();
    const { foods, setFoods } = useFoods();
    const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
    const [preferenceDetails, setPreferenceDetails] = useState<PreferenceWithName | null>(null);
    const [preferenceNames, setPreferenceNames] = useState<{ [key: number]: string }>({});
    const [restrictionNames, setRestrictionNames] = useState<{ [key: number]: string }>({});
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingFoods, setLoadingFoods] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    const userPreferences = userData.preferences;
    const prefId = parseInt(preferenceId);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;

                // Fetch foods filtered by user's dietary restrictions if not already loaded
                if (foods.length === 0) {
                    const userRestrictions = userPreferences?.dietaryRestrictions || [];
                    const restrictionsParam = userRestrictions.length > 0 ? `?restrictions=${userRestrictions.join(',')}` : '';
                    
                    const foodsResponse = await fetch(`${API_BASE_URL}/foods/for-user${restrictionsParam}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    if (foodsResponse.ok) {
                        const foodsData = await foodsResponse.json();
                        setFoods(foodsData);
                    }
                }

                // Fetch preference names
                const preferencesResponse = await fetch(`${API_BASE_URL}/preferences`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (preferencesResponse.ok) {
                    const preferencesData: PreferenceWithName[] = await preferencesResponse.json();
                    const prefNamesMap = preferencesData.reduce((acc, pref) => {
                        acc[pref.PreferenceID] = pref.name;
                        return acc;
                    }, {} as { [key: number]: string });
                    setPreferenceNames(prefNamesMap);

                    // Find the specific preference details
                    const currentPreference = preferencesData.find(p => p.PreferenceID === prefId);
                    setPreferenceDetails(currentPreference || null);
                }

                // Fetch dietary restriction names
                const restrictionsResponse = await fetch(`${API_BASE_URL}/dietary-restrictions`, {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (restrictionsResponse.ok) {
                    const restrictionsData: DietaryRestrictionWithName[] = await restrictionsResponse.json();
                    const restNamesMap = restrictionsData.reduce((acc, rest) => {
                        acc[rest.DietaryRestrictionID] = rest.name;
                        return acc;
                    }, {} as { [key: number]: string });
                    setRestrictionNames(restNamesMap);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoadingFoods(false);
            }
        };

        if (!userLoading) {
            fetchData();
        }
    }, [userLoading, supabase, prefId, foods.length, setFoods, userPreferences?.dietaryRestrictions]);

    // Filter foods based on preference (dietary restrictions already handled by backend)
    useEffect(() => {
        if (foods.length === 0) return;

        const filtered = foods.filter(food => {
            // Check if food has the selected preference
            const foodPrefIds = food.preferences?.map(p =>
                typeof p === 'number' ? p : p.PreferenceID ?? -1
            ) || [];

            return foodPrefIds.includes(prefId);
        });

        setFilteredFoods(filtered);
    }, [foods, prefId]);

    const openModal = (food: Food) => {
        setSelectedFood(food);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFood(null);
    };

    const handleBackToFoods = () => {
        router.push(`/protected/foods`);
    };

    if (userLoading || loadingFoods) {
        return (
            <div className="flex-1 w-full flex flex-col gap-12">
                <div className="mb-4">
                    <div className="w-64 h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-48 h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-80 bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full flex flex-col gap-8">
            {/* Back Button */}
            <div className="mb-4">
                <Button
                    variant="ghost"
                    onClick={handleBackToFoods}
                    className="text-amber-200 hover:text-amber-100 hover:bg-amber-800/30"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Foods
                </Button>
            </div>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Filter className="w-6 h-6 text-amber-400" />
                    <h1 className="font-bold text-2xl text-amber-200">
                        {preferenceDetails ? preferenceDetails.name : `Preference ${prefId}`} Foods
                    </h1>
                </div>
                <p className="text-sm text-gray-400">
                    Foods that match your &ldquo;{preferenceDetails?.name || 'selected'}&rdquo; preference
                    {userPreferences?.dietaryRestrictions.length ? ' and dietary restrictions' : ''}
                </p>
            </div>

            {/* Foods Grid */}
            {filteredFoods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredFoods.map((food) => (
                        <FoodCard
                            key={food.FoodID}
                            food={food}
                            variant="enhanced"
                            onCardClick={openModal}
                            showPreferenceBadge={true}
                            preferenceNames={preferenceNames}
                            restrictionNames={restrictionNames}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Filter className="w-16 h-16 text-gray-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">No matching foods found</h3>
                    <p className="text-gray-400 max-w-md">
                        No foods match your &ldquo;{preferenceDetails?.name || 'selected'}&rdquo; preference
                        {userPreferences?.dietaryRestrictions.length ? ' and dietary restrictions' : ''}.
                    </p>
                    <Button
                        onClick={handleBackToFoods}
                        className="mt-4 bg-amber-700 hover:bg-amber-600"
                    >
                        Browse All Foods
                    </Button>
                </div>
            )}

            {/* Food Modal */}
            <FoodModal
                food={selectedFood}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    );
}