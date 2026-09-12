import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

// Non-blocking helper to notify members
async function notifyMembers(client: any, title: string, message: string, link: string) {
  try {
    const { data: members } = await client
      .from("profiles")
      .select("id")
      .eq("is_active", true)
      .limit(100);

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
    console.warn("Bulk notification error (non-fatal):", err);
  }
}

// Helper to extract and hydrate metadata from content
function parseFormationRecord(record: any) {
  if (!record) return record;
  let metadata: Record<string, any> = {};
  if (record.content) {
    try {
      const parsed = JSON.parse(record.content);
      if (parsed && typeof parsed === "object" && parsed._is_formation_meta) {
        metadata = parsed;
      }
    } catch (_) {}
  }

  return {
    ...record,
    date_start: record.date_start || record.date || null,
    date_end: record.date_end || metadata.date_end || null,
    cover_image_url: record.cover_image_url || record.image_url || null,
    image_url: record.cover_image_url || record.image_url || null,
    trainer_name: record.trainer_name || metadata.trainer_name || null,
    prerequisites: record.prerequisites || metadata.prerequisites || null,
    training_material_url: record.training_material_url || metadata.training_material_url || null,
    google_form_url: record.google_form_url || metadata.google_form_url || null,
  };
}

// GET: Fetch all formations (draft and published)
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    let rawFormations: any[] = [];

    // Query activities
    const { data, error } = await (client as any)
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      rawFormations = data.filter(
        (a: any) =>
          a.type === "formation" ||
          a.category === "Formation" ||
          (a.content && a.content.includes("_is_formation_meta"))
      );
    }

    const formations = rawFormations.map(parseFormationRecord);
    return NextResponse.json({ formations });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des formations." },
      { status: 500 }
    );
  }
}

// POST: Create a new training / formation
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
      trainer_name,
      location,
      date_start,
      date_end,
      capacity,
      cover_image_url,
      google_form_url,
      training_material_url,
      prerequisites,
      status = "published",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre de la formation est requis." }, { status: 400 });
    }

    const cleanDateStart = date_start || new Date().toISOString();

    const metaContent = JSON.stringify({
      _is_formation_meta: true,
      trainer_name: trainer_name?.trim() || null,
      prerequisites: prerequisites?.trim() || null,
      training_material_url: training_material_url?.trim() || null,
      google_form_url: google_form_url?.trim() || null,
      date_end: date_end || null,
    });

    // Attempt 1: Standard Schema A
    let payload: Record<string, any> = {
      type: "formation",
      title: title.trim(),
      description: description?.trim() || "",
      trainer_name: trainer_name?.trim() || null,
      location: location?.trim() || null,
      date_start: cleanDateStart,
      date_end: date_end || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      cover_image_url: cover_image_url || null,
      training_material_url: training_material_url?.trim() || null,
      prerequisites: prerequisites?.trim() || null,
      google_form_url: google_form_url?.trim() || null,
      status: status || "published",
      created_by: user.id,
    };

    let result = await (client as any)
      .from("activities")
      .insert(payload)
      .select()
      .single();

    // If google_form_url or other column missing in Schema A, retry without it
    if (result.error && (result.error.message?.includes("google_form_url") || result.error.code === "42703")) {
      delete payload.google_form_url;
      result = await (client as any)
        .from("activities")
        .insert(payload)
        .select()
        .single();
    }

    // Attempt 2: If Schema B (category / date / content / image_url based)
    if (result.error && (result.error.message?.includes("type") || result.error.message?.includes("date_start") || result.error.message?.includes("column") || result.error.code === "42703")) {
      const fallbackPayload: Record<string, any> = {
        title: title.trim(),
        description: description?.trim() || "",
        category: "Formation",
        location: location?.trim() || null,
        date: cleanDateStart,
        image_url: cover_image_url || null,
        content: metaContent,
        status: status || "published",
        created_by: user.id,
      };

      result = await (client as any)
        .from("activities")
        .insert(fallbackPayload)
        .select()
        .single();
    }

    if (result.error) {
      console.error("[FORMATION CREATE ERROR]", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const formation = parseFormationRecord(result.data);

    // Notify members non-blocking
    if (status === "published") {
      notifyMembers(
        client,
        "Nouvelle Formation Professionnelle 🎓",
        `La formation "${title}" est disponible. Développez vos compétences !`,
        "/membre/formations"
      ).catch((e) => console.warn(e));
    }

    return NextResponse.json({ success: true, formation });
  } catch (err: any) {
    console.error("[FORMATION POST EXCEPTION]", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création de la formation." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing training / formation
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { id, status, trainer_name, prerequisites, training_material_url, google_form_url, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Identifiant de la formation requis." }, { status: 400 });
    }

    // Check old status
    const { data: existing } = await (client as any)
      .from("activities")
      .select("status, title, content")
      .eq("id", id)
      .single();

    let existingMeta: Record<string, any> = {};
    if (existing?.content) {
      try {
        const parsed = JSON.parse(existing.content);
        if (parsed && typeof parsed === "object") existingMeta = parsed;
      } catch (_) {}
    }

    const updatedMeta = JSON.stringify({
      ...existingMeta,
      _is_formation_meta: true,
      ...(trainer_name !== undefined ? { trainer_name: trainer_name?.trim() || null } : {}),
      ...(prerequisites !== undefined ? { prerequisites: prerequisites?.trim() || null } : {}),
      ...(training_material_url !== undefined ? { training_material_url: training_material_url?.trim() || null } : {}),
      ...(google_form_url !== undefined ? { google_form_url: google_form_url?.trim() || null } : {}),
    });

    const updatePayload: Record<string, any> = { ...fields, content: updatedMeta };
    if (status) updatePayload.status = status;
    if (fields.description !== undefined) updatePayload.description = fields.description?.trim() || "";
    if (fields.cover_image_url !== undefined) {
      updatePayload.cover_image_url = fields.cover_image_url;
      updatePayload.image_url = fields.cover_image_url;
    }
    if (fields.date_start !== undefined) {
      updatePayload.date_start = fields.date_start;
      updatePayload.date = fields.date_start;
    }
    if (trainer_name !== undefined) updatePayload.trainer_name = trainer_name?.trim() || null;
    if (prerequisites !== undefined) updatePayload.prerequisites = prerequisites?.trim() || null;
    if (training_material_url !== undefined) updatePayload.training_material_url = training_material_url?.trim() || null;
    if (google_form_url !== undefined) updatePayload.google_form_url = google_form_url?.trim() || null;

    let result = await (client as any)
      .from("activities")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // Fallback if missing columns
    if (result.error && (result.error.message?.includes("column") || result.error.message?.includes("does not exist") || result.error.code === "42703" || result.error.code === "PGRST204")) {
      delete updatePayload.trainer_name;
      delete updatePayload.prerequisites;
      delete updatePayload.training_material_url;
      delete updatePayload.google_form_url;
      delete updatePayload.type;
      delete updatePayload.date_start;
      delete updatePayload.date_end;
      delete updatePayload.cover_image_url;

      result = await (client as any)
        .from("activities")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    const updatedFormation = parseFormationRecord(result.data);

    // Notify if status changed from draft to published in background
    if (existing?.status === "draft" && status === "published") {
      notifyMembers(
        client,
        "Nouvelle Formation Professionnelle 🎓",
        `La formation "${updatedFormation.title}" est maintenant ouverte aux inscriptions !`,
        "/membre/formations"
      ).catch((e) => console.warn(e));
    }

    return NextResponse.json({ success: true, formation: updatedFormation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a formation
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
