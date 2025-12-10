'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserSidebar } from "@/components/profile";
import { ThemeSwitcher, UserNameWithBadge } from "@/components/common";
import { useUserProfile } from "@/lib/hooks/useUserProfile";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { profile, loading } = useUserProfile();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getClaims();
      setIsAuthenticated(!!data?.claims);
    };

    checkAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          setIsAuthenticated(true);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        }
      }
    );


    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Mostrar loading mientras verificamos autenticación
  if (isAuthenticated === null) {
    return <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>;
  }

  return isAuthenticated ? (
    <div className="flex items-center gap-2">
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm">Hey,</span>
          {profile?.id ? (
            <UserNameWithBadge 
              username={profile.username || profile.email || 'User'}
              profileId={profile.id}
              badgeSize="sm"
              usernameClassName="text-sm"
            />
          ) : (
            <span className="text-sm">{profile?.username || profile?.email || 'User'}!</span>
          )}
        </div>
      )}
      <ThemeSwitcher />
      <UserSidebar />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <ThemeSwitcher />
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
