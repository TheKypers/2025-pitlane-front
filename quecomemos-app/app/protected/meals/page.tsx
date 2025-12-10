import { UserMeals } from '@/components/profile';
import { Suspense } from "react";

function MealsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
          <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
        </div>
        
        {/* Meals grid skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-card border rounded-lg p-6">
              <div className="space-y-4">
                <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-muted/70 rounded animate-pulse"></div>
                  <div className="w-3/4 h-4 bg-muted/70 rounded animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="w-20 h-4 bg-muted/70 rounded animate-pulse"></div>
                  <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyMealsPage() {
    return (
        <Suspense fallback={<MealsSkeleton />}>
            <div className="container mx-auto px-4 py-8">
                <UserMeals />
            </div>
        </Suspense>
    );
}