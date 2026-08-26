import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EventDetailClient from "@/components/membre/activity/EventDetailClient";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .eq("type", "event")
    .maybeSingle();

  if (!activity) notFound();

  return (
    <div className="py-2">
      <EventDetailClient activity={activity as any} />
    </div>
  );
}