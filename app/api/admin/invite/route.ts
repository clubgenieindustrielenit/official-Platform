import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { Resend } from "resend";
import { inviteSchema, parseBody } from "@/lib/validation/schemas";
import { generateInviteEmailHtml } from "@/lib/email/inviteEmailTemplate";

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

    // Map role to valid DB check constraint value ('membre_actif' | 'membre_bureau')
    const dbRole = role === "membre_bureau" ? "membre_bureau" : "membre_actif";

    const { data: newInvite, error: insertError } = await (client as any)
      .from("invitations")
      .insert({
        email: cleanEmail,
        role: dbRole,
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
      (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
      "http://localhost:3000";
    const roleParam = role && role !== "membre_actif" ? `?role=${encodeURIComponent(role)}` : "";
    const inviteLink = `${appUrl}/invite/${token}${roleParam}`;

    // ── 6. Send email via Resend ────────────────────────────────────────────
    // Cost/Abuse FIX: Email is only sent AFTER auth is confirmed and the
    // invitation is persisted. The auth gate above prevents anonymous abuse.
    let emailSent = false;
    let resendError = null;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const fromEmail = process.env.RESEND_FROM_EMAIL || "Club Génie Industriel ENIT <invites@mail.clubgenieindustrielenit.org>";

        const emailHtml = generateInviteEmailHtml({
          email: cleanEmail,
          role,
          inviteLink,
          duration,
          appUrl,
        });

        const { error: mailErr } = await resend.emails.send({
          from: fromEmail,
          to: [cleanEmail],
          subject: "Invitation Officielle — Club Génie Industriel ENIT",
          html: emailHtml,
        });

        if (!mailErr) {
          emailSent = true;
        } else {
          console.error("[invite] Resend error:", mailErr);
          resendError = mailErr.message || JSON.stringify(mailErr);
        }
      } catch (err: any) {
        console.error("[invite] Resend exception:", err);
        resendError = err?.message || "Échec de l'envoi de l'email.";
      }
    } else {
      resendError = "RESEND_API_KEY non configurée sur le serveur.";
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
