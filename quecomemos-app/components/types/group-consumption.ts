// Types for group meal consumption data
export interface MostConsumedMeal {
  mealId: number;
  name: string;
  description?: string;
  count: number;
  totalKcal: number;
  averageKcal: number;
  foods: Array<{
    name: string;
    kcal: number;
    quantity: number;
  }>;
  consumedBy: string[];
  uniqueConsumers: number;
}

export interface GroupMostConsumedResponse {
  groupId: number;
  groupName: string;
  memberCount: number;
  mostConsumedMeals: MostConsumedMeal[];
  totalConsumptions: number;
}

export interface GroupConsumptionStats {
  totalConsumptions: number;
  totalKcal: number;
  averageKcal: number;
}