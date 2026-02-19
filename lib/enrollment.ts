"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolveOrCreatePersonAndEnrollData = {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email: string;
  angel_name?: string;
  cantidad?: number | null;
};

export type ResolveOrCreatePersonAndEnrollOptions = {
  sourceFormSubmissionId?: string | null;
};

export type ResolveOrCreatePersonAndEnrollResult =
  | {
      success: true;
      personId: string;
      enrollmentId: string;
      personCreated: boolean;
    }
  | { success: false; error: string; duplicate?: boolean };

export async function resolveOrCreatePersonAndEnroll(
  supabase: SupabaseClient,
  eventId: string,
  data: ResolveOrCreatePersonAndEnrollData,
  options: ResolveOrCreatePersonAndEnrollOptions = {}
): Promise<ResolveOrCreatePersonAndEnrollResult> {
  const email = String(data.email ?? "").trim().toLowerCase();
  if (!email) {
    return { success: false, error: "El correo es obligatorio." };
  }

  const { data: existing } = await supabase
    .from("people")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  let personId: string;
  let personCreated = false;
  if (existing?.id) {
    personId = existing.id;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("people")
      .insert({
        first_name: String(data.first_name ?? "").trim() || null,
        last_name: String(data.last_name ?? "").trim() || null,
        phone: String(data.phone ?? "").trim() || null,
        email,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return {
        success: false,
        error: "No se pudo crear la persona. Inténtalo de nuevo.",
      };
    }
    personId = inserted.id;
    personCreated = true;
  }

  const enrollmentPayload: Record<string, unknown> = {
    event_id: eventId,
    person_id: personId,
    status: "pending_contract",
    angel_name: String(data.angel_name ?? "").trim() || null,
    cantidad: data.cantidad ?? null,
  };
  if (options.sourceFormSubmissionId != null) {
    enrollmentPayload.source_form_submission_id = options.sourceFormSubmissionId;
  }

  const { data: enrollmentInserted, error: enrollError } = await supabase
    .from("enrollments")
    .insert(enrollmentPayload)
    .select("id")
    .single();

  if (enrollError) {
    if (enrollError.code === "23505") {
      return {
        success: false,
        error: "Esta persona ya está inscrita en este evento.",
        duplicate: true,
      };
    }
    return {
      success: false,
      error: "No se pudo agregar al participante. Inténtalo de nuevo.",
    };
  }

  if (!enrollmentInserted?.id) {
    return { success: false, error: "No se pudo crear la inscripción." };
  }

  return {
    success: true,
    personId,
    enrollmentId: enrollmentInserted.id,
    personCreated,
  };
}
