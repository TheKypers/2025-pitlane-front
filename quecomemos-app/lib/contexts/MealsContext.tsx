"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/config/api';

// Tipo para una comida
export interface Meal {
  MealID: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  profileId: string;
  profile: {
    username?: string;
    id: string;
    role: string;
  };
  mealFoods: {
    food: {
      FoodID: number;
      name: string;
      svgLink?: string;
      kCal: number;
      dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
      preferences?: { name?: string; PreferenceID?: number }[] | number[];
    };
    quantity: number;
  }[];
}

// Tipo para el contexto
interface MealsContextType {
  meals: Meal[];
  allMeals: Meal[];
  userMeals: Meal[];
  recommendedMeals: Meal[];
  loadingMeals: boolean;
  loadingUserMeals: boolean;
  loadingRecommended: boolean;
  error: string | null;
  userMealsError: string | null;
  recommendedError: string | null;
  setMeals: (meals: Meal[]) => void;
  setAllMeals: (meals: Meal[]) => void;
  setUserMeals: (meals: Meal[]) => void;
  setRecommendedMeals: (meals: Meal[]) => void;
  addMeal: (meal: Meal) => void;
  updateMeal: (mealId: number, updatedMeal: Partial<Meal>) => void;
  removeMeal: (mealId: number) => void;
  getMealById: (mealId: number) => Meal | undefined;
  handleFoodDeletion: (foodId: number) => void;
  fetchAllMeals: (profileId?: string) => Promise<void>;
  fetchUserMeals: (profileId: string) => Promise<void>;
  fetchRecommendedMeals: (profileId: string) => Promise<void>;
  refetchMeals: (profileId?: string) => Promise<void>;
  refetchUserMeals: (profileId: string) => Promise<void>;
}

// Crear el contexto
const MealsContext = createContext<MealsContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useMeals = () => {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals debe ser usado dentro de un MealsProvider');
  }
  return context;
};

// Props para el provider
interface MealsProviderProps {
  children: ReactNode;
  initialMeals?: Meal[];
}

// Provider del contexto
export const MealsProvider: React.FC<MealsProviderProps> = ({ children, initialMeals = [] }) => {
  const [meals, setMealsState] = useState<Meal[]>(initialMeals);
  const [allMeals, setAllMealsState] = useState<Meal[]>([]);
  const [userMeals, setUserMealsState] = useState<Meal[]>([]);
  const [recommendedMeals, setRecommendedMealsState] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [loadingUserMeals, setLoadingUserMeals] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMealsError, setUserMealsError] = useState<string | null>(null);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);

  // Función para establecer todas las comidas de la comunidad
  const setMeals = useCallback((newMeals: Meal[]) => {
    setMealsState(newMeals);
  }, []);

  // Función para establecer todas las comidas (incluyendo del usuario)
  const setAllMeals = useCallback((newMeals: Meal[]) => {
    setAllMealsState(newMeals);
  }, []);

  // Función para establecer comidas recomendadas
  const setRecommendedMeals = useCallback((newMeals: Meal[]) => {
    setRecommendedMealsState(newMeals);
  }, []);

  // Función para establecer comidas del usuario
  const setUserMeals = useCallback((newMeals: Meal[]) => {
    setUserMealsState(newMeals);
  }, []);

  // Función para agregar una comida
  const addMeal = useCallback((meal: Meal) => {
    setMealsState(prevMeals => [...prevMeals, meal]);
    setAllMealsState(prevMeals => [...prevMeals, meal]);
    setUserMealsState(prevMeals => [...prevMeals, meal]);
  }, []);

  // Función para actualizar una comida específica
  const updateMeal = useCallback((mealId: number, updatedMeal: Partial<Meal>) => {
    const updateFunction = (prevMeals: Meal[]) => 
      prevMeals.map(meal => 
        meal.MealID === mealId 
          ? { ...meal, ...updatedMeal }
          : meal
      );
    
    setMealsState(updateFunction);
    setAllMealsState(updateFunction);
    setUserMealsState(updateFunction);
    setRecommendedMealsState(updateFunction);
  }, []);

  // Función para eliminar una comida
  const removeMeal = useCallback((mealId: number) => {
    const filterFunction = (prevMeals: Meal[]) => 
      prevMeals.filter(meal => meal.MealID !== mealId);
    
    setMealsState(filterFunction);
    setAllMealsState(filterFunction);
    setUserMealsState(filterFunction);
    setRecommendedMealsState(filterFunction);
  }, []);

  // Función para obtener una comida por ID
  const getMealById = useCallback((mealId: number) => {
    return allMeals.find(meal => meal.MealID === mealId);
  }, [allMeals]);

  // Función para manejar eliminación de alimentos de las comidas
  const handleFoodDeletion = useCallback((foodId: number) => {
    const updateMealsAfterFoodDeletion = (prevMeals: Meal[]) => 
      prevMeals.map(meal => ({
        ...meal,
        mealFoods: meal.mealFoods.filter(mealFood => mealFood.food.FoodID !== foodId)
      })).filter(meal => meal.mealFoods.length > 0); // Remove meals that have no foods left
    
    setMealsState(updateMealsAfterFoodDeletion);
    setAllMealsState(updateMealsAfterFoodDeletion);
    setUserMealsState(updateMealsAfterFoodDeletion);
    setRecommendedMealsState(updateMealsAfterFoodDeletion);
  }, []);

  // Función para obtener todas las comidas
  const fetchAllMeals = useCallback(async (profileId?: string) => {
    try {
      setLoadingMeals(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/meals/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const mealsData = await response.json();
        // Store all meals
        setAllMeals(mealsData);
        // Filter out current user's meals for community display
        const communityMeals = profileId ? 
          mealsData.filter((meal: Meal) => meal.profileId !== profileId) : 
          mealsData;
        setMeals(communityMeals);
      } else if (response.status === 404) {
        setAllMeals([]);
        setMeals([]);
      } else {
        throw new Error(`Error fetching meals: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching all meals:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoadingMeals(false);
    }
  }, [setMeals, setAllMeals]);

  // Función para obtener comidas recomendadas
  const fetchRecommendedMeals = useCallback(async (profileId: string) => {
    try {
      setLoadingRecommended(true);
      setRecommendedError(null);

      const response = await fetch(`${API_BASE_URL}/meals/recommended/${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const mealsData = await response.json();
        setRecommendedMeals(Array.isArray(mealsData) ? mealsData : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error (${response.status})`;
        setRecommendedError(`Failed to load recommended meals: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error fetching recommended meals:', error);
      setRecommendedError('Failed to load recommended meals');
      setRecommendedMeals([]);
    } finally {
      setLoadingRecommended(false);
    }
  }, [setRecommendedMeals]);

  // Función para obtener comidas del usuario
  const fetchUserMeals = useCallback(async (profileId: string) => {
    try {
      setLoadingUserMeals(true);
      setUserMealsError(null);

      const response = await fetch(`${API_BASE_URL}/meals/user?profileId=${profileId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const mealsData = await response.json();
        setUserMeals(Array.isArray(mealsData) ? mealsData : []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Server error (${response.status})`;
        setUserMealsError(`Failed to load meals: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error fetching user meals:', error);
      setUserMealsError('Failed to load meals');
      setUserMeals([]);
    } finally {
      setLoadingUserMeals(false);
    }
  }, [setUserMeals]);

  // Función para refrescar todas las comidas
  const refetchMeals = useCallback(async (profileId?: string) => {
    await fetchAllMeals(profileId);
    if (profileId) {
      await fetchRecommendedMeals(profileId);
    }
  }, [fetchAllMeals, fetchRecommendedMeals]);

  // Función para refrescar comidas del usuario
  const refetchUserMeals = useCallback(async (profileId: string) => {
    await fetchUserMeals(profileId);
  }, [fetchUserMeals]);

  const value: MealsContextType = {
    meals,
    allMeals,
    userMeals,
    recommendedMeals,
    loadingMeals,
    loadingUserMeals,
    loadingRecommended,
    error,
    userMealsError,
    recommendedError,
    setMeals,
    setAllMeals,
    setUserMeals,
    setRecommendedMeals,
    addMeal,
    updateMeal,
    removeMeal,
    getMealById,
    handleFoodDeletion,
    fetchAllMeals,
    fetchUserMeals,
    fetchRecommendedMeals,
    refetchMeals,
    refetchUserMeals,
  };

  return (
    <MealsContext.Provider value={value}>
      {children}
    </MealsContext.Provider>
  );
};