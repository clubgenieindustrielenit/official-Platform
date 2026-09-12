import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const serverSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const client = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : serverSupabase;

    const { data: profile } = await (client as any)
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role: string = profile?.role || user.user_metadata?.role || "";

    if (role !== "admin" && role !== "bureau" && role !== "membre_bureau") {
      return NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucketName = (formData.get("bucket") as string) || "testimonials";

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Fichier manquant ou vide." }, { status: 400 });
    }

    try {
      await (client as any).storage.createBucket(bucketName, { public: true });
    } catch (_) {
      // Bucket exists
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await (client as any).storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload] Storage upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: pub } = (client as any).storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: pub.publicUrl });
  } catch (err: any) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erreur upload" }, { status: 500 });
  }
}
