"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getEventWithEnrollments } from "@/app/app/events/[id]/actions";
import { buildReportContent, formatReportAsText, type ReportContent } from "./report-builder";

export type EnsureReportResult =
  | { success: true; eventId: string }
  | { success: false; error: string };

export type UpdateNotesResult =
  | { success: true }
  | { success: false; error: string };

export type DeleteReportResult =
  | { success: true }
  | { success: false; error: string };

export type ReportListItem = {
  id: string;
  event_id: string;
  program_type: string;
  code: string;
  city: string;
  end_date: string | null;
  created_at: string;
};

export type ReportData = Awaited<ReturnType<typeof getEventWithEnrollments>> & {
  notes: string;
};

/** Ensure an event_reports row exists for this event; return eventId for redirect. Does not overwrite existing notes. */
export async function ensureReportForEvent(
  eventId: string
): Promise<EnsureReportResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("event_reports").insert({
    event_id: eventId,
    notes: "",
  });

  if (error) {
    if (error.code === "23505") {
      revalidatePath("/app/reports");
      revalidatePath(`/app/reports/${eventId}`);
      return { success: true, eventId };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/app/reports");
  revalidatePath(`/app/reports/${eventId}`);
  return { success: true, eventId };
}

/** Return report as plain text for download (e.g. from list page). */
export async function getReportText(eventId: string): Promise<string> {
  const data = await getReportData(eventId);
  const content = buildReportContent(data, data.enrollments, data.notes);
  return formatReportAsText(content);
}

/** Return report content for PDF download (e.g. from list page card). */
export async function getReportContent(eventId: string): Promise<ReportContent | null> {
  try {
    const data = await getReportData(eventId);
    return buildReportContent(data, data.enrollments, data.notes);
  } catch {
    return null;
  }
}

/** Fetch event + enrollments + report notes for the report page. */
export async function getReportData(eventId: string): Promise<ReportData> {
  const [eventWithEnrollments, { data: report }] = await Promise.all([
    getEventWithEnrollments(eventId, null),
    (await createClient())
      .from("event_reports")
      .select("notes")
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  return {
    ...eventWithEnrollments,
    notes: report?.notes ?? "",
  };
}

/** Update report notes by event_id. */
export async function updateReportNotes(
  eventId: string,
  notes: string
): Promise<UpdateNotesResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_reports")
    .update({ notes: notes ?? "", updated_at: new Date().toISOString() })
    .eq("event_id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/reports");
  revalidatePath(`/app/reports/${eventId}`);
  return { success: true };
}

/** Delete the report for this event (report disappears from list until generated again). */
export async function deleteReport(eventId: string): Promise<DeleteReportResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_reports")
    .delete()
    .eq("event_id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/app/reports");
  return { success: true };
}

/** List all reports with event info for the Reportes list page. */
export async function listReports(): Promise<ReportListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_reports")
    .select(
      "id, event_id, created_at, event:events(program_type, code, city, end_date)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  type Row = {
    id: string;
    event_id: string;
    created_at: string;
    event: { program_type: string; code: string; city: string; end_date: string | null } | { program_type: string; code: string; city: string; end_date: string | null }[] | null;
  };

  return (data ?? []).map((row: Row) => {
    const ev = Array.isArray(row.event) ? row.event[0] : row.event;
    return {
      id: row.id,
      event_id: row.event_id,
      program_type: ev?.program_type ?? "",
      code: ev?.code ?? "",
      city: ev?.city ?? "",
      end_date: ev?.end_date ?? null,
      created_at: row.created_at,
    };
  });
}
