import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { memberProfileSchema, parseBody } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  try {
    // ── 1. Auth ─────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    // ── 2. Input Validation ─────────────────────────────────────────────────
    // Zod schema with .strict() strips any extra fields the client might send
    // (e.g. role, id, points_total) preventing mass-assignment.
    const parsed = await parseBody(request, memberProfileSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const {
      first_name,
      last_name,
      phone,
      classe,
      statut_membre,
      avatar_url,
      cv_url,
      linkedin_url,
      prepa_section,
      prepa_etablissement,
      rang_concours,
    } = parsed.data;

    // ── 3. Build update payload ─────────────────────────────────────────────
    // IDOR FIX: The .eq("id", user.id) below ensures a member can only ever
    // update their OWN profile. The user.id comes from the server-side session,
    // not from the request body, so client-supplied IDs are ignored entirely.
    const updatePayload: Record<string, unknown> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      classe: classe.trim(),
      statut_membre,
      avatar_url: avatar_url || null,
      cv_url: cv_url || null,
      linkedin_url: linkedin_url?.trim() || null,
      prepa_section: prepa_section || null,
      prepa_etablissement: prepa_etablissement?.trim() || null,
      rang_concours:
        rang_concours !== null && rang_concours !== undefined
          ? Number(rang_concours)
          : null,
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id) // scoped to session user — never trust client ID
      .select("*, poles(name)")
      .single();

    if (updateError) {
      console.error("[membre/profile] Update error:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour du profil." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    console.error("[membre/profile] Unexpected error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du profil." },
      { status: 500 }
    );
  }
}
