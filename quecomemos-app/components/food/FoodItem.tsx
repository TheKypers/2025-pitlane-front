"use client";
import React from 'react';
import { Food } from '@/lib/contexts/FoodsContext';
import Image from 'next/image';

interface FoodItemProps {
  food: Food;
  onEditClick: (food: Food) => void;
}

// Componente memoizado para evitar re-renders innecesarios
export const FoodItem = React.memo<FoodItemProps>(({ food, onEditClick }) => {
  return (
    <div className="bg-neutral-700 p-4 rounded-lg shadow-lg relative flex flex-col items-center border border-amber-800/30 hover:border-amber-700/50 transition-all">
      {/* Imagen */}
      {food.svgLink && (
        <Image
          src={food.svgLink}
          alt={food.name}
          width={96}
          height={96}
          className="w-full h-24 object-contain mb-2"
        />
      )}

      <span className="text-amber-100 font-semibold text-center">
        {food.name}
      </span>

      {/* Edit icon */}
      <button
        className="absolute top-2 right-2 text-amber-300 hover:text-amber-100 bg-amber-800/20 hover:bg-amber-700/30 p-1.5 rounded-full transition-all"
        onClick={() => onEditClick(food)}
        aria-label="Edit food"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="m18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  );
});

FoodItem.displayName = 'FoodItem';