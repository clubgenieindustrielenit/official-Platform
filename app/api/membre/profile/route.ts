import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { memberProfileSchema, parseBody } from "@/lib/validation/schemas";

interface ProfilePointsDiff {
  delta: number;
  logsToInsert: Array<{ amount: number; reason: string }>;
}

function calculateProfilePointsDelta(
  oldP: Record<string, any> | null,
  newP: Record<string, any>
): ProfilePointsDiff {
  let delta = 0;
  const logsToInsert: Array<{ amount: number; reason: string }> = [];

  // 1. Photo de profil (5 pts)
  const hadAvatar = Boolean(oldP?.avatar_url && String(oldP.avatar_url).trim() !== "");
  const hasAvatar = Boolean(newP?.avatar_url && String(newP.avatar_url).trim() !== "");
  if (!hadAvatar && hasAvatar) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : Photo de profil" });
  } else if (hadAvatar && !hasAvatar) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : Photo de profil supprimée" });
  }

  // 2. CV (10 pts)
  const hadCv = Boolean(oldP?.cv_url && String(oldP.cv_url).trim() !== "");
  const hasCv = Boolean(newP?.cv_url && String(newP.cv_url).trim() !== "");
  if (!hadCv && hasCv) {
    delta += 10;
    logsToInsert.push({ amount: 10, reason: "Profil complété : CV ajouté" });
  } else if (hadCv && !hasCv) {
    delta -= 10;
    logsToInsert.push({ amount: -10, reason: "Profil modifié : CV supprimé" });
  }

  // 3. LinkedIn (5 pts)
  const hadLinkedin = Boolean(oldP?.linkedin_url && String(oldP.linkedin_url).trim() !== "");
  const hasLinkedin = Boolean(newP?.linkedin_url && String(newP.linkedin_url).trim() !== "");
  if (!hadLinkedin && hasLinkedin) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : LinkedIn ajouté" });
  } else if (hadLinkedin && !hasLinkedin) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : LinkedIn supprimé" });
  }

  // 4. Section Prépa (5 pts)
  const hadSection = Boolean(oldP?.prepa_section && String(oldP.prepa_section).trim() !== "");
  const hasSection = Boolean(newP?.prepa_section && String(newP.prepa_section).trim() !== "");
  if (!hadSection && hasSection) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : Section prépa renseignée" });
  } else if (hadSection && !hasSection) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : Section prépa supprimée" });
  }

  // 5. Établissement Prépa (5 pts)
  const hadSchool = Boolean(oldP?.prepa_etablissement && String(oldP.prepa_etablissement).trim() !== "");
  const hasSchool = Boolean(newP?.prepa_etablissement && String(newP.prepa_etablissement).trim() !== "");
  if (!hadSchool && hasSchool) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : Établissement prépa renseigné" });
  } else if (hadSchool && !hasSchool) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : Établissement prépa supprimé" });
  }

  // 6. Rang Concours (5 pts)
  const hadRang = oldP?.rang_concours !== null && oldP?.rang_concours !== undefined && String(oldP.rang_concours).trim() !== "";
  const hasRang = newP?.rang_concours !== null && newP?.rang_concours !== undefined && String(newP.rang_concours).trim() !== "";
  if (!hadRang && hasRang) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : Rang concours renseigné" });
  } else if (hadRang && !hasRang) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : Rang concours supprimé" });
  }

  // 7. Année Concours / Bio (5 pts)
  const hadConcoursYear = Boolean(
    (oldP?.annee_concours && String(oldP.annee_concours).trim() !== "") ||
    (oldP?.bio && String(oldP.bio).trim() !== "") ||
    (oldP?.training_availability && String(oldP.training_availability).trim() !== "")
  );
  const hasConcoursYear = Boolean(
    (newP?.annee_concours && String(newP.annee_concours).trim() !== "") ||
    (newP?.bio && String(newP.bio).trim() !== "")
  );
  if (!hadConcoursYear && hasConcoursYear) {
    delta += 5;
    logsToInsert.push({ amount: 5, reason: "Profil complété : Année de concours renseignée" });
  } else if (hadConcoursYear && !hasConcoursYear) {
    delta -= 5;
    logsToInsert.push({ amount: -5, reason: "Profil modifié : Année de concours supprimée" });
  }

  return { delta, logsToInsert };
}

export async function PUT(request: Request) {
  try {
    // ── 1. Auth ─────────────────────────────────────────────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    // Use privileged service client for atomic points and profile sync if available
    const dbClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : serverSupabase;

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

    // ── 3. Fetch Current Profile Before Update ───────────────────────────────
    const { data: currentProfile, error: fetchErr } = await (dbClient as any)
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[membre/profile] Error fetching current profile:", fetchErr);
    }

    // ── 4. Build update payload ─────────────────────────────────────────────
    const finalPromotion = promotion?.trim() || year?.trim() || null;
    const finalClasse = statut_membre === "alumni" ? (finalPromotion || "Alumni") : (classe?.trim() || null);
    const finalConcoursYear = annee_concours?.trim() || bio?.trim() || null;

    const candidatePayload: Record<string, any> = {
      avatar_url: avatar_url?.trim() || null,
      cv_url: cv_url?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
      prepa_section: prepa_section?.trim() || null,
      prepa_etablissement: prepa_etablissement?.trim() || null,
      rang_concours:
        rang_concours !== null && rang_concours !== undefined && String(rang_concours).trim() !== ""
          ? Number(rang_concours)
          : null,
      bio: finalConcoursYear,
      annee_concours: finalConcoursYear,
    };

    // ── 5. Calculate Points Delta and Logs ───────────────────────────────────
    const { delta, logsToInsert } = calculateProfilePointsDelta(currentProfile, candidatePayload);
    const currentPoints = currentProfile?.points_total ?? 0;
    const finalPointsTotal = Math.max(0, currentPoints + delta);

    const updatePayload: Record<string, unknown> = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone.trim(),
      classe: finalClasse,
      statut_membre,
      year: statut_membre === "alumni" ? finalPromotion : null,
      bio: finalConcoursYear,
      annee_concours: finalConcoursYear,
      avatar_url: candidatePayload.avatar_url,
      cv_url: candidatePayload.cv_url,
      linkedin_url: candidatePayload.linkedin_url,
      prepa_section: candidatePayload.prepa_section,
      prepa_etablissement: candidatePayload.prepa_etablissement,
      rang_concours: candidatePayload.rang_concours,
      points_total: finalPointsTotal,
    };

    // Mark completion timestamp on initial valid profile completion
    if (
      phone.trim() &&
      finalClasse &&
      statut_membre &&
      !currentProfile?.profile_completed_at
    ) {
      updatePayload.profile_completed_at = new Date().toISOString();
    }

    // ── 6. Update Profile in Database ───────────────────────────────────────
    const { data: updatedProfile, error: updateError } = await (dbClient as any)
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

    // ── 7. Insert Points Movement Logs (Deduplicated) ────────────────────────
    if (logsToInsert.length > 0) {
      // Check for recent duplicate logs in the last 15 seconds to avoid double-logging with DB triggers
      const { data: recentLogs } = await (dbClient as any)
        .from("points_log")
        .select("reason")
        .eq("user_id", user.id)
        .gt("created_at", new Date(Date.now() - 15000).toISOString());

      const recentReasons = new Set((recentLogs || []).map((r: any) => r.reason));
      const uniqueLogsToInsert = logsToInsert.filter((l) => !recentReasons.has(l.reason));

      if (uniqueLogsToInsert.length > 0) {
        const logRows = uniqueLogsToInsert.map((l) => ({
          user_id: user.id,
          amount: l.amount,
          reason: l.reason,
        }));

        const { error: logErr } = await (dbClient as any)
          .from("points_log")
          .insert(logRows);

        if (logErr) {
          console.error("[membre/profile] Points log insert error:", logErr);
        }
      }
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
