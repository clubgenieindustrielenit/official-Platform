import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

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

// GET: List all resources
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { data: resources, error } = await (client as any)
      .from("resources")
      .select(`
        *,
        uploader:profiles!resources_uploaded_by_fkey (id, first_name, last_name, avatar_url),
        poles (id, name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resources: resources || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des ressources." },
      { status: 500 }
    );
  }
}

// POST: Create a new resource
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client, user } = auth;
    const body = await request.json();
    const { title, description, category, academic_year, file_url, drive_url, pole_id } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre de la ressource est requis." }, { status: 400 });
    }

    if (!file_url && !drive_url) {
      return NextResponse.json({ error: "Veuillez fournir un fichier ou un lien Google Drive." }, { status: 400 });
    }

    const { data: resource, error } = await (client as any)
      .from("resources")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "autre",
        academic_year: academic_year || "1ère année GI",
        file_url: file_url || drive_url,
        drive_url: drive_url?.trim() || null,
        pole_id: pole_id || null,
        uploaded_by: user.id,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Notify all active members about new resource
    await notifyMembers(
      client,
      "Nouvelle Ressource Partagée 📚",
      `Le document "${title}" a été ajouté dans l'espace ressources (${academic_year || "GI"}).`,
      "/membre/ressources"
    );

    return NextResponse.json({ success: true, resource });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création de la ressource." },
      { status: 500 }
    );
  }
}

// PUT: Update resource
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { id, title, description, category, academic_year, file_url, drive_url, pole_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (category !== undefined) updatePayload.category = category;
    if (academic_year !== undefined) updatePayload.academic_year = academic_year;
    if (file_url !== undefined) updatePayload.file_url = file_url;
    if (drive_url !== undefined) updatePayload.drive_url = drive_url;
    if (pole_id !== undefined) updatePayload.pole_id = pole_id || null;

    const { data: updatedResource, error } = await (client as any)
      .from("resources")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, resource: updatedResource });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

// DELETE: Delete resource
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

    const { error } = await (client as any).from("resources").delete().eq("id", id);
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
