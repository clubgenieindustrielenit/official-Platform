import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function computeInitials(name: string): string {
  if (!name) return "CG";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.trim().substring(0, 2).toUpperCase();
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: rawList, error } = await (supabase as any)
      .from("testimonials")
      .select("*")
      .eq("approved", true)
      .eq("rejected", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching public testimonials:", error);
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
      category: r.category || "autre",
      linkedin_url: r.linkedin_url || null,
      created_at: r.created_at,
    }));

    return NextResponse.json({ testimonials });
  } catch (err: any) {
    console.error("Public testimonials API error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de la récupération des témoignages." },
      { status: 500 }
    );
  }
}
