import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

// Helper to notify all active members on new publication
async function notifyMembers(client: any, title: string, message: string, link: string) {
  try {
    const { data: members } = await client
      .from("profiles")
      .select("id")
      .eq("is_active", true);

    if (members && members.length > 0) {
      const notifs = members.map((m: any) => ({
        user_id: m.id,
        type: "système",
        title,
        message,
        link,
        read: false,
      }));
      await client.from("notifications").insert(notifs);
    }
  } catch (err) {
    console.error("Error sending bulk notifications:", err);
  }
}

// GET: Fetch all visits (draft and published)
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { data: visits, error } = await (client as any)
      .from("activities")
      .select(`
        *,
        creator:profiles!activities_created_by_fkey (id, first_name, last_name, avatar_url)
      `)
      .eq("type", "visit")
      .order("date_start", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ visits: visits || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des visites." },
      { status: 500 }
    );
  }
}

// POST: Create a new company visit
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client, user } = auth;
    const body = await request.json();

    const {
      title,
      description,
      entreprise,
      location,
      date_start,
      date_end,
      capacity,
      cover_image_url,
      google_form_url,
      status = "published",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre de la visite est requis." }, { status: 400 });
    }

    if (!date_start) {
      return NextResponse.json({ error: "La date de la visite est requise." }, { status: 400 });
    }

    const { data: visit, error } = await (client as any)
      .from("activities")
      .insert({
        type: "visit",
        category: "Visite",
        source: "enrollment",
        title: title.trim(),
        description: description?.trim() || "",
        entreprise: entreprise?.trim() || null,
        location: location?.trim() || null,
        date_start,
        date: date_start,
        date_end: date_end || null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        cover_image_url: cover_image_url || null,
        image_url: cover_image_url || null,
        google_form_url: google_form_url?.trim() || null,
        status,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If published immediately, notify members
    if (status === "published") {
      await notifyMembers(
        client,
        "Nouvelle Visite Industrielle 🏭",
        `La visite chez ${entreprise || title} est disponible. Inscrivez-vous vite !`,
        "/membre/visites"
      );
    }

    return NextResponse.json({ success: true, visit });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création de la visite." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing company visit
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { id, status, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Identifiant de la visite requis." }, { status: 400 });
    }

    // Check old status to see if transitioned to published
    const { data: existing } = await (client as any)
      .from("activities")
      .select("status, title, entreprise")
      .eq("id", id)
      .single();

    const updatePayload: Record<string, any> = { ...fields };
    if (status) updatePayload.status = status;
    if (fields.description !== undefined) updatePayload.description = fields.description?.trim() || "";
    if (fields.cover_image_url !== undefined) updatePayload.image_url = fields.cover_image_url;
    if (fields.date_start !== undefined) updatePayload.date = fields.date_start;

    const { data: updatedVisit, error } = await (client as any)
      .from("activities")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify if status changed from draft to published
    if (existing?.status === "draft" && status === "published") {
      await notifyMembers(
        client,
        "Nouvelle Visite Industrielle 🏭",
        `La visite chez ${updatedVisit.entreprise || updatedVisit.title} est publiée !`,
        "/membre/visites"
      );
    }

    return NextResponse.json({ success: true, visit: updatedVisit });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a company visit
export async function DELETE(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
    }

    const { error } = await (client as any).from("activities").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
