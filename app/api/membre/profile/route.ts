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
      year,
      promotion,
      annee_concours,
      bio,
      avatar_url,
      cv_url,
      linkedin_url,
      prepa_section,
      prepa_etablissement,
      rang_concours,
    } = parsed.data;

    // ── 3. Build update payload ─────────────────────────────────────────────
    const finalPromotion = promotion?.trim() || year?.trim() || null;
    const finalClasse = statut_membre === "alumni" ? (finalPromotion || "Alumni") : (classe?.trim() || null);
    const finalConcoursYear = annee_concours?.trim() || bio?.trim() || null;

    const updatePayload: Record<string, unknown> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      classe: finalClasse,
      statut_membre,
      year: statut_membre === "alumni" ? finalPromotion : null,
      bio: finalConcoursYear,
      annee_concours: finalConcoursYear,
      training_availability: finalConcoursYear,
      avatar_url: avatar_url?.trim() || null,
      cv_url: cv_url?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
      prepa_section: prepa_section?.trim() || null,
      prepa_etablissement: prepa_etablissement?.trim() || null,
      rang_concours:
        rang_concours !== null && rang_concours !== undefined && String(rang_concours).trim() !== ""
          ? Number(rang_concours)
          : null,
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", user.id)
      .select("*, poles(name)")
      .single();

    if (updateError) {
      console.error("[membre/profile] Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Erreur lors de la mise à jour du profil." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: unknown) {
    console.error("[membre/profile] Unexpected error:", err);
    return NextResponse.json(
      { error: (err as any)?.message || "Une erreur est survenue lors de la mise à jour du profil." },
      { status: 500 }
    );
  }
}
