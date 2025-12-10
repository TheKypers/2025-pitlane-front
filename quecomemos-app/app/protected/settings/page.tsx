import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/profile";
import { API_BASE_URL } from "@/lib/config/api";
import { Suspense } from "react";

function SettingsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div>
        <div className="w-32 h-8 bg-muted rounded animate-pulse mb-2"></div>
        <div className="w-80 h-4 bg-muted/70 rounded animate-pulse"></div>
      </div>

      {/* Form skeleton */}
      <div className="space-y-6 bg-card border rounded-lg p-6">
        {/* Profile image section */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-muted rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-40 h-4 bg-muted rounded animate-pulse"></div>
            <div className="w-24 h-8 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Preferences section skeleton */}
        <div className="space-y-4">
          <div className="w-48 h-6 bg-muted rounded animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-full h-10 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Dietary restrictions skeleton */}
        <div className="space-y-4">
          <div className="w-56 h-6 bg-muted rounded animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-10 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Save button skeleton */}
        <div className="w-full h-10 bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  );
}

async function SettingsContent() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const jwt = await supabase.auth.getSession().then(res => res.data.session?.access_token);

  let profile = null;

  if (data.claims) {
    const profileRes = await fetch(
      `${API_BASE_URL}/profile/${data.claims.sub}`,
      {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (profileRes.ok) profile = await profileRes.json();
  }

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-0">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <SettingsForm initialProfile={profile} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}