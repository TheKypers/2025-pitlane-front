import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreferenceFilteredFoodsPage } from "@/components/food";

interface PreferencePageProps {
  params: Promise<{
    idPref: string;
  }>;
}

export default async function PreferencePage({ params }: PreferencePageProps) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  
  const resolvedParams = await params;
  return <PreferenceFilteredFoodsPage preferenceId={resolvedParams.idPref} />;
}