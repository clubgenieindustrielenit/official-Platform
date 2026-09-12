import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function POST(request: Request) {
  try {
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

    console.log("[DELETE API] Request to delete:", user_id);
    const { data, error } = await (client as any).auth.admin.deleteUser(user_id);
    console.log("[DELETE API] Result for", user_id, ":", { data, error });

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
