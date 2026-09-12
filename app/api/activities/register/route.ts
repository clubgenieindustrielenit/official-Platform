import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

function getClient(serverSupabase: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : serverSupabase;
}

// ---------------------------------------------------------------------------
// POST: Register user to an activity / visit / formation
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Veuillez vous connecter pour vous inscrire." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { activity_id } = body;

    if (!activity_id) {
      return NextResponse.json(
        { error: "Identifiant de l'activité requis." },
        { status: 400 }
      );
    }

    const client = getClient(serverSupabase);

    // 1. Fetch activity capacity & info
    const { data: activity, error: actError } = await (client as any)
      .from("activities")
      .select("id, title, capacity, entreprise")
      .eq("id", activity_id)
      .single();

    if (actError || !activity) {
      return NextResponse.json(
        { error: "Activité introuvable." },
        { status: 404 }
      );
    }

    // 2. Count current confirmed participants
    const { count: confirmedCount } = await (client as any)
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", activity_id)
      .eq("status", "confirmed");

    const capacity = activity.capacity;
    const isFull = capacity ? (confirmedCount || 0) >= capacity : false;

    let targetStatus: "confirmed" | "waitlisted" = "confirmed";
    let queuePosition: number | null = null;

    if (isFull) {
      targetStatus = "waitlisted";
      const { data: maxQueue } = await (client as any)
        .from("event_registrations")
        .select("queue_position")
        .eq("activity_id", activity_id)
        .eq("status", "waitlisted")
        .order("queue_position", { ascending: false })
        .limit(1)
        .maybeSingle();

      queuePosition = (maxQueue?.queue_position || 0) + 1;
    }

    // 3. Upsert registration
    const { data: registration, error: regError } = await (client as any)
      .from("event_registrations")
      .upsert(
        {
          activity_id,
          user_id: user.id,
          status: targetStatus,
          queue_position: queuePosition,
        },
        { onConflict: "activity_id,user_id" }
      )
      .select()
      .single();

    if (regError) {
      console.error("[REGISTER API ERROR]", regError);
      return NextResponse.json(
        { error: regError.message || "Erreur lors de l'inscription." },
        { status: 500 }
      );
    }

    // 4. Send non-blocking notification
    if (targetStatus === "confirmed") {
      try {
        await (client as any).from("notifications").insert({
          user_id: user.id,
          type: "système",
          title: "Inscription Confirmée ! 🎉",
          message: `Votre place pour "${activity.title}" a été réservée avec succès.`,
          link: `/membre/visites/${activity.id}`,
          read: false,
        });
      } catch (notifErr) {
        console.warn("Notification error:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      registration,
      status: targetStatus,
      queue_position: queuePosition,
    });
  } catch (err: any) {
    console.error("[REGISTER API EXCEPTION]", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de l'inscription." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: Cancel registration
// ---------------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activity_id = searchParams.get("activity_id");
    const registration_id = searchParams.get("id");

    if (!activity_id && !registration_id) {
      return NextResponse.json(
        { error: "Identifiant requis." },
        { status: 400 }
      );
    }

    const client = getClient(serverSupabase);

    let query = (client as any).from("event_registrations").delete().eq("user_id", user.id);
    if (registration_id) {
      query = query.eq("id", registration_id);
    } else if (activity_id) {
      query = query.eq("activity_id", activity_id);
    }

    const { error: deleteError } = await query;
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Erreur lors du désistement." },
        { status: 500 }
      );
    }

    // Promote first in queue if any
    if (activity_id) {
      try {
        const { data: nextInQueue } = await (client as any)
          .from("event_registrations")
          .select("id, user_id")
          .eq("activity_id", activity_id)
          .eq("status", "waitlisted")
          .order("queue_position", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (nextInQueue) {
          await (client as any)
            .from("event_registrations")
            .update({ status: "confirmed", queue_position: null })
            .eq("id", nextInQueue.id);

          await (client as any).from("notifications").insert({
            user_id: nextInQueue.user_id,
            type: "système",
            title: "Place Libérée ! 🎉",
            message: "Une place s'est libérée ! Votre inscription est passée en confirmée.",
            link: `/membre/visites/${activity_id}`,
            read: false,
          });
        }
      } catch (promoteErr) {
        console.warn("Error promoting next in queue:", promoteErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'annulation." },
      { status: 500 }
    );
  }
}
