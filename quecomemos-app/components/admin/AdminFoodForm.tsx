"use client";

interface AdminFoodFormProps {
  onAddClick: () => void;
}

export function AdminFoodForm({ onAddClick }: AdminFoodFormProps) {
  return (
    <div className="w-full flex gap-4 justify-end mb-4">
      <button
        onClick={onAddClick}
        className="bg-amber-700 text-white px-4 py-2 rounded font-semibold hover:bg-amber-600 transition shadow-lg border border-amber-800/30"
      >
        Add Food
      </button>
    </div>
  );
}
