import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { validateImageFile, MAX_CAROUSEL_SIZE_BYTES } from "@/lib/validation/fileUpload";

// Helper to check if current logged in user is admin
async function verifyAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, error: "Non authentifié." };
  }

  // Use service role if available to check admin status, otherwise server client
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
    return { isAdmin: false, user, error: "Accès refusé. Privilèges Administrateur requis." };
  }

  return { isAdmin: true, user, client };
}

// GET: Fetch all hero carousel images ordered by display_order
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : await createServerSupabase();

    const { data: images, error } = await supabase
      .from("hero_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ images: images || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des images." },
      { status: 500 }
    );
  }
}

// POST: Upload and insert new image into hero_images
export async function POST(request: Request) {
  try {
    const { isAdmin, user, client, error: authError } = await verifyAdmin();
    if (!isAdmin || !client) {
      return NextResponse.json({ error: authError || "Accès refusé." }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";

    let imageUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const directUrl = formData.get("imageUrl") as string | null;

      if (directUrl) {
        imageUrl = directUrl;
      } else if (file) {
        // H-2 FIX: Validate file type via magic bytes before storage.
        // Prevents SVG (stored XSS) and MIME-spoofed uploads.
        const validation = await validateImageFile(file, MAX_CAROUSEL_SIZE_BYTES);
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: validation.status });
        }

        const { buffer, detectedMime, extension } = validation;
        const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
        const filePath = `carousel/${fileName}`;

        // Ensure bucket exists
        try {
          await client.storage.createBucket("hero-carousel", { public: true });
        } catch (bErr) {
          // Bucket might already exist
        }

        const { error: uploadError } = await client.storage
          .from("hero-carousel")
          .upload(filePath, buffer, {
            contentType: detectedMime, // use validated MIME, not client-supplied
            upsert: true,
          });

        if (uploadError) {
          // If storage fails, return error
          return NextResponse.json(
            { error: `Échec du stockage: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: publicUrlData } = client.storage
          .from("hero-carousel")
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }
    } else {
      const body = await request.json();
      imageUrl = body.imageUrl;
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "L'image est requise." }, { status: 400 });
    }

    // Determine highest display_order
    const { data: maxOrderData } = await client
      .from("hero_images")
      .select("display_order")
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newOrder = (maxOrderData?.display_order ?? -1) + 1;

    // Insert record
    const { data: newRecord, error: insertError } = await client
      .from("hero_images")
      .insert({
        image_url: imageUrl,
        display_order: newOrder,
        uploaded_by: user?.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, image: newRecord });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'ajout de l'image." },
      { status: 500 }
    );
  }
}

// PUT: Reorder images batch
export async function PUT(request: Request) {
  try {
    const { isAdmin, client, error: authError } = await verifyAdmin();
    if (!isAdmin || !client) {
      return NextResponse.json({ error: authError || "Accès refusé." }, { status: 403 });
    }

    const { items } = await request.json();
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Tableau d'éléments requis." }, { status: 400 });
    }

    // Update display_order for each item
    for (const item of items) {
      if (item.id && typeof item.display_order === "number") {
        await client
          .from("hero_images")
          .update({ display_order: item.display_order })
          .eq("id", item.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors du réordonnancement." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a hero image
export async function DELETE(request: Request) {
  try {
    const { isAdmin, client, error: authError } = await verifyAdmin();
    if (!isAdmin || !client) {
      return NextResponse.json({ error: authError || "Accès refusé." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis." }, { status: 400 });
    }

    // Get image record first to attempt storage file cleanup
    const { data: record } = await client
      .from("hero_images")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (record?.image_url && record.image_url.includes("hero-carousel")) {
      try {
        const parts = record.image_url.split("hero-carousel/");
        if (parts[1]) {
          await client.storage.from("hero-carousel").remove([parts[1]]);
        }
      } catch (stErr) {
        // Storage cleanup non-blocking
      }
    }

    const { error: deleteError } = await client
      .from("hero_images")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
