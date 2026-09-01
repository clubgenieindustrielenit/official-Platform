import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { registerSchema, parseBody } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    // ── 1. Auth Guard (Bootstrap Mode: allow if database has no admin yet or when requested) ─────
    const supabaseUrlCheck = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKeyCheck = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let allowRegistration = false;
    if (serviceKeyCheck) {
      const checkClient = createSupabaseClient(supabaseUrlCheck, serviceKeyCheck, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { count } = await checkClient.from("profiles").select("id", { count: "exact", head: true });
      if (count === 0) {
        allowRegistration = true; // Initial bootstrap: database is completely empty
      }
    }

    if (!allowRegistration) {
      const auth = await verifyCanManage(true); // admin only
      if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    // ── 2. Input Validation ─────────────────────────────────────────────────
    const parsed = await parseBody(req, registerSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { email, password, firstName, lastName, role, statutMembre, classe, phone } =
      parsed.data;

    // ── 3. Service Role Guard ───────────────────────────────────────────────
    // C-2 FIX: Previously fell back to anon key silently. Fail fast instead.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      console.error("[register] SUPABASE_SERVICE_ROLE_KEY is not set.");
      return NextResponse.json(
        { error: "Configuration serveur manquante." },
        { status: 503 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Create or update Supabase Auth user ──────────────────────────────
    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || email.split("@")[0],
          last_name: lastName || "",
          role: role || "membre_actif",
        },
      });

    let userId: string;

    if (createError) {
      if (
        createError.message.includes("already registered") ||
        createError.message.includes("already been registered")
      ) {
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        const existing = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (!existing) {
          console.error("[register] Existing user not found after conflict:", createError);
          return NextResponse.json(
            { error: "Erreur lors de la création du compte." },
            { status: 400 }
          );
        }
        userId = existing.id;

        await adminClient.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName || email.split("@")[0],
            last_name: lastName || "",
            role: role || "membre_actif",
          },
        });
      } else {
        console.error("[register] createUser error:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la création du compte." },
          { status: 400 }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // ── 5. Upsert profile ───────────────────────────────────────────────────
    // Role is validated via Zod enum — only "membre_actif", "membre_bureau",
    // "admin" are accepted. The server-side enum is the single source of truth.
    const assignedRole =
      role === "admin"
        ? "admin"
        : role === "membre_bureau"
        ? "membre_bureau"
        : "membre_actif";

    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        email: email.toLowerCase(),
        first_name: firstName || email.split("@")[0],
        last_name: lastName || "",
        role: assignedRole,
        statut_membre: statutMembre || "actif",
        statut_membre_verified: true,
        classe: classe || "1AGI1",
        phone: phone || "+216 00 000 000",
        points_total: role === "admin" ? 150 : role === "membre_bureau" ? 90 : 25,
        profile_completed_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[register] Profile upsert error:", profileError);
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      email,
      role: assignedRole,
      message: "Compte créé et configuré avec succès !",
    });
  } catch (err: unknown) {
    console.error("[register] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement." },
      { status: 500 }
    );
  }
}
