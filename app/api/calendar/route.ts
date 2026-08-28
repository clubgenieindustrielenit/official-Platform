import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBureauOrAdmin } from "@/lib/types/roles";
import { calendarEventSchema, parseBody } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*, poles(id, name)")
      .order("date_start", { ascending: true });

    if (error) {
      console.error("[calendar] GET error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération du calendrier." },
        { status: 500 }
      );
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (err: unknown) {
    console.error("[calendar] GET unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur récupération calendrier" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ── Role Guard ──────────────────────────────────────────────────────────
    // M-3 FIX: Previously only checked `if (!user)`, meaning any authenticated
    // member could create calendar events. Calendar creation is a bureau/admin
    // operation — enforce that here.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || "membre_actif";

    if (!isBureauOrAdmin(role)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé à l'administration et au bureau." },
        { status: 403 }
      );
    }

    // ── Input Validation ────────────────────────────────────────────────────
    const parsed = await parseBody(request, calendarEventSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { title, description, type, date_start, date_end, location, pole_id } =
      parsed.data;

    const { data: created, error } = await supabase
      .from("activities")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        type,
        date_start,
        date_end: date_end || null,
        location: location?.trim() || null,
        pole_id: pole_id || null,
        status: "published",
        created_by: user.id,
      })
      .select("*, poles(id, name)")
      .single();

    if (error) {
      console.error("[calendar] POST insert error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'activité." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, activity: created });
  } catch (err: unknown) {
    console.error("[calendar] POST unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'activité" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ── Role Guard ──────────────────────────────────────────────────────────
    // M-3 FIX: Same issue — any authenticated user could delete events.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || user.user_metadata?.role || "membre_actif";

    if (!isBureauOrAdmin(role)) {
      return NextResponse.json(
        { error: "Accès refusé. Réservé à l'administration et au bureau." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // ── IDOR Check ──────────────────────────────────────────────────────────
    // Verify the activity exists before attempting deletion.
    const { data: existing } = await supabase
      .from("activities")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Activité introuvable." },
        { status: 404 }
      );
    }

    const { error } = await supabase.from("activities").delete().eq("id", id);

    if (error) {
      console.error("[calendar] DELETE error:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[calendar] DELETE unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
