import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;

    // 1. Fetch poles for mapping
    const { data: poles } = await (client as any).from("poles").select("id, name");
    const polesMap = new Map((poles || []).map((p: any) => [p.id, p.name]));

    // 2. Members overview
    const { data: allMembers } = await (client as any)
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, role, pole_id, pole_ids, points_total, statut_membre, statut_membre_verified, profile_completed_at, is_active, joined_at, cv_url, linkedin_url, year, classe, prepa_etablissement");

    const members = allMembers || [];
    const totalMembers = members.length;
    const activeMembers = members.filter((m: any) => m.is_active).length;
    const avgPoints = totalMembers > 0
      ? Math.round(members.reduce((sum: number, m: any) => sum + (m.points_total || 0), 0) / totalMembers)
      : 0;
    const profileCompletionRate = totalMembers > 0
      ? Math.round((members.filter((m: any) => m.profile_completed_at).length / totalMembers) * 100)
      : 0;

    // Advanced CV & LinkedIn metrics
    const cvMembersCount = members.filter((m: any) => Boolean(m.cv_url)).length;
    const linkedinMembersCount = members.filter((m: any) => Boolean(m.linkedin_url)).length;
    const cvRate = totalMembers > 0 ? Math.round((cvMembersCount / totalMembers) * 100) : 0;
    const linkedinRate = totalMembers > 0 ? Math.round((linkedinMembersCount / totalMembers) * 100) : 0;

    // Statut breakdown
    const statutBreakdown = {
      actif: members.filter((m: any) => m.statut_membre === "actif").length,
      senior: members.filter((m: any) => m.statut_membre === "senior").length,
      alumni: members.filter((m: any) => m.statut_membre === "alumni").length,
      non_renseigne: members.filter((m: any) => !m.statut_membre).length,
    };

    // Prepa breakdown
    const prepaCounts: Record<string, number> = {};
    members.forEach((m: any) => {
      if (m.prepa_etablissement) {
        const prep = m.prepa_etablissement.trim();
        prepaCounts[prep] = (prepaCounts[prep] || 0) + 1;
      }
    });
    const prepaBreakdown = Object.entries(prepaCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Promotion / Class breakdown
    const classCounts: Record<string, number> = {};
    members.forEach((m: any) => {
      const cls = m.classe || m.year || "Non renseigné";
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });
    const classBreakdown = Object.entries(classCounts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // 3. Complete leaderboard of ALL members ranked by points
    const fullLeaderboard = [...members]
      .sort((a: any, b: any) => (b.points_total || 0) - (a.points_total || 0))
      .map((m: any, idx: number) => {
        const memberPoleIds: string[] = (m.pole_ids && m.pole_ids.length > 0)
          ? m.pole_ids
          : (m.pole_id ? [m.pole_id] : []);
        const memberPoleNames: string[] = memberPoleIds
          .map((id) => polesMap.get(id))
          .filter(Boolean) as string[];

        return {
          rank: idx + 1,
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          avatar_url: m.avatar_url,
          points_total: m.points_total || 0,
          pole_id: m.pole_id,
          pole_ids: memberPoleIds,
          pole_name: memberPoleNames.join(", ") || (m.pole_id ? polesMap.get(m.pole_id) || "Autre" : null),
          pole_names: memberPoleNames,
          statut_membre: m.statut_membre,
          role: m.role,
          is_active: m.is_active,
        };
      });

    // 4. Points distribution histogram
    const pointsBuckets = [0, 10, 25, 50, 100, 200, 500];
    const pointsDistribution = pointsBuckets.map((min, idx) => {
      const max = pointsBuckets[idx + 1] || Infinity;
      const label = max === Infinity ? `${min}+` : `${min}-${max - 1}`;
      const count = members.filter((m: any) => {
        const pts = m.points_total || 0;
        return pts >= min && pts < max;
      }).length;
      return { range: label, count };
    });

    // 5. Points over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentLogs } = await (client as any)
      .from("points_log")
      .select("amount, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const dailyPoints: Record<string, number> = {};
    (recentLogs || []).forEach((log: any) => {
      const day = new Date(log.created_at).toISOString().slice(0, 10);
      dailyPoints[day] = (dailyPoints[day] || 0) + (log.amount || 0);
    });

    const pointsTimeline = Object.entries(dailyPoints)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, total }));

    // 6. Poles breakdown
    const poleStats = (poles || []).map((pole: any) => {
      const poleMembers = members.filter((m: any) =>
        (m.pole_ids && Array.isArray(m.pole_ids) && m.pole_ids.includes(pole.id)) ||
        m.pole_id === pole.id
      );
      const totalPts = poleMembers.reduce((sum: number, m: any) => sum + (m.points_total || 0), 0);
      return {
        id: pole.id,
        name: pole.name,
        memberCount: poleMembers.length,
        totalPoints: totalPts,
        avgPoints: poleMembers.length > 0 ? Math.round(totalPts / poleMembers.length) : 0,
      };
    }).sort((a: any, b: any) => b.totalPoints - a.totalPoints);

    // 7. Activities & engagement summary
    const { count: formationsCount } = await (client as any).from("formations").select("id", { count: "exact", head: true });
    const { count: visitesCount } = await (client as any).from("visites").select("id", { count: "exact", head: true });
    const { count: projectsCount } = await (client as any).from("projects").select("id", { count: "exact", head: true });
    const { count: eventRegistrationsCount } = await (client as any).from("event_registrations").select("id", { count: "exact", head: true });

    return NextResponse.json({
      kpis: {
        totalMembers,
        activeMembers,
        avgPoints,
        profileCompletionRate,
        cvMembersCount,
        cvRate,
        linkedinMembersCount,
        linkedinRate,
        statutBreakdown,
      },
      activities: {
        formations: formationsCount || 0,
        visites: visitesCount || 0,
        projects: projectsCount || 0,
        eventRegistrations: eventRegistrationsCount || 0,
      },
      top10: fullLeaderboard.slice(0, 10),
      leaderboard: fullLeaderboard,
      pointsDistribution,
      pointsTimeline,
      poleStats,
      prepaBreakdown,
      classBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des statistiques." },
      { status: 500 }
    );
  }
}
