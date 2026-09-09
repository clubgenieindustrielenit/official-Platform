import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { parseBody, createFeedbackSchema, updateFeedbackStatusSchema } from "@/lib/validation/schemas";
import { Resend } from "resend";

/**
 * POST /api/feedback
 * Soumission d'un bug ou d'une suggestion par un membre authentifié
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const parsed = await parseBody(request, createFeedbackSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { type, description, page_url } = parsed.data;

    // Récupérer le profil du membre pour le contexte
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, role")
      .eq("id", user.id)
      .maybeSingle();

    const { data: newFeedback, error: insertError } = await (supabase as any)
      .from("feedbacks")
      .insert({
        user_id: user.id,
        type,
        description,
        page_url,
        status: "nouveau",
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Erreur lors de l'enregistrement du feedback:", insertError);
      return NextResponse.json(
        { error: "Impossible d'enregistrer le retour pour le moment." },
        { status: 500 }
      );
    }

    // Tentative d'envoi d'alerte email via Resend si configuré (sans bloquer la réponse)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && !resendApiKey.includes("your_api_key")) {
      try {
        const resend = new Resend(resendApiKey);
        const memberName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || user.email;
        const typeEmoji = type === "bug" ? "🐛 Bug" : type === "suggestion" ? "💡 Suggestion" : "📝 Retour";
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Club Génie Industriel ENIT <invites@mail.clubgenieindustrielenit.org>";
        
        await resend.emails.send({
          from: fromEmail,
          to: ["clubgenieindustrielenit@gmail.com"],
          subject: `[${typeEmoji}] Nouveau retour de ${memberName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0d0e12; color: #ffffff; border-radius: 12px;">
              <h2 style="color: #fca311; margin-bottom: 8px;">Nouveau ${typeEmoji}</h2>
              <p style="color: #a0a0a0; font-size: 14px; margin-top: 0;">Reçu depuis la plateforme CGI ENIT</p>
              
              <div style="background-color: #14171e; border: 1px solid #2a2c38; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Auteur :</strong> ${memberName} (${profile?.email || user.email})</p>
                ${profile?.phone ? `<p style="margin: 0 0 10px 0;"><strong>Téléphone :</strong> ${profile.phone}</p>` : ""}
                <p style="margin: 0 0 10px 0;"><strong>Page concernée :</strong> <code>${page_url}</code></p>
                <p style="margin: 0;"><strong>Date :</strong> ${new Date().toLocaleString("fr-FR")}</p>
              </div>

              <div style="background-color: #14171e; border-left: 4px solid #fca311; padding: 16px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; color: #fca311;">Description :</h4>
                <p style="margin: 0; white-space: pre-wrap; line-height: 1.5; color: #e5e7eb;">${description}</p>
              </div>

              <p style="font-size: 12px; color: #6b7280; text-align: center;">
                Ce message a été envoyé automatiquement depuis l'espace membre CGI ENIT.
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn("Échec d'envoi d'email de notification (non bloquant):", emailErr);
      }
    }

    return NextResponse.json({ success: true, feedback: newFeedback }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/feedback error:", err);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}

/**
 * GET /api/feedback
 * Récupération de tous les feedbacks (Admin & Bureau uniquement)
 */
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { data: feedbacks, error } = await (client as any)
      .from("feedbacks")
      .select(`
        *,
        profile:profiles(
          id,
          first_name,
          last_name,
          email,
          phone,
          role,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/feedback error:", error);
      return NextResponse.json(
        { error: "Impossible de récupérer les retours." },
        { status: 500 }
      );
    }

    return NextResponse.json({ feedbacks });
  } catch (err: any) {
    console.error("GET /api/feedback error:", err);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}

/**
 * PATCH /api/feedback
 * Mise à jour du statut d'un feedback (Admin & Bureau uniquement)
 */
export async function PATCH(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const parsed = await parseBody(request, updateFeedbackStatusSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { id, status } = parsed.data;
    const { client } = auth;

    const { data: updated, error } = await (client as any)
      .from("feedbacks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH /api/feedback error:", error);
      return NextResponse.json(
        { error: "Impossible de mettre à jour le statut." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, feedback: updated });
  } catch (err: any) {
    console.error("PATCH /api/feedback error:", err);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}

/**
 * DELETE /api/feedback
 * Suppression d'un feedback (Admin & Bureau uniquement)
 */
export async function DELETE(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis." }, { status: 400 });
    }

    const { client } = auth;
    const { error } = await (client as any).from("feedbacks").delete().eq("id", id);

    if (error) {
      console.error("DELETE /api/feedback error:", error);
      return NextResponse.json(
        { error: "Impossible de supprimer ce feedback." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/feedback error:", err);
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 });
  }
}
