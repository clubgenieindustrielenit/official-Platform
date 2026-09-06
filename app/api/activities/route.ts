import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  image_url?: string;
  photo_urls?: string[];
  category: "Workshop" | "Hackathon" | "Visite" | "Formation" | "Conférence" | "Autre";
  date: string;
  location?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  created_by?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const perPage = searchParams.get("per_page") ? parseInt(searchParams.get("per_page")!) : null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let activities: ActivityItem[] = [];
    let total = 0;

    if (supabaseUrl) {
      const client = serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey)
        : await createServerSupabase();

      let query = client
        .from("activities")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("date", { ascending: false });

      if (category && category !== "All" && category !== "Toutes") {
        query = query.eq("category", category);
      }

      if (limit) {
        query = query.limit(limit);
      } else if (perPage) {
        const from = (page - 1) * perPage;
        query = query.range(from, from + perPage - 1);
      }

      const { data, error, count } = await query;

      if (!error && data) {
        activities = data;
        total = count ?? data.length;
      }
    }

    return NextResponse.json({ activities, total });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des activités." },
      { status: 500 }
    );
  }
}
