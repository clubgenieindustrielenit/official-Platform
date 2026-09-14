import { NextResponse } from "next/server";
import { verifyCanManage } from "@/lib/supabase/adminAuth";
import { compressImageBuffer } from "@/lib/utils/serverImageCompressor";

export const dynamic = "force-dynamic";
export const revalidate = 0;
/**
 * Uploads multiple files to activity-images storage bucket.
 * Compresses images on the server before storage (preserves aspect ratio, no crop).
 * Returns array of public URLs.
 */
async function uploadFiles(
  files: File[],
  client: any
): Promise<string[]> {
  const urls: string[] = [];
  if (!client || !client.storage) return urls;

  try {
    await client.storage.createBucket("activity-images", { public: true }).catch(() => {});
  } catch (_) {
    // Bucket likely already exists
  }

  for (const file of files) {
    if (!file || file.size === 0) continue;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawBuffer = Buffer.from(arrayBuffer);

      // Compress using server-side utility with fallback
      let buffer = rawBuffer;
      let contentType = file.type || "image/jpeg";
      let extension = (file.name && file.name.includes('.')) ? file.name.split('.').pop()! : "jpg";

      try {
        const compressed = await compressImageBuffer(rawBuffer);
        if (compressed?.buffer) {
          buffer = Buffer.from(compressed.buffer);
          contentType = compressed.contentType || contentType;
          extension = compressed.extension || extension;
        }
      } catch (cErr) {
        console.warn("[activities upload] compression fallback:", cErr);
      }

      const fileName = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
      const filePath = `activities/${fileName}`;

      const { error: uploadError } = await client.storage
        .from("activity-images")
        .upload(filePath, buffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error("[activities upload] Storage error:", uploadError);
      } else {
        const { data: pub } = client.storage
          .from("activity-images")
          .getPublicUrl(filePath);
        if (pub?.publicUrl) urls.push(pub.publicUrl);
      }
    } catch (uploadErr) {
      console.error("[activities upload] Processing error:", uploadErr);
    }
  }

  return urls;
}

// ---------------------------------------------------------------------------
// GET: Fetch all activities for admin/bureau view (all statuses)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: activities, error } = await auth.client
      .from("activities")
      .select("*")
      // Only manage social posts here (created via PostCreatorModal).
      // Événements/visites/formations are in their own dedicated admin panels.
      .eq("source", "post")
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des activités." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST: Create a new activity post (admin + bureau)
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, client } = auth;
    const contentType = request.headers.get("content-type") || "";

    let title = "";
    let description = "";
    let content = "";
    let category = "Workshop";
    let date = new Date().toISOString();
    let location = "";
    let status = "published";
    let photoUrls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = (formData.get("title") as string) || "";
      description = (formData.get("description") as string) || "";
      content = (formData.get("content") as string) || "";
      category = (formData.get("category") as string) || "Workshop";
      date = (formData.get("date") as string) || new Date().toISOString();
      location = (formData.get("location") as string) || "";
      status = (formData.get("status") as string) || "published";

      // Collect files: file_0, file_1, file_2, ... or legacy "file"
      const files: File[] = [];
      for (let i = 0; i < 10; i++) {
        const f = formData.get(`file_${i}`) as File | null;
        if (f && f.size > 0) files.push(f);
      }
      // Legacy single file fallback
      const legacyFile = formData.get("file") as File | null;
      if (legacyFile && legacyFile.size > 0 && files.length === 0) {
        files.push(legacyFile);
      }

      // Existing URL strings (e.g. if admin pastes URLs)
      const existingUrlsRaw = (formData.get("photo_urls") as string) || "";
      if (existingUrlsRaw) {
        try {
          const parsed = JSON.parse(existingUrlsRaw);
          if (Array.isArray(parsed)) photoUrls = parsed;
        } catch (_) {
          if (existingUrlsRaw.startsWith("http")) photoUrls = [existingUrlsRaw];
        }
      }

      const uploaded = await uploadFiles(files, client);
      photoUrls = [...photoUrls, ...uploaded];
    } else {
      const body = await request.json();
      title = body.title || "";
      description = body.description || "";
      content = body.content || "";
      category = body.category || "Workshop";
      date = body.date || new Date().toISOString();
      location = body.location || "";
      status = body.status || "published";
      photoUrls = Array.isArray(body.photo_urls) ? body.photo_urls : [];
      // Legacy single image_url
      if (body.imageUrl && photoUrls.length === 0) photoUrls = [body.imageUrl];
    }

    if (!title.trim() || !description.trim()) {
      return NextResponse.json(
        { error: "Le titre et la description sont requis." },
        { status: 400 }
      );
    }

    const finalDescription = content && content.trim() && content.trim() !== description.trim()
      ? `${description.trim()}\n\n${content.trim()}`
      : description.trim();

    const imageUrl = photoUrls[0] || null;
    // Normalize date to a valid ISO datetime string
    const normalizedDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const { data: newActivity, error: insertError } = await (client as any)
      .from("activities")
      .insert({
        title: title.trim(),
        description: finalDescription,
        category,
        // Social feed posts: source='post', type='event'
        source: "post",
        type: "event",
        date: normalizedDate,
        date_start: normalizedDate,
        location: location || null,
        status: status || "published",
        image_url: imageUrl,
        cover_image_url: imageUrl,
        photo_urls: photoUrls,
        created_by: user?.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[activities POST] Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (err: any) {
    console.error("[activities POST] Exception:", err);
    return NextResponse.json(
      { error: err.stack || err.message || "Erreur lors de la création de l'activité." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT: Update an activity (admin: any; bureau: own only)
// ---------------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, role, client } = auth;
    const contentType = request.headers.get("content-type") || "";

    let id = "";
    let title = "";
    let description = "";
    let content = "";
    let category = "Workshop";
    let date = new Date().toISOString();
    let location = "";
    let status = "published";
    let photoUrls: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      id = (formData.get("id") as string) || "";
      title = (formData.get("title") as string) || "";
      description = (formData.get("description") as string) || "";
      content = (formData.get("content") as string) || "";
      category = (formData.get("category") as string) || "Workshop";
      date = (formData.get("date") as string) || new Date().toISOString();
      location = (formData.get("location") as string) || "";
      status = (formData.get("status") as string) || "published";

      const existingUrlsRaw = (formData.get("photo_urls") as string) || "";
      if (existingUrlsRaw) {
        try {
          const parsed = JSON.parse(existingUrlsRaw);
          if (Array.isArray(parsed)) photoUrls = parsed;
        } catch (_) {
          if (existingUrlsRaw.startsWith("http")) photoUrls = [existingUrlsRaw];
        }
      }

      const files: File[] = [];
      for (let i = 0; i < 10; i++) {
        const f = formData.get(`file_${i}`) as File | null;
        if (f && f.size > 0) files.push(f);
      }
      const legacyFile = formData.get("file") as File | null;
      if (legacyFile && legacyFile.size > 0 && files.length === 0) files.push(legacyFile);

      const uploaded = await uploadFiles(files, client);
      photoUrls = [...photoUrls, ...uploaded];
    } else {
      const body = await request.json();
      id = body.id;
      title = body.title;
      description = body.description;
      content = body.content;
      category = body.category;
      date = body.date;
      location = body.location;
      status = body.status;
      photoUrls = Array.isArray(body.photo_urls) ? body.photo_urls : [];
      if (body.imageUrl && photoUrls.length === 0) photoUrls = [body.imageUrl];
    }

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis." }, { status: 400 });
    }

    // Bureau / Non-admin members can only update their own posts
    if (role !== "admin") {
      const { data: existing } = await (client as any)
        .from("activities")
        .select("created_by")
        .eq("id", id)
        .maybeSingle();

      if ((existing as any)?.created_by && (existing as any).created_by !== user.id) {
        return NextResponse.json(
          { error: "Vous ne pouvez modifier que vos propres activités." },
          { status: 403 }
        );
      }
    }

    const finalDescription = content && content.trim() && content.trim() !== description.trim()
      ? `${description.trim()}\n\n${content.trim()}`
      : description.trim();

    const imageUrl = photoUrls[0] || null;
    // Normalize date to a valid ISO datetime string
    const normalizedDate = date ? new Date(date).toISOString() : new Date().toISOString();

    const { data: updatedActivity, error: updateError } = await (client as any)
      .from("activities")
      .update({
        title: title.trim(),
        description: finalDescription,
        category,
        // Keep as social post on edit
        source: "post",
        type: "event",
        date: normalizedDate,
        date_start: normalizedDate,
        location: location || null,
        status: status || "published",
        image_url: imageUrl,
        cover_image_url: imageUrl,
        photo_urls: photoUrls,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[activities PUT] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, activity: updatedActivity });
  } catch (err: any) {
    console.error("[activities PUT] Exception:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la modification de l'activité." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: Delete activity (admin: any; bureau: own only)
// ---------------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { user, role, client } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis." }, { status: 400 });
    }

    // Fetch the activity to check ownership + get photo URLs for cleanup
    const { data: record } = await (client as any)
      .from("activities")
      .select("created_by, image_url, cover_image_url, photo_urls")
      .eq("id", id)
      .maybeSingle();

    if (!record) {
      return NextResponse.json({ error: "Activité introuvable." }, { status: 404 });
    }

    const rec = record as any;

    // Bureau / Non-admin members: can only delete own posts
    if (role !== "admin" && rec.created_by && rec.created_by !== user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que vos propres activités." },
        { status: 403 }
      );
    }

    // Clean up storage files
    const allUrls: string[] = [
      ...(rec.cover_image_url ? [rec.cover_image_url] : []),
      ...(rec.image_url ? [rec.image_url] : []),
      ...(Array.isArray(rec.photo_urls) ? rec.photo_urls : []),
    ];

    for (const url of allUrls) {
      if (url && url.includes("activity-images")) {
        try {
          const parts = url.split("activity-images/");
          if (parts[1]) {
            await client.storage.from("activity-images").remove([parts[1]]);
          }
        } catch (_) {
          // Non-blocking storage cleanup
        }
      }
    }

    const { error: deleteError } = await client
      .from("activities")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression de l'activité." },
      { status: 500 }
    );
  }
}
