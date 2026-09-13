import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

// GET: Fetch participants for a given formation
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
      return NextResponse.json({ error: "activity_id est requis." }, { status: 400 });
    }

    let participants: any[] = [];
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
          statut_membre
        )
      `)
      .eq("activity_id", activityId);

    if (error) {
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
            statut_membre
          )
        `)
        .eq("activity_id", activityId);

      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      rawData = fallback.data;
    }

    participants = (rawData || []).sort((a: any, b: any) => {
      const timeA = new Date(a.created_at || a.registered_at || 0).getTime();
      const timeB = new Date(b.created_at || b.registered_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return (a.queue_position || 0) - (b.queue_position || 0);
    });

    return NextResponse.json({ participants });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des participants." },
      { status: 500 }
    );
  }
}

// PUT: Update participant status or mark attendance
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { id, attended, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Identifiant de l'inscription requis." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (attended !== undefined) updatePayload.attended = attended;
    if (status !== undefined) updatePayload.status = status;

    const { data: updated, error } = await (client as any)
      .from("event_registrations")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}
