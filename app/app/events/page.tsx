import { createClient } from "@/lib/supabase/server";
import { listCities, listProgramTypes } from "@/app/app/administration/actions";
import { NewEventButton } from "./NewEventModal";
import { EventsTable } from "./EventsTable";
import { processScheduledDeletions } from "./actions";
import type { EventRow } from "./types";

export default async function EventsPage() {
  await processScheduledDeletions();

  const supabase = await createClient();
  const [eventsResult, cities, programTypes] = await Promise.all([
    supabase.from("events").select("*").order("created_at", { ascending: false }),
    listCities(),
    listProgramTypes(),
  ]);

  const rows = (eventsResult.data ?? []) as EventRow[];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Entrenamientos</h2>
        <NewEventButton cities={cities} programTypes={programTypes} />
      </div>

      <EventsTable rows={rows} cities={cities} programTypes={programTypes} />
    </div>
  );
}
