"use server";

import { headers } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { resolveOrCreatePersonAndEnroll } from "@/lib/enrollment";
import { writeAuditLog } from "@/lib/audit";
import {
  checkFormRateLimit,
  getClientIdentifier,
} from "@/lib/rate-limit";

export type SubmitParticipantFormResult =
  | { success: true }
  | { success: false; error: string; duplicate?: boolean };

const PAYMENT_METHOD_UI_TO_DB: Record<string, string> = {
  Square: "square",
  Afterpay: "afterpay",
  Zelle: "zelle",
  Cash: "cash",
  TDC: "tdc",
};

export async function submitParticipantForm(
  eventId: string,
  data: {
    first_name?: string;
    last_name?: string;
    last_name_2?: string;
    phone?: string;
    email: string;
    angel_name?: string;
    cantidad?: number | null;
    payment_method?: string;
  }
): Promise<SubmitParticipantFormResult> {
  const headersList = await headers();
  const clientId = getClientIdentifier(headersList);
  const { allowed } = checkFormRateLimit(clientId);
  if (!allowed) {
    return {
      success: false,
      error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
    };
  }

  const supabase = createServiceRoleClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, form_enabled")
    .eq("id", eventId)
    .single();

  if (eventError || !event?.id) {
    return { success: false, error: "Evento no encontrado o no válido." };
  }

  if (event.form_enabled === false) {
    return {
      success: false,
      error: "El registro para este evento no está disponible.",
    };
  }

  const payload = {
    first_name: String(data.first_name ?? "").trim() || undefined,
    last_name: String(data.last_name ?? "").trim() || undefined,
    phone: String(data.phone ?? "").trim() || undefined,
    email: String(data.email ?? "").trim(),
    angel_name: String(data.angel_name ?? "").trim() || undefined,
    cantidad: data.cantidad ?? null,
  };

  const { data: formRow, error: formInsertError } = await supabase
    .from("form_submissions")
    .insert({
      event_id: eventId,
      first_name: payload.first_name ?? null,
      last_name: payload.last_name ?? null,
      email: payload.email,
      phone: payload.phone ?? null,
      angel_name: payload.angel_name ?? null,
      source: "form",
      status: "pending",
    })
    .select("id")
    .single();

  if (formInsertError || !formRow?.id) {
    return {
      success: false,
      error: "No se pudo registrar la solicitud. Inténtalo de nuevo.",
    };
  }

  const result = await resolveOrCreatePersonAndEnroll(supabase, eventId, payload, {
    sourceFormSubmissionId: formRow.id,
  });

  if (result.success) {
    const { data: eventRow } = await supabase
      .from("events")
      .select("city")
      .eq("id", eventId)
      .single();
    if (eventRow?.city) {
      await supabase
        .from("people")
        .update({ city: eventRow.city })
        .eq("id", result.personId);
    }
  }

  if (!result.success) {
    await supabase
      .from("form_submissions")
      .update({
        status: result.duplicate ? "duplicate" : "rejected",
        processed_at: new Date().toISOString(),
      })
      .eq("id", formRow.id);
    return {
      success: false,
      error: result.error,
      duplicate: result.duplicate,
    };
  }

  await supabase
    .from("form_submissions")
    .update({
      enrollment_id: result.enrollmentId,
      person_id: result.personId,
      status: "processed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", formRow.id);

  if (result.personCreated) {
    await writeAuditLog(supabase, {
      entity_type: "person",
      entity_id: result.personId,
      action: "insert",
      changed_by: null,
      context: { event_id: eventId, source: "form", form_submission_id: formRow.id },
      changes: [],
    });
  }
  await writeAuditLog(supabase, {
    entity_type: "enrollment",
    entity_id: result.enrollmentId,
    action: "insert",
    changed_by: null,
    context: {
      event_id: eventId,
      person_id: result.personId,
      source: "form",
      form_submission_id: formRow.id,
    },
    changes: [],
  });

  if (data.payment_method) {
    const methodDb = PAYMENT_METHOD_UI_TO_DB[data.payment_method];
    if (methodDb) {
      await supabase.from("payments").insert({
        enrollment_id: result.enrollmentId,
        method: methodDb,
        amount: data.cantidad ?? null,
      });
    }
  }

  return { success: true };
}
