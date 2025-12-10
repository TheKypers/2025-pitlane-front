'use client';
import { Button } from "@/components/ui/button";
import { Trash, Hexagon } from "lucide-react";
import { FoodItem } from "./types";
import { FoodIcon, KcalDisplay, FoodQuantityDisplay } from "./common/FoodDisplayComponents";
import { COMMON_STYLES } from "./constants";
import { useKorvenCheck } from "./hooks/useKorvenCheck";

type Props = {
  foods: FoodItem[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
};

export default function FoodsList({ foods, onEdit, onRemove }: Props) {
  const { isKorvenInspiredFood } = useKorvenCheck();

  if (foods.length === 0) {
    return (
      <div className={`${COMMON_STYLES.TEXT_AMBER_MUTED}/90 text-sm bg-neutral-800/60 border border-amber-800/40 rounded-lg p-3`}>
        You haven&apos;t added any food yet. Use the <b>Add Food</b> button.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {foods.map((food, i) => (
        <div
          key={`${food.name}-${i}`}
          className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 flex items-center gap-4"
        >
          <FoodIcon food={food} />
          
          <div className="flex-grow">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h5 className={`font-semibold ${COMMON_STYLES.TEXT_AMBER_SECONDARY}`}>
                  {food.name}
                </h5>
                {isKorvenInspiredFood(food.name) && (
                  <span className="text-xs bg-amber-600/50 text-amber-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                    <Hexagon className="w-2.5 h-2.5 fill-amber-400/30" />
                    Korven
                  </span>
                )}
              </div>
              <KcalDisplay kcal={food.kCal} />
            </div>
            <FoodQuantityDisplay 
              quantity={food.quantity}
              kcalPerUnit={food.kcalPerUnit || (food.kCal / food.quantity)}
              totalKcal={food.kCal}
            />
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              onClick={() => onEdit(i)}
              className="bg-amber-700 hover:bg-amber-600 text-white text-sm px-3 py-1"
            >
              Edit
            </Button>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition-colors"
              title="Remove"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}