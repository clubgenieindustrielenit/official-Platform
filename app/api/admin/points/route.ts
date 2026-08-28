import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { pointsSchema, parseBody } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    // ── 1. Auth & Role Guard ────────────────────────────────────────────────
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;

    // ── 2. Input Validation ─────────────────────────────────────────────────
    // Zod schema enforces: user_id is a UUID, amount is a non-zero int in
    // [-10000, 10000], reason is a non-empty string up to 300 chars.
    // .strict() rejects any extra fields (prevents mass-assignment).
    const parsed = await parseBody(request, pointsSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { user_id, amount, reason } = parsed.data;

    if (amount === 0) {
      return NextResponse.json(
        { error: "Le montant de points doit être un nombre non nul." },
        { status: 400 }
      );
    }

    // ── 3. IDOR Check ───────────────────────────────────────────────────────
    // Verify that user_id actually refers to a real profile before inserting.
    // This prevents point log entries being created for non-existent user IDs.
    const { data: targetProfile, error: profileFetchErr } = await (client as any)
      .from("profiles")
      .select("id, points_total")
      .eq("id", user_id)
      .single();

    if (profileFetchErr || !targetProfile) {
      return NextResponse.json(
        { error: "Membre introuvable." },
        { status: 404 }
      );
    }

    // ── 4. Insert points log ────────────────────────────────────────────────
    const { data: pointEntry, error: logError } = await (client as any)
      .from("points_log")
      .insert({
        user_id,
        amount,
        reason: reason.trim(),
      })
      .select()
      .single();

    if (logError) {
      console.error("[admin/points] Log insert error:", logError);
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement des points." },
        { status: 500 }
      );
    }

    // ── 5. Update profile total ─────────────────────────────────────────────
    const currentTotal = targetProfile.points_total || 0;
    const { error: updateErr } = await (client as any)
      .from("profiles")
      .update({ points_total: Math.max(0, currentTotal + amount) })
      .eq("id", user_id);

    if (updateErr) {
      console.error("[admin/points] Profile update error:", updateErr);
    }

    // ── 6. Create notification ──────────────────────────────────────────────
    const sign = amount > 0 ? "+" : "";
    await (client as any)
      .from("notifications")
      .insert({
        user_id,
        type: "points",
        title: "Points crédités / ajustés",
        message: `${sign}${amount} pts : ${reason.trim()}`,
        link: "/membre/profil",
        read: false,
      });

    return NextResponse.json({ success: true, pointEntry });
  } catch (err: unknown) {
    console.error("[admin/points] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'attribution des points." },
      { status: 500 }
    );
  }
}
