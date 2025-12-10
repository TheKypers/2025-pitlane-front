'use client';
import Image from "next/image";
import { Utensils } from "lucide-react";
import { FoodItem } from "../types";

interface FoodIconProps {
  food: Pick<FoodItem, 'name' | 'svgLink'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizes = {
  sm: { container: 'w-6 h-6', icon: 'w-4 h-4', image: 16 },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', image: 24 },
  lg: { container: 'w-16 h-16', icon: 'w-8 h-8', image: 32 }
};

export function FoodIcon({ food, size = 'md', className = "" }: FoodIconProps) {
  const sizeConfig = iconSizes[size];
  
  return (
    <div className={`${sizeConfig.container} flex items-center justify-center bg-amber-800/30 rounded-full border border-amber-700/50 flex-shrink-0 ${className}`}>
      {food.svgLink ? (
        <Image 
          src={food.svgLink} 
          alt={food.name} 
          width={sizeConfig.image}
          height={sizeConfig.image}
          className={`${sizeConfig.icon} object-contain`} 
        />
      ) : (
        <Utensils className={`${sizeConfig.icon} text-amber-400`} />
      )}
    </div>
  );
}

interface KcalDisplayProps {
  kcal: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function KcalDisplay({ kcal, size = 'md', showLabel = true, className = "" }: KcalDisplayProps) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base'
  };
  
  return (
    <span className={`${textSizes[size]} text-amber-300 ${className}`}>
      <span className="font-semibold">{kcal}</span>
      {showLabel && ' kCal'}
    </span>
  );
}

interface FoodQuantityDisplayProps {
  quantity: number;
  kcalPerUnit: number;
  totalKcal: number;
  className?: string;
}

export function FoodQuantityDisplay({ quantity, kcalPerUnit, totalKcal, className = "" }: FoodQuantityDisplayProps) {
  return (
    <div className={`text-sm text-gray-400 ${className}`}>
      <span>Quantity: {quantity} units</span>
      <span className="mx-2">•</span>
      <span>{Math.round(kcalPerUnit)} kCal per unit</span>
      <span className="mx-2">•</span>
      <span className="text-amber-300 font-medium">{totalKcal} kCal total</span>
    </div>
  );
}