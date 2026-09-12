import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

const cleanUuid = (val: any): string | null => {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed && trimmed !== "null" && trimmed !== "undefined") {
      return trimmed;
    }
  }
  return null;
};

const cleanDate = (val: any): string | null => {
  if (!val) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return null;
    return trimmed.includes("T") ? trimmed.split("T")[0] : trimmed;
  }
  return null;
};

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

    const { title, description, pole_id, lead_id, deadline, google_form_url, member_ids, status, progress } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Le titre du projet est requis." }, { status: 400 });
    }

    const leadIdClean = cleanUuid(lead_id);
    const poleIdClean = cleanUuid(pole_id);
    const deadlineClean = cleanDate(deadline);

    // 1. Insert Project
    const insertPayload: Record<string, any> = {
      title: title.trim(),
      description: description?.trim() || null,
      pole_id: poleIdClean,
      lead_id: leadIdClean,
      deadline: deadlineClean,
      google_form_url: google_form_url?.trim() || null,
      status: status || "planned",
      progress: typeof progress === "number" ? progress : 0,
    };

    let { data: project, error: insertError } = await (client as any)
      .from("projects")
      .insert(insertPayload)
      .select()
      .single();

    // If failed due to missing google_form_url column in DB, retry without it
    if (insertError && (insertError.message?.includes("google_form_url") || insertError.code === "42703")) {
      delete insertPayload.google_form_url;
      const retry = await (client as any)
        .from("projects")
        .insert(insertPayload)
        .select()
        .single();
      project = retry.data;
      insertError = retry.error;
    }

    if (insertError) {
      console.error("[PROJECT CREATE ERROR]", insertError);
      return NextResponse.json({ error: insertError.message || "Erreur lors de la création du projet." }, { status: 500 });
    }

    // 2. Insert Assigned Members
    const assignedIds: string[] = Array.isArray(member_ids)
      ? (Array.from(new Set(member_ids.map(cleanUuid).filter(Boolean))) as string[])
      : [];

    if (leadIdClean && !assignedIds.includes(leadIdClean)) {
      assignedIds.push(leadIdClean);
    }

    if (assignedIds.length > 0 && project?.id) {
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
    console.error("[PROJECT POST EXCEPTION]", err);
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

    const leadIdClean = cleanUuid(lead_id);
    const poleIdClean = cleanUuid(pole_id);
    const deadlineClean = cleanDate(deadline);

    const updatePayload: Record<string, any> = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description?.trim() || null;
    if (pole_id !== undefined) updatePayload.pole_id = poleIdClean;
    if (lead_id !== undefined) updatePayload.lead_id = leadIdClean;
    if (deadline !== undefined) updatePayload.deadline = deadlineClean;
    if (google_form_url !== undefined) updatePayload.google_form_url = google_form_url?.trim() || null;
    if (status !== undefined) updatePayload.status = status;
    if (progress !== undefined) updatePayload.progress = progress;

    let { data: updatedProject, error: updateError } = await (client as any)
      .from("projects")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    // If failed due to missing google_form_url column, retry without it
    if (updateError && (updateError.message?.includes("google_form_url") || updateError.code === "42703")) {
      delete updatePayload.google_form_url;
      const retry = await (client as any)
        .from("projects")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      updatedProject = retry.data;
      updateError = retry.error;
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Sync member assignments if member_ids is provided
    if (Array.isArray(member_ids)) {
      // Remove existing members
      await (client as any).from("project_members").delete().eq("project_id", id);

      const assignedIds: string[] = Array.from(new Set(member_ids.map(cleanUuid).filter(Boolean))) as string[];
      if (leadIdClean && !assignedIds.includes(leadIdClean)) {
        assignedIds.push(leadIdClean);
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

    // 1. Unlink points_log records referencing this project
    try {
      await (client as any)
        .from("points_log")
        .update({ related_project_id: null })
        .eq("related_project_id", id);
    } catch (e) {
      console.warn("Could not nullify points_log related_project_id:", e);
    }

    // 2. Clean up dependent records first
    try {
      await (client as any).from("project_tasks").delete().eq("project_id", id);
    } catch (e) {
      console.warn("Could not delete project_tasks:", e);
    }

    try {
      await (client as any).from("project_members").delete().eq("project_id", id);
    } catch (e) {
      console.warn("Could not delete project_members:", e);
    }

    // 3. Delete the project
    const { error: deleteError } = await (client as any)
      .from("projects")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[PROJECT DELETE ERROR]", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PROJECT DELETE EXCEPTION]", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
