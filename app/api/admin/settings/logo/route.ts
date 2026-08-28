export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { validateImageFile, MAX_LOGO_SIZE_BYTES } from "@/lib/validation/fileUpload";

const BUCKET_NAME = "brand-assets";

// Helper to save logo locally so it works 100% even if Supabase table is not created yet
// H-2 FIX: ext is now derived from the validated magic-byte MIME, not the
// client-supplied file.type, so SVG files cannot be saved as 'svg' even if
// the caller claims a different MIME type.
function saveLocalLogo(buffer: Buffer, ext: string) {
  try {
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const logoFileName = `custom-site-logo.${ext}`;
    const logoFilePath = path.join(publicDir, logoFileName);
    fs.writeFileSync(logoFilePath, buffer);
    // Remove any stale logo files with different extensions
    for (const oldExt of ["png", "jpg", "webp", "gif"]) {
      if (oldExt !== ext) {
        const oldPath = path.join(publicDir, `custom-site-logo.${oldExt}`);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const settingsPath = path.join(publicDir, "site-settings.json");
    const logoUrl = `/${logoFileName}?v=${Date.now()}`;
    fs.writeFileSync(settingsPath, JSON.stringify({ logoUrl }));

    return logoUrl;
  } catch (e) {
    console.error("Local logo save error:", e);
    return null;
  }
}

function getLocalLogo() {
  try {
    const settingsPath = path.join(process.cwd(), "public", "site-settings.json");
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      return data.logoUrl || null;
    }
  } catch (e) {}
  return null;
}

function resetLocalLogo() {
  try {
    const settingsPath = path.join(process.cwd(), "public", "site-settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify({ logoUrl: "/logo-cgi.jpg" }));
  } catch (e) {}
}

async function verifyAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, client: null, error: "Non authentifié." };
  }

  const client = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : serverSupabase;

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role;

  if (role !== "admin") {
    return { isAdmin: false, user, client, error: "Accès refusé. Privilèges Administrateur requis." };
  }

  return { isAdmin: true, user, client };
}

export async function GET() {
  try {
    const localUrl = getLocalLogo();

    // Try Supabase first if available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : await createServerSupabase();

    const { data } = await client
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "site_logo")
      .maybeSingle();

    // If localUrl exists and it's a custom logo, and Supabase is stuck on default, prioritize localUrl
    if (localUrl && localUrl.includes("custom-site-logo") && (!data?.setting_value || data.setting_value === "/logo-cgi.jpg")) {
      return NextResponse.json({ logoUrl: localUrl });
    }

    if (data?.setting_value) {
      return NextResponse.json({ logoUrl: data.setting_value });
    }

    return NextResponse.json({ logoUrl: localUrl || "/logo-cgi.jpg" });
  } catch (err) {
    return NextResponse.json({ logoUrl: getLocalLogo() || "/logo-cgi.jpg" });
  }
}

export async function POST(request: Request) {
  try {
    const { isAdmin, client, error: authError } = await verifyAdmin();
    if (!isAdmin || !client) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // H-2 FIX: Validate file type via magic bytes before any storage operation.
    // This prevents SVG uploads (stored XSS) and MIME-spoofed files.
    const validation = await validateImageFile(file, MAX_LOGO_SIZE_BYTES);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { buffer, detectedMime, extension } = validation;

    // Always save locally first to guarantee 100% success
    const localLogoUrl = saveLocalLogo(buffer, extension);
    let finalLogoUrl = localLogoUrl || `data:${detectedMime};base64,${buffer.toString("base64")}`;

    // Attempt upload to Supabase Storage if bucket exists
    try {
      await client.storage.createBucket(BUCKET_NAME, { public: true }).catch(() => {});
      const fileName = `logo_${Date.now()}.${extension}`;

      const { data: uploadData, error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: detectedMime, // use validated MIME, not client-supplied
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = client.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uploadData.path);
        finalLogoUrl = publicUrlData.publicUrl;
      }
    } catch (stErr) {
      console.warn("Storage upload non-blocking warning:", stErr);
    }

    // Attempt to update site_settings table in Supabase (non-blocking)
    try {
      const { error: dbErr } = await client
        .from("site_settings")
        .upsert({
          setting_key: "site_logo",
          setting_value: finalLogoUrl,
          updated_at: new Date().toISOString(),
        });
      if (dbErr) {
        console.warn("Supabase UPSERT failed:", dbErr);
      }
    } catch (dbErr) {
      console.warn("DB update exception:", dbErr);
    }

    return NextResponse.json({ url: finalLogoUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: error.message || "Erreur lors du téléversement du logo" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { isAdmin, client, error: authError } = await verifyAdmin();
    if (!isAdmin || !client) {
      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 403 });
    }

    resetLocalLogo();

    try {
      await client
        .from("site_settings")
        .upsert({
          setting_key: "site_logo",
          setting_value: "/logo-cgi.jpg",
          updated_at: new Date().toISOString(),
        });
    } catch (dbErr) {
      // Non-blocking
    }

    return NextResponse.json({ url: "/logo-cgi.jpg" }, { status: 200 });
  } catch (error: any) {
    console.error("Logo delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
