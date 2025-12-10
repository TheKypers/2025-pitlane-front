'use client';
import { Card, CardContent } from "@/components/ui/card";
import { DropdownWrapper } from "@/components/forms";
import { CustomCheckbox } from "@/components/forms";
import { Label } from "@/components/ui/label";

type Props = {
  inputClass: string;
  description: string;
  setDescription: (v: string) => void;
  mealPreferences: number[];
  setMealPreferences: (v: number[]) => void;
  mealHasRestrictions: boolean;
  setMealHasRestrictions: (v: boolean) => void;
  mealRestrictions: number[];
  setMealRestrictions: (v: number[]) => void;
  MealIconSlot: React.ReactNode;
};

export default function MealExtras(props: Props) {
  const {
    inputClass, description, setDescription,
    mealPreferences, setMealPreferences,
    mealHasRestrictions, setMealHasRestrictions,
    mealRestrictions, setMealRestrictions,
    MealIconSlot
  } = props;

  return (
    <Card className="bg-neutral-800 border-amber-800/50">
      <CardContent className="space-y-4 pt-4">
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />

        <DropdownWrapper label="Preferences (meal)">
          <CustomCheckbox
            initialOptions={mealPreferences}
            endpoint="preferences"
            onSelectionChange={setMealPreferences}
          />
        </DropdownWrapper>

        <div>
          <Label className="text-amber-200 mb-3 block">Dietary Restrictions (meal)</Label>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setMealHasRestrictions(false)}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                mealHasRestrictions === false
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
              }`}
            >
              No restrictions
            </button>
            <button
              type="button"
              onClick={() => setMealHasRestrictions(true)}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                mealHasRestrictions === true
                  ? 'bg-amber-700 border-amber-600 text-white'
                  : 'bg-neutral-700 border-amber-800/30 text-amber-200 hover:border-amber-700/50'
              }`}
            >
              Has restrictions
            </button>
          </div>

          {mealHasRestrictions && (
            <DropdownWrapper label="Select Dietary Restrictions (meal)">
              <CustomCheckbox
                initialOptions={mealRestrictions}
                endpoint="dietary-restrictions/excluding-for-everyone"
                onSelectionChange={setMealRestrictions}
              />
            </DropdownWrapper>
          )}
        </div>

        {MealIconSlot}
      </CardContent>
    </Card>
  );
}