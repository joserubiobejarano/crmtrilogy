import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { programTypeToDisplay } from "@/lib/program-display";
import { ParticipantForm } from "./ParticipantForm";

export default async function FormEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = createServiceRoleClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, program_type, code, city, form_enabled")
    .eq("id", eventId)
    .single();

  if (error || !event?.id || event.form_enabled === false) {
    notFound();
  }

  const programLabel = programTypeToDisplay(event.program_type);
  const eventTitle = [programLabel, event.code, event.city].filter(Boolean).join(" ") || "Evento";

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Registro de participante</h1>
          <p className="text-muted-foreground">{eventTitle}</p>
        </header>
        <ParticipantForm eventId={eventId} eventTitle={eventTitle} />
      </div>
    </div>
  );
}
