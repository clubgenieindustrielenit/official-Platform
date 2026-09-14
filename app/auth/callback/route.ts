import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (next) {
        return NextResponse.redirect(`${requestUrl.origin}${next}`);
      }

      // Fetch profile role for smart redirection
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = profile?.role || data.user.user_metadata?.role || "membre_actif";

      // Cache role in user_metadata if not present or changed
      if (data.user.user_metadata?.role !== role) {
        await supabase.auth.updateUser({
          data: { role },
        }).catch(() => {});
      }

      let destination = "/membre";
      if (role === "admin") {
        destination = "/admin";
      } else if (role === "bureau" || role === "membre_bureau") {
        destination = "/bureau";
      }

      return NextResponse.redirect(`${requestUrl.origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`);
}
