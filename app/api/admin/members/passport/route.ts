import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function GET(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id est requis." }, { status: 400 });
    }

    // 1. Fetch Profile + Pole
    const { data: profile, error: profError } = await (client as any)
      .from("profiles")
      .select(`
        *,
        poles:pole_id (id, name, color)
      `)
      .eq("id", userId)
      .single();

    if (profError || !profile) {
      return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
    }

    // Fetch all assigned poles
    let assignedPoles: any[] = [];
    const allPoleIds: string[] =
      profile.pole_ids && profile.pole_ids.length > 0
        ? profile.pole_ids
        : profile.pole_id
        ? [profile.pole_id]
        : [];

    if (allPoleIds.length > 0) {
      const { data: pData } = await (client as any)
        .from("poles")
        .select("id, name, color, icon")
        .in("id", allPoleIds);
      assignedPoles = pData || [];
    }

    const enhancedProfile = {
      ...profile,
      assigned_poles: assignedPoles,
    };

    // 2. Fetch Activity Registrations (Visites, Formations, Evénements)
    const { data: registrations } = await (client as any)
      .from("event_registrations")
      .select(`
        id,
        activity_id,
        status,
        attended,
        created_at,
        activities (
          id,
          title,
          type,
          entreprise,
          trainer_name,
          date_start,
          location
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 3. Fetch Projects (as member or lead)
    const { data: projectMemberships } = await (client as any)
      .from("project_members")
      .select(`
        joined_at,
        projects (
          id,
          title,
          description,
          status,
          progress,
          deadline,
          lead_id,
          poles (name)
        )
      `)
      .eq("user_id", userId);

    const { data: ledProjects } = await (client as any)
      .from("projects")
      .select(`
        id,
        title,
        description,
        status,
        progress,
        deadline,
        lead_id,
        poles (name)
      `)
      .eq("lead_id", userId);

    // Combine and deduplicate projects
    const allProjectsMap = new Map();
    (projectMemberships || []).forEach((pm: any) => {
      if (pm.projects) {
        allProjectsMap.set(pm.projects.id, {
          ...pm.projects,
          is_lead: pm.projects.lead_id === userId,
          joined_at: pm.joined_at,
        });
      }
    });
    (ledProjects || []).forEach((lp: any) => {
      if (!allProjectsMap.has(lp.id)) {
        allProjectsMap.set(lp.id, {
          ...lp,
          is_lead: true,
        });
      }
    });

    // 4. Fetch Points History
    const { data: pointsLog } = await (client as any)
      .from("points_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Format activities by type
    const visits = (registrations || [])
      .filter((r: any) => r.activities?.type === "visit")
      .map((r: any) => ({
        id: r.id,
        activity_id: r.activity_id,
        title: r.activities?.title,
        entreprise: r.activities?.entreprise,
        date: r.activities?.date_start,
        status: r.status,
        attended: r.attended,
      }));

    const formations = (registrations || [])
      .filter((r: any) => r.activities?.type === "formation")
      .map((r: any) => ({
        id: r.id,
        activity_id: r.activity_id,
        title: r.activities?.title,
        trainer_name: r.activities?.trainer_name,
        date: r.activities?.date_start,
        status: r.status,
        attended: r.attended,
      }));

    const otherEvents = (registrations || [])
      .filter((r: any) => r.activities?.type === "event")
      .map((r: any) => ({
        id: r.id,
        activity_id: r.activity_id,
        title: r.activities?.title,
        date: r.activities?.date_start,
        status: r.status,
        attended: r.attended,
      }));

    return NextResponse.json({
      profile: enhancedProfile,
      visits,
      formations,
      otherEvents,
      projects: Array.from(allProjectsMap.values()),
      pointsLog: pointsLog || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération du passeport." },
      { status: 500 }
    );
  }
}
