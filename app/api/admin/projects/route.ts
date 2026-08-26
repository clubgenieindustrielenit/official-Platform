import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { isBureauOrAdmin, Role } from "@/lib/types/roles";

async function verifyCanManage(): Promise<
  | { ok: true; user: any; role: Role; client: ReturnType<typeof createClient> }
  | { ok: false; error: string; status: number }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Non authentifié.", status: 401 };
  }

  const client = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : serverSupabase;

  const { data: profile } = await (client as any)
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role: Role = (profile?.role || user.user_metadata?.role || "membre_actif") as Role;

  if (!isBureauOrAdmin(role)) {
    return {
      ok: false,
      error: "Accès refusé. Seuls l'administration et le bureau peuvent gérer les projets.",
      status: 403,
    };
  }

  return { ok: true, user, role, client: client as any };
}

// ---------------------------------------------------------------------------
// GET: Fetch all projects with members, poles, and list of available profiles
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;

    const [projectsRes, polesRes, profilesRes] = await Promise.all([
      (client as any)
        .from("projects")
        .select(`
          *,
          poles (id, name),
          lead:profiles!lead_id (id, first_name, last_name, avatar_url),
          project_members (
            user_id,
            profiles (id, first_name, last_name, avatar_url, role)
          )
        `)
        .order("created_at", { ascending: false }),

      (client as any).from("poles").select("id, name, color, icon").order("name"),

      (client as any)
        .from("profiles")
        .select("id, first_name, last_name, role, pole_id, avatar_url")
        .eq("is_active", true)
        .order("first_name", { ascending: true })
    ]);

    if (projectsRes.error) {
      return NextResponse.json({ error: projectsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      projects: projectsRes.data || [],
      poles: polesRes.data || [],
      profiles: profilesRes.data || []
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des projets." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST: Create a new project and assign members
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();

    const { title, description, pole_id, lead_id, deadline, google_form_url, member_ids } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre du projet est requis." }, { status: 400 });
    }

    // 1. Insert Project
    const { data: project, error: insertError } = await (client as any)
      .from("projects")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        pole_id: pole_id || null,
        lead_id: lead_id || null,
        deadline: deadline || null,
        google_form_url: google_form_url?.trim() || null,
        status: "planned",
        progress: 0
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. Insert Assigned Members
    const assignedIds: string[] = Array.isArray(member_ids) ? member_ids : [];
    if (lead_id && !assignedIds.includes(lead_id)) {
      assignedIds.push(lead_id);
    }

    if (assignedIds.length > 0) {
      const memberRows = assignedIds.map((userId) => ({
        project_id: project.id,
        user_id: userId,
        points_awarded: false
      }));

      const { error: membersError } = await (client as any)
        .from("project_members")
        .insert(memberRows);

      if (membersError) {
        console.error("Error inserting project members:", membersError);
      }
    }

    return NextResponse.json({ success: true, project });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création du projet." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT: Update an existing project & member assignments
// ---------------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { id, title, description, pole_id, lead_id, deadline, google_form_url, status, progress, member_ids } = body;

    if (!id) {
      return NextResponse.json({ error: "Identifiant du projet requis." }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (pole_id !== undefined) updatePayload.pole_id = pole_id || null;
    if (lead_id !== undefined) updatePayload.lead_id = lead_id || null;
    if (deadline !== undefined) updatePayload.deadline = deadline || null;
    if (google_form_url !== undefined) updatePayload.google_form_url = google_form_url?.trim() || null;
    if (status !== undefined) updatePayload.status = status;
    if (progress !== undefined) updatePayload.progress = progress;

    const { data: updatedProject, error: updateError } = await (client as any)
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sync member assignments if member_ids is provided
    if (Array.isArray(member_ids)) {
      // Remove existing members
      await (client as any).from("project_members").delete().eq("project_id", id);

      const assignedIds: string[] = [...member_ids];
      if (lead_id && !assignedIds.includes(lead_id)) {
        assignedIds.push(lead_id);
      }

      if (assignedIds.length > 0) {
        const memberRows = assignedIds.map((userId) => ({
          project_id: id,
          user_id: userId,
          points_awarded: false
        }));
        await (client as any).from("project_members").insert(memberRows);
      }
    }

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: Delete a project
// ---------------------------------------------------------------------------
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
      return NextResponse.json({ error: "Identifiant du projet requis." }, { status: 400 });
    }

    // Clean up dependent records first
    await (client as any).from("project_tasks").delete().eq("project_id", id);
    await (client as any).from("project_members").delete().eq("project_id", id);

    const { error: deleteError } = await (client as any)
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
