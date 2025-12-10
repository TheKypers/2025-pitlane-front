import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserFoodsPage } from "@/components/food";
import { Suspense } from "react";

function FoodsSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="w-48 h-8 bg-muted rounded animate-pulse mb-2"></div>
        <div className="w-96 h-4 bg-muted/70 rounded animate-pulse"></div>
      </div>
      
      {/* Admin section skeleton */}
      <div className="space-y-8">
        <div className="bg-card border rounded-lg p-6">
          <div className="w-40 h-6 bg-muted rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* User foods section skeleton */}
        <div className="bg-card border rounded-lg p-6">
          <div className="w-32 h-6 bg-muted rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* User preference cards skeleton */}
        <div className="bg-card border rounded-lg p-6">
          <div className="w-48 h-6 bg-muted rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function FoodsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  
  return (
    <Suspense fallback={<FoodsSkeleton />}>
      <UserFoodsPage />
    </Suspense>
  );
}