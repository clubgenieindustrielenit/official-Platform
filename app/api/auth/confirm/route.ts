import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * GET /api/auth/confirm?token_hash=...&type=recovery&next=/reset-password
 *
 * Verifies a Supabase token_hash (used in password-reset emails) and
 * redirects the user to the `next` page with an active session.
 *
 * We build the email link ourselves in reset-password-request/route.ts
 * pointing here, so it always uses the production URL — bypassing the
 * Supabase "Site URL" dashboard setting (which may still be localhost).
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = (requestUrl.searchParams.get("type") as EmailOtpType) || "recovery";
  const next = requestUrl.searchParams.get("next") || "/reset-password";

  if (!token_hash) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_token`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=invalid_or_expired_link`
    );
  }

  // Redirect to target page (e.g. /reset-password) — user now has an active session
  const redirectTo = next.startsWith("/") ? `${requestUrl.origin}${next}` : next;
  return NextResponse.redirect(redirectTo);
}
