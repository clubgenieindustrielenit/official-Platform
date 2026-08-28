import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { Resend } from "resend";
import { inviteSchema, parseBody } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    // ── 1. Auth & Role Guard ────────────────────────────────────────────────
    // C-1 FIX: Route was completely unauthenticated. Any anonymous caller could
    // create invitations with any role, including "admin". Now requires an
    // authenticated session with admin or bureau role before proceeding.
    const auth = await verifyCanManage(); // bureau or admin
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client, user } = auth;

    // ── 2. Input Validation ─────────────────────────────────────────────────
    // Use Zod schema with .strict() — unknown fields are rejected.
    const parsed = await parseBody(request, inviteSchema);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }

    const { email, role, duration } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();

    // ── 3. Business Logic Checks ────────────────────────────────────────────
    const { data: existingProfile } = await client
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: `L'email ${cleanEmail} appartient déjà à un membre du club.` },
        { status: 400 }
      );
    }

    const { data: existingInvite } = await client
      .from("invitations")
      .select("id")
      .eq("email", cleanEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return NextResponse.json(
        { error: `Une invitation active existe déjà pour ${cleanEmail}.` },
        { status: 400 }
      );
    }

    // ── 4. Create invitation ────────────────────────────────────────────────
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);
    const token = crypto.randomUUID();

    const { data: newInvite, error: insertError } = await (client as any)
      .from("invitations")
      .insert({
        email: cleanEmail,
        role,
        token,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        // M-4 FIX: created_by is sourced from the verified server session,
        // never from the client request body.
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      // M-2 FIX: Never expose raw DB error messages to the client.
      console.error("[invite] Insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'invitation." },
        { status: 500 }
      );
    }

    // ── 5. Build invite link ────────────────────────────────────────────────
    // M-4 FIX: Use the environment variable instead of trusting the
    // attacker-controlled Origin header. A spoofed Origin header could redirect
    // invitation emails to a phishing domain.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
      "http://localhost:3000";
    const inviteLink = `${appUrl}/invite/${token}`;

    // ── 6. Send email via Resend ────────────────────────────────────────────
    // Cost/Abuse FIX: Email is only sent AFTER auth is confirmed and the
    // invitation is persisted. The auth gate above prevents anonymous abuse.
    let emailSent = false;
    let resendError = null;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const roleLabel =
          role === "membre_bureau" ? "Membre du Bureau" : "Membre Actif";

        const { error: mailErr } = await resend.emails.send({
          from: "Club Génie Industriel ENIT <onboarding@resend.dev>",
          to: [cleanEmail],
          subject: "Invitation — Club Génie Industriel ENIT",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8" />
                <title>Invitation CGI ENIT</title>
              </head>
              <body style="background-color: #121414; color: #e2e2e2; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px;">
                <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" style="max-width: 560px; background-color: #14213d; border: 1px solid #333535; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="font-family: monospace; font-size: 11px; font-weight: bold; color: #fca311; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                        CGI ENIT • TERMINAL D'INVITATION
                      </div>
                      <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                        Bienvenue au Club
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #cccccc; font-size: 14px; line-height: 1.6; padding-bottom: 24px;">
                      Bonjour,<br/><br/>
                      Vous avez été officiellement invité(e) à rejoindre la plateforme interne du <strong style="color: #ffffff;">Club Génie Industriel de l'ENIT</strong> avec le rôle de <span style="color: #fca311; font-weight: bold;">${roleLabel}</span>.
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 32px;">
                      <a href="${inviteLink}" target="_blank" style="background-color: #fca311; color: #000000; font-weight: bold; font-family: monospace; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 8px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(252, 163, 17, 0.3);">
                        Finaliser mon compte &rarr;
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #888888; font-size: 12px; line-height: 1.5; border-top: 1px solid #2a2c2c; padding-top: 20px;">
                      <p style="margin: 0 0 8px 0;">Ce lien d'invitation est valable pendant <strong style="color: #ffffff;">${duration} jours</strong>.</p>
                      <p style="margin: 0; font-size: 11px; color: #666666;">Si le bouton ne fonctionne pas, copiez et collez cette URL dans votre navigateur :<br/>
                        <a href="${inviteLink}" style="color: #fca311; text-decoration: underline; word-break: break-all;">${inviteLink}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top: 24px; font-family: monospace; font-size: 10px; color: #555555; text-transform: uppercase; letter-spacing: 1px;">
                      © ${new Date().getFullYear()} Club Génie Industriel — ENIT
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        });

        if (!mailErr) {
          emailSent = true;
        } else {
          // Log detailed error server-side only
          console.error("[invite] Resend error:", mailErr);
          resendError = "Échec de l'envoi de l'email.";
        }
      } catch (err: unknown) {
        console.error("[invite] Resend exception:", err);
        resendError = "Échec de l'envoi de l'email.";
      }
    }

    return NextResponse.json({
      success: true,
      invitation: newInvite,
      inviteLink,
      emailSent,
      resendError,
    });
  } catch (err: unknown) {
    // M-2 FIX: Log full error server-side, return generic message to client.
    console.error("[invite] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation." },
      { status: 500 }
    );
  }
}
