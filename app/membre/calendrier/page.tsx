import { createClient } from "@/lib/supabase/server";
import CalendarClient, { CalendarActivity } from "@/components/membre/calendrier/CalendarClient";
import { CalendarRange } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CalendrierPage() {
  const supabase = await createClient();

  // Fetch all activities (visites, formations, events, AGs) with pole details
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*, poles(id, name)")
    .order("date_start", { ascending: true });

  if (error) {
    console.error("Error fetching activities for calendar:", error);
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#181a1a] via-[#141515] to-[#121313] border border-[#2a2c2c] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#fca311] text-xs font-bold uppercase tracking-wider">
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Planning Officiel du Club</span>
          </div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Calendrier Interactif des Activités
          </h1>
          <p className="text-[#aaa] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Consultez les dates précises de toutes les visites industrielles, formations techniques, Assemblées Générales (AG), réunions et événements majeurs du Club GI ENIT.
          </p>
        </div>
      </div>

      <CalendarClient initialActivities={(activities as unknown as CalendarActivity[]) || []} />
    </div>
  );
}