import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export interface PartnerItem {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active?: boolean;
}

const DEFAULT_PARTNERS: PartnerItem[] = [
  { id: "p-wynsys", name: "WYNSYS", logo_url: "/partners/wynsys.png", display_order: 1, is_active: true },
  { id: "p-sotuver", name: "SOTUVER", logo_url: "/partners/sotuver.png", display_order: 2, is_active: true },
  { id: "p-tt", name: "Tunisie Telecom", logo_url: "/partners/tt.png", display_order: 3, is_active: true },
  { id: "p-masmoudi", name: "Masmoudi", logo_url: "/partners/masmoudi.png", display_order: 4, is_active: true },
  { id: "p-biat", name: "BIAT", logo_url: "/partners/biat.png", display_order: 5, is_active: true },
  { id: "p-kilani", name: "Kilani Groupe", logo_url: "/partners/kilani.png", display_order: 6, is_active: true },
  { id: "p-coficab", name: "COFICAB", logo_url: "/partners/coficab.png", display_order: 7, is_active: true },
  { id: "p-wevioo", name: "WEVIOO", logo_url: "/partners/wevioo.png", display_order: 8, is_active: true },
  { id: "p-bontaz", name: "BONTAZ", logo_url: "/partners/bontaz.png", display_order: 9, is_active: true },
  { id: "p-tpr", name: "TPR Aluminium", logo_url: "/partners/tpr.png", display_order: 10, is_active: true },
  { id: "p-talys", name: "TALYS", logo_url: "/partners/talys.png", display_order: 11, is_active: true },
  { id: "p-chez-soeurettes", name: "Chez Soeurettes", logo_url: "/partners/chez-soeurettes.png", display_order: 12, is_active: true },
  { id: "p-stb", name: "STB BANK", logo_url: "/partners/stb.png", display_order: 13, is_active: true },
  { id: "p-apave", name: "APAVE", logo_url: "/partners/apave.png", display_order: 14, is_active: true },
];

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let partners: PartnerItem[] = [];

    if (supabaseUrl) {
      const client = serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey)
        : await createServerSupabase();

      // Try partners table first
      try {
        const { data: tableData, error: tableErr } = await client
          .from("partners")
          .select("id, name, logo_url, website_url, display_order, is_active")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (!tableErr && tableData && tableData.length > 0) {
          partners = tableData;
        }
      } catch (_) {}

      // Fallback to site_settings if table returned nothing
      if (partners.length === 0) {
        try {
          const { data: settingData } = await client
            .from("site_settings")
            .select("setting_value")
            .eq("setting_key", "partners_list")
            .maybeSingle();

          if (settingData?.setting_value) {
            const parsed = JSON.parse(settingData.setting_value);
            if (Array.isArray(parsed) && parsed.length > 0) {
              partners = parsed.filter((p: any) => p.is_active !== false);
            }
          }
        } catch (_) {}
      }
    }

    if (partners.length === 0) {
      partners = DEFAULT_PARTNERS;
    }

    // Automatically split into two balanced rows for marquee
    const half = Math.ceil(partners.length / 2);
    const row1 = partners.slice(0, half);
    const row2 = partners.slice(half);

    return NextResponse.json({
      partners,
      row1,
      row2,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        partners: DEFAULT_PARTNERS,
        row1: DEFAULT_PARTNERS.slice(0, 7),
        row2: DEFAULT_PARTNERS.slice(7),
        error: err.message,
      },
      { status: 200 }
    );
  }
}
