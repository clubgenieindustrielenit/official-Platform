import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { compressImageBuffer } from "@/lib/utils/serverImageCompressor";
import { validateImageFile } from "@/lib/validation/fileUpload";

export const dynamic = "force-dynamic";

export interface PartnerRecord {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PARTNERS: PartnerRecord[] = [
  { id: "p-wynsys", name: "WYNSYS", logo_url: "/partners/wynsys.png", website_url: "", display_order: 1, is_active: true },
  { id: "p-sotuver", name: "SOTUVER", logo_url: "/partners/sotuver.png", website_url: "", display_order: 2, is_active: true },
  { id: "p-tt", name: "Tunisie Telecom", logo_url: "/partners/tt.png", website_url: "", display_order: 3, is_active: true },
  { id: "p-masmoudi", name: "Masmoudi", logo_url: "/partners/masmoudi.png", website_url: "", display_order: 4, is_active: true },
  { id: "p-biat", name: "BIAT", logo_url: "/partners/biat.png", website_url: "", display_order: 5, is_active: true },
  { id: "p-kilani", name: "Kilani Groupe", logo_url: "/partners/kilani.png", website_url: "", display_order: 6, is_active: true },
  { id: "p-coficab", name: "COFICAB", logo_url: "/partners/coficab.png", website_url: "", display_order: 7, is_active: true },
  { id: "p-wevioo", name: "WEVIOO", logo_url: "/partners/wevioo.png", website_url: "", display_order: 8, is_active: true },
  { id: "p-bontaz", name: "BONTAZ", logo_url: "/partners/bontaz.png", website_url: "", display_order: 9, is_active: true },
  { id: "p-tpr", name: "TPR Aluminium", logo_url: "/partners/tpr.png", website_url: "", display_order: 10, is_active: true },
  { id: "p-talys", name: "TALYS", logo_url: "/partners/talys.png", website_url: "", display_order: 11, is_active: true },
  { id: "p-chez-soeurettes", name: "Chez Soeurettes", logo_url: "/partners/chez-soeurettes.png", website_url: "", display_order: 12, is_active: true },
  { id: "p-stb", name: "STB BANK", logo_url: "/partners/stb.png", website_url: "", display_order: 13, is_active: true },
  { id: "p-apave", name: "APAVE", logo_url: "/partners/apave.png", website_url: "", display_order: 14, is_active: true },
];

async function verifyAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverSupabase = await createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, user: null, error: "Non authentifié.", status: 401 };
  }

  const client = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : serverSupabase;

  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role || user.user_metadata?.role || "";

  if (role !== "admin" && role !== "bureau" && role !== "membre_bureau") {
    return {
      isAdmin: false,
      user,
      error: "Accès refusé. Privilèges requis.",
      status: 403,
    };
  }

  return { isAdmin: true, user, client };
}

/**
 * Reads partners list: tries partners table first, falls back to site_settings (key: 'partners_list')
 */
async function getStoredPartners(client: any): Promise<{ partners: PartnerRecord[]; source: "table" | "settings" }> {
  // Try table first
  try {
    const { data: tableData, error: tableErr } = await client
      .from("partners")
      .select("*")
      .order("display_order", { ascending: true });

    if (!tableErr && tableData && tableData.length > 0) {
      return { partners: tableData, source: "table" };
    }
  } catch (_) {}

  // Fallback to site_settings
  try {
    const { data: settingData } = await client
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "partners_list")
      .maybeSingle();

    if (settingData?.setting_value) {
      const parsed = JSON.parse(settingData.setting_value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { partners: parsed, source: "settings" };
      }
    }
  } catch (_) {}

  // If no saved list yet, save DEFAULT_PARTNERS in site_settings
  try {
    await client.from("site_settings").upsert(
      {
        setting_key: "partners_list",
        setting_value: JSON.stringify(DEFAULT_PARTNERS),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setting_key" }
    );
  } catch (_) {}

  return { partners: DEFAULT_PARTNERS, source: "settings" };
}

/**
 * Saves partners list to site_settings (and partners table if available)
 */
async function savePartners(client: any, list: PartnerRecord[]) {
  // Save to site_settings
  await client.from("site_settings").upsert(
    {
      setting_key: "partners_list",
      setting_value: JSON.stringify(list),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "setting_key" }
  );

  // Attempt sync with partners table if it exists
  try {
    await client.from("partners").upsert(list);
  } catch (_) {}
}

// GET: List all partners for admin
export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (!auth.isAdmin || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { partners } = await getStoredPartners(auth.client);
    return NextResponse.json({ partners });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des partenaires." },
      { status: 500 }
    );
  }
}

// POST: Add a new partner logo
export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.isAdmin || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const contentType = request.headers.get("content-type") || "";

    let name = "";
    let websiteUrl = "";
    let logoUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = (formData.get("name") as string) || "";
      websiteUrl = (formData.get("website_url") as string) || "";
      const directLogoUrl = formData.get("logo_url") as string | null;
      const file = formData.get("file") as File | null;

      if (directLogoUrl) {
        logoUrl = directLogoUrl;
      } else if (file && file.size > 0) {
        const validation = await validateImageFile(file, 10 * 1024 * 1024);
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: validation.status });
        }

        // Compress server-side without cropping
        const { buffer, contentType: outMime, extension } = await compressImageBuffer(
          validation.buffer,
          { quality: 90, format: "png" }
        );

        // Ensure storage bucket exists
        try {
          await client.storage.createBucket("partner-logos", { public: true });
        } catch (_) {}

        const fileName = `partner_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await client.storage
          .from("partner-logos")
          .upload(filePath, buffer, {
            contentType: outMime,
            upsert: true,
          });

        if (uploadError) {
          return NextResponse.json(
            { error: `Erreur d'upload: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const { data: pubData } = client.storage
          .from("partner-logos")
          .getPublicUrl(filePath);

        logoUrl = pubData.publicUrl;
      }
    } else {
      const body = await request.json();
      name = body.name || "";
      websiteUrl = body.website_url || "";
      logoUrl = body.logo_url || "";
    }

    if (!name.trim()) {
      return NextResponse.json(
        { error: "Le nom du partenaire est requis." },
        { status: 400 }
      );
    }

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Le logo du partenaire est requis." },
        { status: 400 }
      );
    }

    const { partners } = await getStoredPartners(client);
    const maxOrder = partners.reduce((max, p) => Math.max(max, p.display_order || 0), 0);

    const newPartner: PartnerRecord = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      logo_url: logoUrl,
      website_url: websiteUrl.trim() || null,
      display_order: maxOrder + 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedList = [...partners, newPartner];
    await savePartners(client, updatedList);

    return NextResponse.json({ success: true, partner: newPartner });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la création du partenaire." },
      { status: 500 }
    );
  }
}

// PUT: Update partner or batch reorder
export async function PUT(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.isAdmin || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const body = await request.json();
    const { partners } = await getStoredPartners(client);

    // Case 1: Batch reorder
    if (Array.isArray(body.items)) {
      const orderMap = new Map<string, number>(
        body.items.map((i: any) => [String(i.id), Number(i.display_order)])
      );
      const updatedList: PartnerRecord[] = partners
        .map((p) => (orderMap.has(p.id) ? { ...p, display_order: orderMap.get(p.id)! } : p))
        .sort((a, b) => Number(a.display_order) - Number(b.display_order));

      await savePartners(client, updatedList);
      return NextResponse.json({ success: true, partners: updatedList });
    }

    // Case 2: Update single partner
    const { id, name, website_url, is_active, display_order, logo_url } = body;
    if (!id) {
      return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
    }

    const updatedList = partners.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: name !== undefined ? name : p.name,
          website_url: website_url !== undefined ? website_url : p.website_url,
          logo_url: logo_url !== undefined ? logo_url : p.logo_url,
          is_active: is_active !== undefined ? is_active : p.is_active,
          display_order: display_order !== undefined ? display_order : p.display_order,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });

    await savePartners(client, updatedList);
    const updatedPartner = updatedList.find((p) => p.id === id);

    return NextResponse.json({ success: true, partner: updatedPartner });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la mise à jour." },
      { status: 500 }
    );
  }
}

// DELETE: Delete a partner
export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdmin();
    if (!auth.isAdmin || !auth.client) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { client } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
    }

    const { partners } = await getStoredPartners(client);
    const partner = partners.find((p) => p.id === id);

    if (partner?.logo_url && partner.logo_url.includes("partner-logos")) {
      try {
        const parts = partner.logo_url.split("partner-logos/");
        if (parts[1]) {
          await client.storage.from("partner-logos").remove([parts[1]]);
        }
      } catch (_) {}
    }

    const updatedList = partners.filter((p) => p.id !== id);
    await savePartners(client, updatedList);

    // Try deleting from partners table if it exists
    try {
      await client.from("partners").delete().eq("id", id);
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur lors de la suppression." },
      { status: 500 }
    );
  }
}
