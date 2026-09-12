import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function POST(request: Request) {
  try {
    // 1. Auth & permission check (Admin or Bureau)
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { user_id, pole_ids, pole_id, award_points = false, points_amount = 5 } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "L'identifiant du membre est requis." },
        { status: 400 }
      );
    }

    // 2. Fetch current member profile and poles info
    const { data: currentMember, error: fetchErr } = await (client as any)
      .from("profiles")
      .select("id, first_name, last_name, email, pole_id, pole_ids, points_total")
      .eq("id", user_id)
      .single();

    if (fetchErr || !currentMember) {
      return NextResponse.json(
        { error: "Membre introuvable." },
        { status: 404 }
      );
    }

    // Determine new pole_ids array and primary pole_id
    let newPoleIds: string[] = [];
    if (Array.isArray(pole_ids)) {
      newPoleIds = pole_ids.filter((id: string) => typeof id === "string" && id.trim() !== "");
    } else if (pole_id) {
      newPoleIds = [pole_id];
    }

    const primaryPoleId = newPoleIds.length > 0 ? newPoleIds[0] : (pole_id || null);

    // 3. Update profiles table securely with Service Role
    const { data: updatedProfile, error: updateError } = await (client as any)
      .from("profiles")
      .update({
        pole_ids: newPoleIds,
        pole_id: primaryPoleId,
      })
      .eq("id", user_id)
      .select("id, first_name, last_name, email, role, pole_id, pole_ids, points_total")
      .single();

    if (updateError) {
      console.error("[admin/members/pole] Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Erreur lors de la mise à jour des pôles." },
        { status: 500 }
      );
    }

    // 4. Check if newly added poles exist and optionally award joining points / notify
    const oldPoleIds: string[] = (currentMember.pole_ids && currentMember.pole_ids.length > 0)
      ? currentMember.pole_ids
      : (currentMember.pole_id ? [currentMember.pole_id] : []);

    const newlyAddedPoleIds = newPoleIds.filter((id) => !oldPoleIds.includes(id));

    if (newlyAddedPoleIds.length > 0) {
      // Fetch names of added poles
      const { data: addedPoles } = await (client as any)
        .from("poles")
        .select("id, name")
        .in("id", newlyAddedPoleIds);

      const poleNames = (addedPoles || []).map((p: any) => p.name).join(", ") || "nouveau pôle";

      // If award_points is requested (or by default for new pole assignments)
      if (award_points && points_amount > 0) {
        const totalPointsToAward = points_amount * newlyAddedPoleIds.length;
        const currentPoints = updatedProfile.points_total || 0;

        await (client as any)
          .from("points_log")
          .insert(
            newlyAddedPoleIds.map((pId) => {
              const pName = (addedPoles || []).find((p: any) => p.id === pId)?.name || "Pôle";
              return {
                user_id,
                amount: points_amount,
                reason: `Affectation au ${pName}`,
              };
            })
          );

        await (client as any)
          .from("profiles")
          .update({
            points_total: currentPoints + totalPointsToAward,
          })
          .eq("id", user_id);

        updatedProfile.points_total = currentPoints + totalPointsToAward;
      }

      // Create in-app notification for the member
      await (client as any)
        .from("notifications")
        .insert({
          user_id,
          type: "système",
          title: "Affectation à un pôle",
          message: `Vous avez été affecté(e) au ${poleNames}.`,
          link: "/membre/profil",
          read: false,
        });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      newPoleIds,
      primaryPoleId,
    });
  } catch (err: any) {
    console.error("[admin/members/pole] Unexpected error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
