import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { acceptInviteSchema, parseBody } from "@/lib/validation/schemas";

export async function POST(req: Request) {
  try {
    // ── 1. Input Validation ─────────────────────────────────────────────────
    const parsed = await parseBody(req, acceptInviteSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { token, password, firstName, lastName } = parsed.data;
    // Password minimum is now 8 chars, enforced by the Zod schema above.

    // ── 2. Service Role Guard ───────────────────────────────────────────────
    // C-2 FIX: Previously, if SUPABASE_SERVICE_ROLE_KEY was unset, the code
    // silently fell back to the anon key and then attempted admin Auth API
    // calls (createUser, listUsers, updateUserById). These operations require
    // the service role — using the anon key would fail at runtime and could
    // expose internal error details. We now fail fast with a clear server-side
    // error rather than silently degrading to an unprivileged key.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      console.error("[accept-invite] SUPABASE_SERVICE_ROLE_KEY is not set.");
      return NextResponse.json(
        { error: "Configuration serveur manquante. Contactez un administrateur." },
        { status: 503 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 3. Verify invitation token ──────────────────────────────────────────
    const { data: invitation, error: inviteErr } = await adminClient
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteErr || !invitation) {
      return NextResponse.json(
        { error: "Invitation introuvable ou lien invalide." },
        { status: 404 }
      );
    }

    if (invitation.status === "cancelled" || invitation.status === "accepted") {
      return NextResponse.json(
        { error: "Cette invitation a déjà été utilisée ou a été annulée." },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (invitation.status === "expired" || expiresAt < now) {
      return NextResponse.json(
        { error: "Cette invitation a expiré." },
        { status: 400 }
      );
    }

    const cleanEmail = invitation.email.trim().toLowerCase();
    const role = invitation.role || "membre_actif";

    // ── 4. Create or update Supabase Auth user ──────────────────────────────
    let userId: string;

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || cleanEmail.split("@")[0],
          last_name: lastName || "",
          role,
        },
      });

    if (createError) {
      if (
        createError.message.includes("already registered") ||
        createError.message.includes("already been registered")
      ) {
        const { data: usersList } = await adminClient.auth.admin.listUsers();
        const existing = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (!existing) {
          console.error("[accept-invite] Existing user not found:", createError);
          return NextResponse.json(
            { error: "Erreur lors de la création du compte." },
            { status: 400 }
          );
        }

        userId = existing.id;

        const { error: updateAuthErr } =
          await adminClient.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: {
              first_name: firstName || cleanEmail.split("@")[0],
              last_name: lastName || "",
              role,
            },
          });

        if (updateAuthErr) {
          console.error("[accept-invite] updateUserById error:", updateAuthErr);
          return NextResponse.json(
            { error: "Erreur lors de la mise à jour du compte." },
            { status: 500 }
          );
        }
      } else {
        console.error("[accept-invite] createUser error:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la création du compte." },
          { status: 400 }
        );
      }
    } else {
      userId = userData.user.id;
    }

    // ── 5. Upsert profile record ────────────────────────────────────────────
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        email: cleanEmail,
        first_name: firstName || cleanEmail.split("@")[0],
        last_name: lastName || "",
        role,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[accept-invite] Profile upsert error:", profileError);
    }

    // Force-update the role explicitly — the DB trigger (handle_new_user) hardcodes
    // 'member' as default role on INSERT, so we must override it here with the
    // invited role (e.g. 'membre_bureau') via a separate UPDATE call.
    const { error: roleErr } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (roleErr) {
      console.error("[accept-invite] Role update error:", roleErr);
    }

    // ── 6. Mark invitation as accepted ──────────────────────────────────────
    await adminClient
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      userId,
      email: cleanEmail,
      role,
      message: "Compte activé avec succès !",
    });
  } catch (err: unknown) {
    // M-2 FIX: Log full error server-side, never expose internals to client.
    console.error("[accept-invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
