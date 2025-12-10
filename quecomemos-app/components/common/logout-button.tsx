"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear browser history and replace with login page
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/auth/login');
    }
    router.replace("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
