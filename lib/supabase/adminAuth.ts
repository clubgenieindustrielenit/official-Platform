import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { isBureauOrAdmin, isAdmin, Role } from "@/lib/types/roles";

export async function verifyCanManage(adminOnly: boolean = false): Promise<
  | { ok: true; user: any; role: Role; client: ReturnType<typeof createClient> }
  | { ok: false; error: string; status: number }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Non authentifié.", status: 401 };
  }

  const client = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : serverSupabase;

  // Fast path: role is already in JWT user_metadata → no DB round-trip needed
  let role: Role = (user.user_metadata?.role || "") as Role;

  if (!role) {
    // Slow path: fetch from DB only if not cached in JWT metadata
    const { data: profile } = await (client as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    role = (profile?.role || "membre_actif") as Role;
  }

  if (adminOnly) {
    if (!isAdmin(role)) {
      return {
        ok: false,
        error: "Accès réservé aux administrateurs.",
        status: 403,
      };
    }
  } else {
    if (!isBureauOrAdmin(role)) {
      return {
        ok: false,
        error: "Accès refusé. Réservé à l'administration et au bureau.",
        status: 403,
      };
    }
  }

  return { ok: true, user, role, client: client as any };
}

/**
 * Call this after updating a user's role in the DB to also write it into
 * their JWT user_metadata so future requests skip the profiles DB lookup.
 */
export async function syncRoleToMetadata(userId: string, role: Role) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return;

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });
}
