import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

type ManageableRole = "admin" | "bureau" | "membre_bureau";

async function verifyCanManage(): Promise<
  | { ok: true; user: any; role: ManageableRole; client: ReturnType<typeof createClient> }
  | { ok: false; error: string; status: number }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Non authentifié.", status: 401 };
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
    return {
      ok: false,
      error: "Accès refusé. Seuls les administrateurs et membres du bureau peuvent gérer les témoignages.",
      status: 403,
    };
  }

  return { ok: true, user, role: role as ManageableRole, client: client as any };
}

function computeInitials(name: string): string {
  if (!name) return "CG";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.trim().substring(0, 2).toUpperCase();
}

// ---------------------------------------------------------------------------
// GET: Fetch all testimonials (for admin)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: rawList, error } = await (auth.client as any)
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const testimonials = (rawList || []).map((r: any) => ({
      id: r.id,
      quote: r.quote || "",
      author: r.author_name || r.author || "",
      author_name: r.author_name || r.author || "",
      role: r.author_role || r.role || "",
      author_role: r.author_role || r.role || "",
      avatar: computeInitials(r.author_name || r.author || ""),
      avatar_url: r.author_photo_url || r.avatar_url || null,
      author_photo_url: r.author_photo_url || r.avatar_url || null,
      category: r.category || "autre",
      linkedin_url: r.linkedin_url || null,
      is_published: r.approved === true && !r.rejected,
      approved: r.approved ?? true,
      rejected: r.rejected ?? false,
      created_at: r.created_at,
    }));

    return NextResponse.json({ testimonials });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des témoignages." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST: Create a new testimonial
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { quote, author, author_name, role, author_role, avatar_url, author_photo_url, category, linkedin_url, is_published } = body;

    const finalAuthor = (author || author_name || "").trim();
    const finalRole = (role || author_role || "").trim();
    const finalPhoto = avatar_url || author_photo_url || null;

    if (!quote?.trim() || !finalAuthor) {
      return NextResponse.json(
        { error: "La citation et le nom de l'auteur sont obligatoires." },
        { status: 400 }
      );
    }

    const isPub = is_published !== undefined ? is_published : true;

    const { data: newTestimonial, error: insertError } = await (auth.client as any)
      .from("testimonials")
      .insert({
        quote: quote.trim(),
        author_name: finalAuthor,
        author_role: finalRole || "",
        author_photo_url: finalPhoto,
        category: category || "autre",
        linkedin_url: linkedin_url || null,
        approved: isPub,
        rejected: !isPub,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const normalized = {
      id: newTestimonial.id,
      quote: newTestimonial.quote,
      author: newTestimonial.author_name,
      author_name: newTestimonial.author_name,
      role: newTestimonial.author_role || "",
      author_role: newTestimonial.author_role || "",
      avatar: computeInitials(newTestimonial.author_name),
      avatar_url: newTestimonial.author_photo_url,
      category: newTestimonial.category,
      linkedin_url: newTestimonial.linkedin_url,
      is_published: newTestimonial.approved === true && !newTestimonial.rejected,
      created_at: newTestimonial.created_at,
    };

    return NextResponse.json({ success: true, testimonial: normalized });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création du témoignage." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT: Update an existing testimonial
// ---------------------------------------------------------------------------
export async function PUT(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { id, quote, author, author_name, role, author_role, avatar_url, author_photo_url, category, linkedin_url, is_published } = body;

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis." }, { status: 400 });
    }

    const finalAuthor = (author || author_name || "").trim();
    const finalRole = (role || author_role || "").trim();
    const finalPhoto = avatar_url || author_photo_url || null;

    if (!quote?.trim() || !finalAuthor) {
      return NextResponse.json(
        { error: "La citation et le nom de l'auteur sont obligatoires." },
        { status: 400 }
      );
    }

    const isPub = is_published !== undefined ? is_published : true;

    const { data: updatedTestimonial, error: updateError } = await (auth.client as any)
      .from("testimonials")
      .update({
        quote: quote.trim(),
        author_name: finalAuthor,
        author_role: finalRole || "",
        author_photo_url: finalPhoto,
        category: category || "autre",
        linkedin_url: linkedin_url || null,
        approved: isPub,
        rejected: !isPub,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const normalized = {
      id: updatedTestimonial.id,
      quote: updatedTestimonial.quote,
      author: updatedTestimonial.author_name,
      author_name: updatedTestimonial.author_name,
      role: updatedTestimonial.author_role || "",
      author_role: updatedTestimonial.author_role || "",
      avatar: computeInitials(updatedTestimonial.author_name),
      avatar_url: updatedTestimonial.author_photo_url,
      category: updatedTestimonial.category,
      linkedin_url: updatedTestimonial.linkedin_url,
      is_published: updatedTestimonial.approved === true && !updatedTestimonial.rejected,
      created_at: updatedTestimonial.created_at,
    };

    return NextResponse.json({ success: true, testimonial: normalized });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la modification du témoignage." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: Delete a testimonial
// ---------------------------------------------------------------------------
export async function DELETE(request: Request) {
  try {
    const auth = await verifyCanManage();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "L'identifiant est requis." }, { status: 400 });
    }

    const { error: deleteError } = await (auth.client as any)
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression du témoignage." },
      { status: 500 }
    );
  }
}
