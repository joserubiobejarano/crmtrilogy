"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateEventResult = { success: true } | { success: false; error: string };
export type SetActiveEventResult = { success: true } | { success: false; error: string };
export type UpdateEventResult = { success: true } | { success: false; error: string };
export type DuplicateEventResult =
  | { success: true; newEventId: string }
  | { success: false; error: string };

const VALID_PROGRAM_TYPES = ["PT", "LT", "TL"] as const;

function parseOptionalDate(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function createEvent(formData: FormData): Promise<CreateEventResult> {
  const program_type = String(formData.get("program_type") ?? "").trim().toUpperCase();
  const code = String(formData.get("code") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!VALID_PROGRAM_TYPES.includes(program_type as (typeof VALID_PROGRAM_TYPES)[number])) {
    return { success: false, error: "Selecciona un programa válido (PT, LT o TL)." };
  }
  if (!code) {
    return { success: false, error: "El número es obligatorio." };
  }
  if (!city) {
    return { success: false, error: "La ciudad es obligatoria." };
  }

  const start_date = parseOptionalDate(formData.get("start_date"));
  const end_date = parseOptionalDate(formData.get("end_date"));
  const coordinator = String(formData.get("coordinator") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("events").insert({
    program_type,
    code,
    city,
    coordinator,
    start_date,
    end_date,
    active: false,
  });

  if (error) {
    return { success: false, error: "No se pudo crear el evento. Inténtalo de nuevo." };
  }

  revalidatePath("/app/events");
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  formData: FormData
): Promise<UpdateEventResult> {
  const program_type = String(formData.get("program_type") ?? "").trim().toUpperCase();
  const code = String(formData.get("code") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const coordinator = String(formData.get("coordinator") ?? "").trim() || null;
  const entrenadores = String(formData.get("entrenadores") ?? "").trim() || null;
  const capitan_mentores = String(formData.get("capitan_mentores") ?? "").trim() || null;
  const mentores = String(formData.get("mentores") ?? "").trim() || null;
  const start_date = parseOptionalDate(formData.get("start_date"));
  const end_date = parseOptionalDate(formData.get("end_date"));

  if (!VALID_PROGRAM_TYPES.includes(program_type as (typeof VALID_PROGRAM_TYPES)[number])) {
    return { success: false, error: "Selecciona un programa válido (PT, LT o TL)." };
  }
  if (!code) {
    return { success: false, error: "El número es obligatorio." };
  }
  if (!city) {
    return { success: false, error: "La ciudad es obligatoria." };
  }

  const supabase = await createClient();
  const payload: {
    program_type: string;
    code: string;
    city: string;
    coordinator: string | null;
    entrenadores: string | null;
    capitan_mentores: string | null;
    mentores: string | null;
    start_date: string | null;
    end_date: string | null;
  } = {
    program_type,
    code,
    city,
    coordinator,
    entrenadores,
    capitan_mentores,
    mentores,
    start_date,
    end_date,
  };

  const { error } = await supabase.from("events").update(payload).eq("id", eventId);

  if (error) {
    return { success: false, error: "No se pudo actualizar el evento. Inténtalo de nuevo." };
  }

  revalidatePath("/app/events");
  revalidatePath(`/app/events/${eventId}`);
  return { success: true };
}

export type UpdateEventStaffResult =
  | { success: true }
  | { success: false; error: string };

export async function updateEventStaff(
  eventId: string,
  staff: {
    coordinator?: string | null;
    entrenadores?: string | null;
    capitan_mentores?: string | null;
    mentores?: string | null;
  }
): Promise<UpdateEventStaffResult> {
  const payload: Record<string, string | null> = {};
  if (staff.coordinator !== undefined) payload.coordinator = staff.coordinator?.trim() || null;
  if (staff.entrenadores !== undefined) payload.entrenadores = staff.entrenadores?.trim() || null;
  if (staff.capitan_mentores !== undefined) payload.capitan_mentores = staff.capitan_mentores?.trim() || null;
  if (staff.mentores !== undefined) payload.mentores = staff.mentores?.trim() || null;
  if (Object.keys(payload).length === 0) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.from("events").update(payload).eq("id", eventId);

  if (error) {
    return { success: false, error: "No se pudo guardar el staff." };
  }

  revalidatePath("/app/events");
  revalidatePath(`/app/events/${eventId}`);
  return { success: true };
}

export async function duplicateEvent(
  sourceEventId: string,
  formData: FormData
): Promise<DuplicateEventResult> {
  const program_type = String(formData.get("program_type") ?? "").trim().toUpperCase();
  const code = String(formData.get("code") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const coordinator = String(formData.get("coordinator") ?? "").trim() || null;
  const copyParticipants = formData.get("copy_participants") === "on" || formData.get("copy_participants") === "true";

  if (!VALID_PROGRAM_TYPES.includes(program_type as (typeof VALID_PROGRAM_TYPES)[number])) {
    return { success: false, error: "Selecciona un programa válido (PT, LT o TL)." };
  }
  if (!code) {
    return { success: false, error: "El número es obligatorio." };
  }
  if (!city) {
    return { success: false, error: "La ciudad es obligatoria." };
  }

  const supabase = await createClient();

  const { data: sourceEvent, error: fetchError } = await supabase
    .from("events")
    .select("id")
    .eq("id", sourceEventId)
    .single();

  if (fetchError || !sourceEvent) {
    return { success: false, error: "Evento de origen no encontrado." };
  }

  const { data: newEvent, error: insertError } = await supabase
    .from("events")
    .insert({
      program_type,
      code,
      city,
      coordinator,
      start_date: null,
      end_date: null,
      active: false,
    })
    .select("id")
    .single();

  if (insertError || !newEvent?.id) {
    return { success: false, error: "No se pudo crear el evento. Inténtalo de nuevo." };
  }

  if (copyParticipants) {
    const { data: rawSourceEnrollments } = await supabase
      .from("enrollments")
      .select(
        "id, person_id, status, attended, details_sent, confirmed, contract_signed, cca_signed, admin_notes, angel_name, city, health_doc_signed, tl_norms_signed, tl_rules_signed, cantidad, finalized"
      )
      .eq("event_id", sourceEventId);

    const sourceEnrollments =
      rawSourceEnrollments?.filter(
        (e: { status?: string }) => e.status !== "transferred_out"
      ) ?? [];

    if (sourceEnrollments.length > 0) {
      const enrollmentsToInsert = sourceEnrollments.map(
        (e: Record<string, unknown>) => ({
          event_id: newEvent.id,
          person_id: e.person_id,
          status: e.status ?? "pending_contract",
          attended: false,
          details_sent: false,
          confirmed: false,
          contract_signed: e.contract_signed ?? false,
          cca_signed: false,
          admin_notes: e.admin_notes ?? null,
          angel_name: e.angel_name ?? null,
          city: e.city ?? null,
          health_doc_signed: false,
          tl_norms_signed: false,
          tl_rules_signed: false,
          cantidad: null,
          finalized: false,
        })
      );

      const { error: enrollError } = await supabase
        .from("enrollments")
        .insert(enrollmentsToInsert);

      if (enrollError) {
        revalidatePath("/app/events");
        return {
          success: false,
          error: "Evento creado pero no se pudieron copiar los participantes.",
        };
      }

      const personIds = [
        ...new Set(
          (enrollmentsToInsert as { person_id: string }[]).map((e) => e.person_id)
        ),
      ];
      if (personIds.length > 0 && city) {
        await supabase.from("people").update({ city }).in("id", personIds);
      }

    }
  }

  revalidatePath("/app/events");
  return { success: true, newEventId: newEvent.id };
}

export async function setActiveEvent(formData: FormData): Promise<SetActiveEventResult> {
  const eventId = String(formData.get("eventId") ?? "").trim();
  if (!eventId) {
    return { success: false, error: "Falta el evento." };
  }

  const supabase = await createClient();
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("program_type, city")
    .eq("id", eventId)
    .single();

  if (fetchError || !event) {
    return { success: false, error: "Evento no encontrado." };
  }

  const { program_type, city } = event;

  const { error: updateOthersError } = await supabase
    .from("events")
    .update({ active: false })
    .eq("program_type", program_type)
    .eq("city", city);

  if (updateOthersError) {
    return { success: false, error: "No se pudo actualizar." };
  }

  const { error: updateActiveError } = await supabase
    .from("events")
    .update({ active: true })
    .eq("id", eventId);

  if (updateActiveError) {
    return { success: false, error: "No se pudo actualizar." };
  }

  revalidatePath("/app/events");
  return { success: true };
}

/** Form action wrapper that returns void for use in <form action={...}> */
export async function setActiveEventFormAction(formData: FormData): Promise<void> {
  await setActiveEvent(formData);
}

export type ScheduleEventDeletionResult =
  | { success: true }
  | { success: false; error: string };

export type CancelEventDeletionResult =
  | { success: true }
  | { success: false; error: string };

export async function scheduleEventDeletion(
  eventId: string
): Promise<ScheduleEventDeletionResult> {
  const supabase = await createClient();

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("events")
    .update({ scheduled_deletion_at: sevenDaysFromNow })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: "No se pudo programar la eliminación." };
  }

  revalidatePath("/app/events");
  return { success: true };
}

export async function cancelEventDeletion(
  eventId: string
): Promise<CancelEventDeletionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({ scheduled_deletion_at: null })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: "No se pudo cancelar la eliminación." };
  }

  revalidatePath("/app/events");
  return { success: true };
}

export async function processScheduledDeletions(): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: toDelete } = await supabase
    .from("events")
    .select("id")
    .not("scheduled_deletion_at", "is", null)
    .lte("scheduled_deletion_at", now);

  if (toDelete && toDelete.length > 0) {
    for (const event of toDelete) {
      await supabase.from("events").delete().eq("id", event.id);
    }
  }
}
