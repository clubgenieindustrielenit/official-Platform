import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";

export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
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
