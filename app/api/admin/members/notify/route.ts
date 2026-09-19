import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { user_id, title, message, link = "/dashboard", type = "système" } = body;

    if (!user_id || !message?.trim()) {
      return NextResponse.json(
        { error: "L'identifiant du membre et le message sont requis." },
        { status: 400 }
      );
    }

    const { data: notification, error: notifError } = await (client as any)
      .from("notifications")
      .insert({
        user_id,
        type,
        title: title?.trim() || "Message du Bureau CGI-ENIT",
        message: message.trim(),
        link,
        read: false,
      })
      .select()
      .single();

    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'envoi de la notification." },
      { status: 500 }
    );
  }
}
