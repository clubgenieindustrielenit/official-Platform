import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function POST(request: Request) {
  try {
    // Admin-only — bureau members cannot delete users
    const auth = await verifyCanManage(true);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "L'identifiant du membre est requis." },
        { status: 400 }
      );
    }

    // deleteUser removes the row from auth.users.
    // profiles.id has ON DELETE CASCADE, so the profile row is wiped automatically.
    const { error } = await (client as any).auth.admin.deleteUser(user_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression du membre." },
      { status: 500 }
    );
  }
}
