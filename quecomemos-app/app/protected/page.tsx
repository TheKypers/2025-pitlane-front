import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProfileSection } from "@/components/profile";
import { Suspense } from "react";

function DashboardSkeleton() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-xl border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="w-64 h-8 bg-muted rounded animate-pulse mb-2"></div>
            <div className="w-32 h-5 bg-muted/70 rounded animate-pulse"></div>
          </div>
          <div className="text-right">
            <div className="w-48 h-4 bg-muted/70 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Groups section skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="w-32 h-5 bg-muted rounded animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="w-16 h-8 bg-muted rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      
      {/* Meals section skeleton */}
      <div className="space-y-4">
        <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <UserProfileSection />
    </Suspense>
  );
}
