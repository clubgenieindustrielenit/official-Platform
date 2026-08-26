import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import MemberResourcesClient, {
  MemberResource,
} from "@/components/membre/resources/MemberResourcesClient";

export const dynamic = "force-dynamic";

export default async function RessourcesPage() {
  const supabase = await createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, description, category, academic_year, file_url, drive_url, created_at, poles(name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Pédagogie & Bibliothèque Numérique</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Ressources & Supports Académiques
          </h1>
          <p className="text-[#aaa] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Accédez directement aux documents Google Drive, devoirs surveillés, examens et cours filtrés par niveau (1ère année GI et 2ème année GI).
          </p>
        </div>
      </div>

      <MemberResourcesClient initialResources={(resources as unknown as MemberResource[]) || []} />
    </div>
  );
}