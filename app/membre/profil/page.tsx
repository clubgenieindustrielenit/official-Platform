import { createClient } from "@/lib/supabase/server";
import ProfilClient from "@/components/membre/ProfilClient";
import { Role } from "@/lib/types/roles";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const [profileRes, pointsLogRes, polesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, poles(name)")
      .eq("id", userId || "")
      .single(),

    supabase
      .from("points_log")
      .select("*")
      .eq("user_id", userId || "")
      .order("created_at", { ascending: false }),

    supabase.from("poles").select("id, name, color"),
  ]);

  const profile = profileRes.data;
  const pointsLog = pointsLogRes.data || [];
  const allPoles: { id: string; name: string; color?: string }[] =
    polesRes.data || [];

  // Resolve pole names from pole_ids array
  const poleIdsArray: string[] = profile?.pole_ids ?? [];
  const resolvedPoles =
    poleIdsArray.length > 0
      ? poleIdsArray
          .map((pid) => allPoles.find((p) => p.id === pid))
          .filter(Boolean) as { id: string; name: string; color?: string }[]
      : profile?.poles?.name
      ? [{ id: "legacy", name: profile.poles.name }]
      : [];

  return (
    <ProfilClient
      initialProfile={profile as any}
      initialPointsLog={pointsLog}
      userEmail={user?.email || ""}
      resolvedPoles={resolvedPoles}
    />
  );
}