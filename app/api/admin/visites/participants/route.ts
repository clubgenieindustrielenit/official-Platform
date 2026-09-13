import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

// GET: List all registered members for a specific visit
export async function GET(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get("activity_id");

    if (!activityId) {
      return NextResponse.json({ error: "Identifiant de visite requis." }, { status: 400 });
    }

    // Attempt query with created_at, with graceful fallback to registered_at or unconstrained select
    let registrations: any[] = [];
    let { data: rawData, error } = await (client as any)
      .from("event_registrations")
      .select(`
        *,
        profile:profiles!event_registrations_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          classe,
          avatar_url,
          statut_membre,
          statut_membre_verified
        )
      `)
      .eq("activity_id", activityId);

    if (error) {
      // If foreign key alias fails, fallback to standard profile relation
      const fallback = await (client as any)
        .from("event_registrations")
        .select(`
          *,
          profile:profiles (
            id,
            first_name,
            last_name,
            email,
            phone,
            classe,
            avatar_url,
            statut_membre,
            statut_membre_verified
          )
        `)
        .eq("activity_id", activityId);

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      rawData = fallback.data;
    }

    // Sort in memory by created_at or registered_at or queue_position
    registrations = (rawData || []).sort((a: any, b: any) => {
      const timeA = new Date(a.created_at || a.registered_at || 0).getTime();
      const timeB = new Date(b.created_at || b.registered_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.queue_position || 0) - (b.queue_position || 0);
    });

    return NextResponse.json({ registrations });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des participants." },
      { status: 500 }
    );
  }
}

// POST: Toggle attendance status for a participant
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { registration_id, attended } = body;

    if (!registration_id) {
      return NextResponse.json({ error: "Identifiant d'inscription requis." }, { status: 400 });
    }

    const { data: updated, error } = await (client as any)
      .from("event_registrations")
      .update({ attended: Boolean(attended) })
      .eq("id", registration_id)
      .select("*, profile:profiles!event_registrations_user_id_fkey(first_name, last_name, points_total)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour de la présence." },
      { status: 500 }
    );
  }
}
