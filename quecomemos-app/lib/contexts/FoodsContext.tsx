"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/config/api';

// Tipo para una comida
export interface Food {
  FoodID: number;
  name: string;
  kCal: number;
  svgLink?: string;
  profileId?: string;
  preferences?: { name?: string; PreferenceID?: number }[] | number[];
  dietaryRestrictions?: { name?: string; DietaryRestrictionID?: number }[] | number[];
  // Para otros campos que puedan existir
  [key: string]: unknown;
}

// Tipo para el contexto
interface FoodsContextType {
  foods: Food[];
  setFoods: (foods: Food[]) => void;
  addFood: (food: Food) => void;
  updateFood: (foodId: number, updatedFood: Partial<Food>) => void;
  removeFood: (foodId: number) => void;
  getFoodById: (foodId: number) => Food | undefined;
  fetchFoodsForUser: (userRestrictions: number[]) => Promise<Food[]>;
}

// Crear el contexto
const FoodsContext = createContext<FoodsContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useFoods = () => {
  const context = useContext(FoodsContext);
  if (context === undefined) {
    throw new Error('useFoods debe ser usado dentro de un FoodsProvider');
  }
  return context;
};

// Props para el provider
interface FoodsProviderProps {
  children: ReactNode;
  initialFoods?: Food[];
}

// Provider del contexto
export const FoodsProvider: React.FC<FoodsProviderProps> = ({ children, initialFoods = [] }) => {
  const [foods, setFoodsState] = useState<Food[]>(initialFoods);

  // Función para establecer todas las comidas
  const setFoods = useCallback((newFoods: Food[]) => {
    setFoodsState(newFoods);
  }, []);

  // Función para agregar una comida
  const addFood = useCallback((food: Food) => {
    setFoodsState(prevFoods => [...prevFoods, food]);
  }, []);

  // Función para actualizar una comida específica
  const updateFood = useCallback((foodId: number, updatedFood: Partial<Food>) => {
    setFoodsState(prevFoods => 
      prevFoods.map(food => 
        food.FoodID === foodId 
          ? { ...food, ...updatedFood }
          : food
      )
    );
  }, []);

  // Función para eliminar una comida
  const removeFood = useCallback((foodId: number) => {
    setFoodsState(prevFoods => 
      prevFoods.filter(food => food.FoodID !== foodId)
    );
  }, []);

  // Función para obtener una comida por ID
  const getFoodById = useCallback((foodId: number) => {
    return foods.find(food => food.FoodID === foodId);
  }, [foods]);

  // Función para obtener comidas filtradas por restricciones del usuario
  const fetchFoodsForUser = useCallback(async (userRestrictions: number[]): Promise<Food[]> => {
    try {
      const restrictionsParam = userRestrictions.length > 0 ? `?restrictions=${userRestrictions.join(',')}` : '';
      const response = await fetch(`${API_BASE_URL}/foods/for-user${restrictionsParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const fetchedFoods = await response.json();
        setFoods(fetchedFoods); // Update the context with filtered foods
        return fetchedFoods;
      }
      throw new Error(`Failed to fetch foods: ${response.status}`);
    } catch (error) {
      console.error('Error fetching foods for user:', error);
      throw error;
    }
  }, [setFoods]);

  const value: FoodsContextType = {
    foods,
    setFoods,
    addFood,
    updateFood,
    removeFood,
    getFoodById,
    fetchFoodsForUser,
  };

  return (
    <FoodsContext.Provider value={value}>
      {children}
    </FoodsContext.Provider>
  );
};