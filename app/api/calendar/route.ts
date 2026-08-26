import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*, poles(id, name)")
      .order("date_start", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur récupération calendrier" },
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

    const body = await request.json();
    const { title, description, type, date_start, date_end, location, pole_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
    }

    if (!date_start) {
      return NextResponse.json({ error: "La date de début est requise" }, { status: 400 });
    }

    const activityType = ["event", "visit", "formation"].includes(type) ? type : "event";

    const { data: created, error } = await supabase
      .from("activities")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        type: activityType,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: created });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création de l'activité" },
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const { error } = await supabase.from("activities").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
