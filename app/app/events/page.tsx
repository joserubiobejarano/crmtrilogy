import { createClient } from "@/lib/supabase/server";
import { NewEventButton } from "./NewEventModal";
import { EventsTable } from "./EventsTable";
import { processScheduledDeletions } from "./actions";
import type { EventRow } from "./types";

export default async function EventsPage() {
  await processScheduledDeletions();

  const supabase = await createClient();
  const { data: events = [] } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = events as EventRow[];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Entrenamientos</h2>
        <NewEventButton />
      </div>

      <EventsTable rows={rows} />
    </div>
  );
}
