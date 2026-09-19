import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generateResetPasswordEmailHtml } from "@/lib/email/resetPasswordTemplate";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Veuillez renseigner une adresse email valide." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // Resolve base App URL
    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (request.headers.get("x-forwarded-proto") && request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "https://clubgenieindustrielenit.org");

    const redirectTo = `${appUrl}/reset-password`;

    // 1. If Service Role Key is available, generate action link
    if (serviceRoleKey) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      
      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: cleanEmail,
        options: {
          redirectTo,
        },
      });

      if (!linkErr && linkData?.properties?.action_link) {
        // Extract token_hash and type from the Supabase action link,
        // then build our own link pointing directly to the production app.
        // This bypasses the Supabase "Site URL" dashboard setting (which may be localhost).
        let actionLink = linkData.properties.action_link;
        try {
          const supabaseUrl = new URL(actionLink);
          const tokenHash = supabaseUrl.searchParams.get("token_hash") || linkData.properties.hashed_token;
          const linkType = supabaseUrl.searchParams.get("type") || "recovery";
          if (tokenHash) {
            // Build link directly to our confirm route so it never touches localhost
            actionLink = `${appUrl}/api/auth/confirm?token_hash=${tokenHash}&type=${linkType}&next=/reset-password`;
          }
        } catch {
          // If URL parsing fails, fall back to original action_link
        }

        // If Resend API Key is available, send branded email directly (bypasses Supabase SMTP rate limits completely)
        if (resendApiKey) {
          try {
            const resend = new Resend(resendApiKey);
            const fromEmail =
              process.env.RESEND_FROM_EMAIL ||
              "Club Génie Industriel ENIT <noreply@mail.clubgenieindustrielenit.org>";

            const html = generateResetPasswordEmailHtml({
              email: cleanEmail,
              resetLink: actionLink,
              appUrl,
            });

            const { error: resendErr } = await resend.emails.send({
              from: fromEmail,
              to: [cleanEmail],
              subject: "Réinitialisation de votre mot de passe — CGI ENIT",
              html,
            });

            if (!resendErr) {
              return NextResponse.json({
                success: true,
                message: "Un email contenant le lien de réinitialisation a été envoyé.",
              });
            }
            console.warn("[reset-password] Resend failed, falling back:", resendErr);
          } catch (resendEx) {
            console.warn("[reset-password] Resend exception, falling back:", resendEx);
          }
        }
      }
    }

    // 2. Standard Supabase client fallback
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const publicClient = createClient(supabaseUrl, anonKey);

    const { error: resetErr } = await publicClient.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    if (resetErr) {
      const msg = (resetErr.message || "").toLowerCase();
      if (
        msg.includes("rate limit") ||
        msg.includes("too many requests") ||
        resetErr.status === 429
      ) {
        return NextResponse.json(
          {
            error:
              "Un email de réinitialisation vous a déjà été envoyé très récemment. Veuillez vérifier votre boîte de réception (et vos spams) ou patienter 60 secondes avant de réessayer.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: resetErr.message || "Impossible d'envoyer l'email de réinitialisation." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Un email contenant le lien de réinitialisation a été envoyé.",
    });
  } catch (err: any) {
    console.error("[reset-password-request] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur lors du traitement de la demande." },
      { status: 500 }
    );
  }
}
